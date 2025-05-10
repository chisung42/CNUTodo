/* ───────────── 1. 의존성 ───────────── */
const express       = require('express');
const path          = require('path');
const webpush       = require('web-push');
const axios         = require('axios');
const cheerio       = require('cheerio');
const storage       = require('node-persist');

/* ───────────── 2. 상수 ───────────── */
const PORT = process.env.PORT || 8080;
const BLOCK_SIZE_MS      = 3 * 60 * 60 * 1000;   // 3시간
const BLOCK_LEAD_TIME_MS = 5 * 60 * 1000;        // 5분
const MAX_DELAY          = 2_147_483_647;        // setTimeout 한계 ≈24.8일

/* ───────────── 3. 전역 메모리 ───────────── */
let subscriptions    = [];            // [{endpoint, keys, ...}, ...]
const scheduledLoaders = {};          // key(block) → [timeoutId,...]

/* ───────────── 4. 헬퍼 ───────────── */
function scheduleAt(targetTime, fn) {
  const delay = targetTime - Date.now();
  if (delay <= 0) {
    fn();
  } else if (delay > MAX_DELAY) {
    setTimeout(() => scheduleAt(targetTime, fn), MAX_DELAY);
  } else {
    setTimeout(fn, delay);
  }
}

function sendPush(subscription, message) {
  const payload = JSON.stringify({
    title  : '사이버캠퍼스 일정을 확인해보세요!',
    message
  });
  webpush
    .sendNotification(subscription, payload)
    .catch(err => console.error('푸시 전송 실패:', err));
}

/* ───────────── 5. storage 초기화 & 복원 ───────────── */
(async () => {
  await storage.init({
    dir: path.join(__dirname, 'cache'),
    forgiveParseErrors: true
  });

  // 구독 복원
  const savedSubs = await storage.getItem('subscriptions');
  if (Array.isArray(savedSubs)) subscriptions = savedSubs;

  // 블록 로더 복원
  const keys = await storage.keys();
  const now  = Date.now();
  for (const k of keys) {
    if (!k.startsWith('alarms-')) continue;
    const [, encEnd, blockStr] = k.match(/^alarms-(.+)-(\d+)$/);
    const blockStart = Number(blockStr);
    const loaderTime = blockStart - BLOCK_LEAD_TIME_MS;
    if (now >= blockStart + BLOCK_SIZE_MS) {
      // 블록이 완전히 지난 경우는 버린다.
      await storage.removeItem(k);
      continue;
    }
    if (now >= loaderTime) {
      // 이미 5분 전을 지났으면 즉시 로드
      loadBlockAndSchedule(k, encEnd);
    } else {
      // 미래 로더 예약
      const id = scheduleAt(loaderTime, () => loadBlockAndSchedule(k, encEnd));
      scheduledLoaders[k] = [id];
    }
  }
})();

/* ───────────── 6. Express 설정 ───────────── */
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ───────────── 7. VAPID 키 ───────────── */
// 실제 서비스라면 환경 변수로
const vapidKeys = {
  publicKey:'BOhDx6qmgOFoN0-TUSvl2KCC56XUIXY3svPqnfuSfMwLKDuspLNlnaSih8RTsDaAhyTe_C57QOzQ8Sm32cYrdUQ',
  privateKey: 'RxNkiWr76ZcDTNfd5FUq51V7ZhIi9jSaXYBSiRrFSDc'
};
webpush.setVapidDetails('mailto:example@example.com', vapidKeys.publicKey, vapidKeys.privateKey);

/* ───────────── 8. 구독 관리 ───────────── */
app.post('/subscribe', async (req, res) => {
  const sub = req.body;
  const idx = subscriptions.findIndex(s => s.endpoint === sub.endpoint);
  if (idx !== -1) subscriptions[idx] = sub;
  else subscriptions.push(sub);
  await storage.setItem('subscriptions', subscriptions);
  res.sendStatus(200);
});

app.post('/unsubscribe', async (req, res) => {
  const sub = req.body;
  subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
  await storage.setItem('subscriptions', subscriptions);
  // 해당 endpoint 로더/타이머 제거
  const prefix = `alarms-${encodeURIComponent(sub.endpoint)}-`;
  Object.keys(scheduledLoaders).forEach(k => {
    if (k.startsWith(prefix)) {
      scheduledLoaders[k].forEach(clearTimeout);
      delete scheduledLoaders[k];
    }
  });
  res.sendStatus(200);
});

/* ───────────── 9. 알림 예약 API ───────────── */
app.post('/scheduleNotification', async (req, res) => {
  const { subscription, push_alarms } = req.body;
  if (!subscription || !push_alarms) {
    return res.status(400).json({ error: 'bad_request' });
  }

  /* ❶ 기존 블록·로더 전부 제거 (완전 덮어쓰기) */
  const endpointEnc = encodeURIComponent(subscription.endpoint);
  const prefix = `alarms-${endpointEnc}-`;
  const allKeys = await storage.keys();
  for (const k of allKeys) {
    if (k.startsWith(prefix)) {
      await storage.removeItem(k);               // 디스크 캐시 제거
      if (scheduledLoaders[k]) {                // 메모리 로더 제거
        scheduledLoaders[k].forEach(clearTimeout);
        delete scheduledLoaders[k];
      }
    }
  }

  /* ❷ 새 알림 저장 & 로더/즉시 스케줄 */
  const now = Date.now();

  for (const alarm of push_alarms) {
    const ts = Number(alarm.scheduledTime);
    const blockStart = ts - (ts % BLOCK_SIZE_MS);
    const key = `alarms-${endpointEnc}-${blockStart}`;

    // 2‑A. 디스크에 새 배열로 저장 (덮어쓰기)
    await storage.setItem(key, [alarm]);

    const loaderTime = blockStart - BLOCK_LEAD_TIME_MS;

    // 2‑B. 이미 5 분 전을 지났다면 즉시 스케줄
    if (now >= loaderTime) {
      scheduleAt(ts, () => sendPush(subscription, alarm.message));
      continue;
    }

    // 2‑C. 아직이면 로더 타이머 등록 (중복 체크)
    if (!scheduledLoaders[key]) {
      const id = scheduleAt(loaderTime, () => loadBlockAndSchedule(key, endpointEnc));
      scheduledLoaders[key] = [id];
    }
  }

  res.json({ ok: true });
});



/* ───────────── 10. 블록 로드 함수 ───────────── */
async function loadBlockAndSchedule(key, endpointEnc) {
  const list = (await storage.getItem(key)) || [];
  if (!list.length) return;
  // 대응 구독 객체 찾기
  const sub = subscriptions.find(s => encodeURIComponent(s.endpoint) === endpointEnc);
  if (!sub) return;

  for (const a of list) {
    scheduleAt(Number(a.scheduledTime), () => sendPush(sub, a.message));
  }
  await storage.removeItem(key);
}

/* ───────────── 11. 학사일정 API (이전과 동일) ───────────── */
async function crawlCalendar(year) {
  const url =
    `https://plus.cnu.ac.kr/_prog/academic_calendar/?site_dvs_cd=kr&menu_dvs_cd=05020101&year=${year}`;
  const { data: html } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Node.js)' } });
  const $ = cheerio.load(html);
  const tmp = [];
  $('.calen_box').each((_, box) => {
    const monthKr = $(box).find('.fl_month strong').text().trim();
    const monthEn = $(box)
      .find('.fl_month')
      .text()
      .replace(monthKr, '')
      .trim()
      .split(/\s+/)[0];
    const events = [];
    $(box)
      .find('ul > li')
      .each((_, li) => {
        const period = $(li).find('strong').text().trim();
        const title = $(li).find('span.list').text().trim();
        if (period && title) events.push({ date: period, title });
      });
    tmp.push({ monthKr, monthEn, events });
  });
  const dedup = [], seen = new Set();
  for (let i = tmp.length - 1; i >= 0; i--) {
    const m = parseInt(tmp[i].monthKr, 10);
    if (!seen.has(m)) {
      seen.add(m);
      dedup.unshift(tmp[i]);
    }
  }
  return dedup;
}

app.get('/api/calendar', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const key = `cal-${year}`;
  const cached = await storage.getItem(key);
  if (cached) return res.json(cached);
  try {
    const data = await crawlCalendar(year);
    await storage.setItem(key, data);
    res.json(data);
  } catch (e) {
    console.error('calendar crawl error:', e);
    res.status(500).json({ error: 'crawl_failed' });
  }
});

/* ───────────── 12. SPA fallback ───────────── */
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

/* ───────────── 13. 서버 시작 ───────────── */
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));