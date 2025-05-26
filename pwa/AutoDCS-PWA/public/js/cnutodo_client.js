    /* 다크모드 관련 */
    function setTheme(mode) {
      // 값을 저장
      localStorage.setItem('theme', mode);
      
      // 부드러운 전환을 위한 클래스 추가
      document.body.classList.add('theme-transition');
      
      if (mode === 'dark') {
        document.body.classList.add('dark-mode');
      } else if (mode === 'light') {
        document.body.classList.remove('dark-mode');
      } else if (mode === 'system') {
        // 시스템 설정 확인
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('dark-mode', prefersDark);
      }
      
      // 트랜지션이 완료된 후 클래스 제거
      setTimeout(() => {
        document.body.classList.remove('theme-transition');
      }, 300);
      
      // 테마 변경 이벤트 발생시켜 UI 갱신
      document.dispatchEvent(new CustomEvent('themeChanged', { detail: { mode } }));
      
      // 테마 변경 로깅
      logUserAction('theme_changed', { mode });
    }

    // 초기 테마 설정
    function initTheme() {
      const savedTheme = localStorage.getItem('theme') || 'system';
      setTheme(savedTheme);
      updateThemePreviewSelection(savedTheme);
      
      // 시스템 테마 변경 감지 개선
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        if (localStorage.getItem('theme') === 'system') {
          setTheme('system');
        }
      };
      
      // 최신 API 지원 확인 (Safari 대응)
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
      } else if (darkModeMediaQuery.addListener) {
        // 레거시 지원
        darkModeMediaQuery.addListener(handleSystemThemeChange);
      }
    }

    // 테마 토글 이벤트 제거 (themeToggle 요소가 없음)
    
    // 설정 화면의 테마 버튼 이벤트는 DOMContentLoaded 이벤트에서 일괄 등록

    // PWA 설치 여부 감지 함수
    function isPwaInstalled() {
      // standalone 모드 (Android, Windows)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // fullscreen 모드
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      
      // iOS의 경우 navigator.standalone 사용
      const isIOSInstalled = navigator.standalone;
      
      return isStandalone || isFullscreen || isIOSInstalled;
    }

    // PWA 설치 상태 표시 함수
    function updatePwaStatus() {
      const statusElement = document.getElementById('pwaStatusInfo');
      const installContainer = document.getElementById('pwaInstallContainer');
      
      if (!statusElement) return;
      
      if (isPwaInstalled()) {
        statusElement.textContent = '🎉 설치된 앱에서 실행 중입니다.';
        installContainer.style.display = 'none';
      } else {
        statusElement.textContent = '현재 웹 브라우저에서 실행 중입니다. 더 나은 사용 경험을 위해 앱으로 설치하세요.';
        
        // 설치 이벤트가 사용 가능한지 확인
        if (deferredPrompt) {
          installContainer.style.display = 'flex';
        } else {
          statusElement.textContent += ' (이 브라우저에서는 자동 설치가 지원되지 않습니다. 브라우저의 "홈 화면에 추가" 기능을 사용하세요.)';
          installContainer.style.display = 'none';
        }
      }
    }

    // PWA 설치 프롬프트 저장 변수
    let deferredPrompt;

    // 설치 이벤트 캡처
    window.addEventListener('beforeinstallprompt', (e) => {
      // 크롬 67 이전 버전에서 자동 표시 방지
      e.preventDefault();
      // 이벤트 저장
      deferredPrompt = e;
      // 설치 상태 업데이트
      updatePwaStatus();
    });

    // 설치 완료 감지
    window.addEventListener('appinstalled', () => {
      logUserAction('pwa_installed');
      deferredPrompt = null;
      updatePwaStatus();
    });

    // PWA 감지 이벤트 리스너
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      logUserAction('display_mode_changed', { 
        isStandalone: e.matches,
        isPwaInstalled: isPwaInstalled() 
      });
      updatePwaStatus();
    });

    // 페이지 로드 시 테마 초기화 및 이벤트 리스너 설정
    document.addEventListener('DOMContentLoaded', function() {
      // 테마 버튼 이벤트 등록
      Object.entries({
        'lightThemePreview': 'light',
        'darkThemePreview': 'dark',
        'systemThemePreview': 'system'
      }).forEach(([id, mode]) => {
        document.getElementById(id).addEventListener('click', () => {
          setTheme(mode);
          updateThemePreviewSelection(mode);
        });
      });

      // PWA 설치 여부 확인 및 로그
      const isPwa = isPwaInstalled();
      logUserAction('app_launched', { 
        isPwaInstalled: isPwa,
        launchMode: isPwa ? 'pwa' : 'browser'
      });
      
      // PWA 설치 버튼 이벤트 등록
      const installButton = document.getElementById('pwaInstallButton');
      if (installButton) {
        installButton.addEventListener('click', async () => {
          if (!deferredPrompt) {
            showSnackbar('설치 프롬프트를 표시할 수 없습니다.');
            return;
          }
          
          // 설치 프롬프트 표시
          deferredPrompt.prompt();
          
          // 결과 기다림
          const { outcome } = await deferredPrompt.userChoice;
          
          // 결과 로깅
          logUserAction('pwa_install_prompt_response', { outcome });
          
          // 응답 후 프롬프트 재사용 불가
          deferredPrompt = null;
          
          updatePwaStatus();
        });
      }

      // 설치 상태 표시 업데이트
      updatePwaStatus();

      initTheme();
      setupThemeChangeListener();
      
      const savedStudentNo = localStorage.getItem('studentno');
      if (!savedStudentNo) {
        window.location.hash = '#settings';
      }
      document.getElementById('todayDate').innerText = formatToday();
      renderView();
      updateToggleUI();
    });
    
    /* 달력 전역 */
let calYear   = new Date().getFullYear();
let calMonth  = new Date().getMonth();          // 0‑11
const calData = {};                             // {2025: [...]}
const CAL_TTL = 30 * 24 * 60 * 60 * 1000;   // ← 새 상수



function showSnackbar(msg, ms = 2500) {
  const sb = document.getElementById("snackbar");
  sb.textContent = msg;
  sb.classList.add("show");
  clearTimeout(showSnackbar._timer);
  showSnackbar._timer = setTimeout(() => {
    sb.classList.remove("show");
  }, ms);
}

/* localStorage TTL 30일 */
const MONTH_TTL = 30 * 24 * 60 * 60 * 1000;
     const lightTypeColors = {
        "콘텐츠": "rgb(248,226,142)",
        "토론": "rgb(245,212,150)",
        "자료실": "rgb(171,228,184)",
        "과제": "rgb(94,176,171)",
        "팀프로젝트": "rgb(128,175,227)",
        "퀴즈": "rgb(144,200,241)",
        "시험": "rgb(223,143,146)"
      };
      
     const darkTypeColors = {
        "콘텐츠": "rgb(176,135,0)",   // 더 어두운 노란색
        "토론": "rgb(153,98,56)",     // 더 어두운 주황색
        "자료실": "rgb(67,122,80)",    // 더 어두운 녹색
        "과제": "rgb(45,125,120)",     // 더 어두운 청록색
        "팀프로젝트": "rgb(46,90,140)", // 더 어두운 파란색
        "퀴즈": "rgb(58,110,153)",     // 더 어두운 하늘색
        "시험": "rgb(134,66,68)"       // 더 어두운 빨간색
     };
     
     function getTypeColors() {
       return document.body.classList.contains('dark-mode') ? darkTypeColors : lightTypeColors;
     }
     
    var currentTodoList = [];
    /* ==== 정렬 모드 전역 ==== */
    let viewMode = localStorage.getItem("todoViewMode") || "subject";

function updateToggleUI() {
  document.getElementById("toggleSubject").classList.toggle("active", viewMode==="subject");
  document.getElementById("toggleTime").classList.toggle("active", viewMode==="time");
}
 /* ---------------- 렌더 헬퍼 ---------------- */
 function renderCurrentView(list) {
  // 기존 제외 규칙 적용
  const filtered = list.filter(item => !isExcluded(item, "home"));

  // 뷰별 렌더 호출
  if (viewMode === "subject") {
    renderTodoList(filtered);
  } else {
    renderTodoListTime(filtered);
  }
}
    
    // 오늘 날짜 포맷 함수 (mm월 dd일 (요일) 형식)
    function formatToday() {
      const today = new Date();
      const mm = padZero(today.getMonth() + 1);
      const dd = padZero(today.getDate());
      const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
      const dayOfWeek = weekdays[today.getDay()];
      return `${mm}월 ${dd}일 (${dayOfWeek})`;
    }
    
    // 제외 규칙 관련 함수
    function getExclusionRules() {
      return JSON.parse(localStorage.getItem("exclusionRules") || "[]");
    }
    
    function setExclusionRules(rules) {
      localStorage.setItem("exclusionRules", JSON.stringify(rules));
    }
    
    function populateExclusionSubjects() {
  const sel = document.getElementById("exclusionSubject");
  sel.innerHTML = "";                         // 초기화

  // 첫 옵션: '전체'
  const optAll = document.createElement("option");
  optAll.value = "all";
  optAll.textContent = "전체";
  sel.appendChild(optAll);

  // 로컬 todoListData → 과목 목록 채우기
  const cache = localStorage.getItem("todoListData");
  if (!cache) return;

  const subjects = {};
  JSON.parse(cache).forEach(t => { subjects[t.course_nm] = true; });
  Object.keys(subjects).sort().forEach(name => {
    const o = document.createElement("option");
    o.value = name;
    o.textContent = name;
    sel.appendChild(o);
  });
}
    /* ───── ① 세부 항목 드롭다운 채우기 ───── */
function populateExclusionItems() {
  const subjSel = document.getElementById("exclusionSubject").value;
  const typeSel = document.getElementById("exclusionType").value;
  const itemSel = document.getElementById("exclusionItem");

  // 초기화
  itemSel.innerHTML = `
    <option value="all">전체</option>
  `;

  if (!subjSel || !typeSel) return;        // 둘 다 선택되어야 갱신

  // 현재 할일 목록에서 필터링
  const titles = {};
  currentTodoList.forEach(item => {
    if ((subjSel === "all" || item.course_nm === subjSel) &&
        (typeSel === "all" || item.type      === typeSel)) {
      titles[item.item_title_temp] = true;
    }
  });

  Object.keys(titles).sort().forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    itemSel.appendChild(opt);
  });
}

/* ───── ② 셀렉트 변경 이벤트로 드롭다운 갱신 ───── */
["exclusionSubject","exclusionType"].forEach(id => {
  document.getElementById(id).addEventListener("change", populateExclusionItems);
});

/* ───── ③ 제외 규칙 저장 로직 확장 ───── */
document.getElementById("addExclusionRuleButton").addEventListener("click", () => {
  const subject = document.getElementById("exclusionSubject").value;
  const type    = document.getElementById("exclusionType").value;
  const item    = document.getElementById("exclusionItem").value;
  const area    = document.getElementById("exclusionArea").value;

  if (!subject || !type || !item || !area) {
    showSnackbar("모든 항목을 선택하세요.");
    return;
  }

  let rules = getExclusionRules();
  const exists = rules.some(r => r.subject===subject && r.type===type &&
                                 r.item===item && r.area===area);
  if (exists) {
    showSnackbar("동일한 제외 규칙이 이미 존재합니다.");
    return;
  }
  rules.push({ subject, type, item, area });
  setExclusionRules(rules);
  renderExclusionRules();
  resetExclusionSelects();
});

function isExcluded(item, areaNeeded = "home") {
  // areaNeeded: "home" | "alarm" | "all"  (기본은 home 뷰)
  const rules = getExclusionRules();
  return rules.some(r =>
    (r.area === areaNeeded || r.area === "all") &&
    (r.subject === "all" || r.subject === item.course_nm) &&
    (r.type    === "all" || r.type    === item.type)      &&
    (r.item    === "all" || r.item    === item.item_title_temp)
  );
}

/* ───── ⑤ 목록 표시 함수(렌더)에서도 규칙 내용 업데이트 ───── */
/* ───── 표시용 라벨 매핑 ───── */
const LABEL_MAP = {
  all:        "전체",
  home:       "홈 화면",
  alarm:      "푸시 알림"
  // 유형(type)·세부 항목(item) 등은 이미 한글이므로 매핑 불필요
};

function toLabel(v) { 
  return LABEL_MAP[v] || v;           // 매핑 없으면 원문 유지
}

function renderExclusionRules() {
  const listDiv = document.getElementById("exclusionRulesList");
  listDiv.innerHTML = "";
  getExclusionRules().forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "exclusion-rule";
    
    const textSpan = document.createElement("span");
    textSpan.className = "exclusion-rule-text";
    textSpan.textContent = `[${toLabel(r.subject)}] / [${toLabel(r.type)}] / [${toLabel(r.item)}] / [${toLabel(r.area)}]`;
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "settings-btn settings-btn-danger";
    deleteBtn.textContent = "삭제";
    deleteBtn.onclick = () => deleteExclusionRule(i);
    
    div.appendChild(textSpan);
    div.appendChild(deleteBtn);
    listDiv.appendChild(div);
  });
}


function deleteExclusionRule(index) {
      let rules = getExclusionRules();
      rules.splice(index, 1);
      setExclusionRules(rules);
      renderExclusionRules();
    }
    
/* ───── 초기화 헬퍼 ───── */
function resetExclusionSelects() {
  // 과목·유형·영역 은 '전체' 로
  ["exclusionSubject", "exclusionType", "exclusionArea"].forEach(id => {
    document.getElementById(id).value = "all";
  });

  // 세부 항목 셀렉트는 옵션을 다시 '전체' 하나만 두고 선택
  const itemSel = document.getElementById("exclusionItem");
  itemSel.innerHTML = `<option value="all">전체</option>`;
  itemSel.value = "all";
}


    // 로딩 시, localStorage에 학번 없으면 설정 뷰, 오늘 날짜 표시
    document.addEventListener("DOMContentLoaded", function() {
      const savedStudentNo = localStorage.getItem("studentno");
      if (!savedStudentNo) {
        window.location.hash = "#settings";
      } else {
        // 학번이 저장되어 있으면 자동으로 데이터 가져오기
        fetchStudentInfo(savedStudentNo);
      }
      document.getElementById("todayDate").innerText = formatToday();
      renderView();
      updateToggleUI(); 
    });
    document.getElementById("toggleSubject").addEventListener("click", () => {
  if (viewMode !== "subject") {
    viewMode = "subject";
    localStorage.setItem("todoViewMode", viewMode);   // ★ 저장
    updateToggleUI();
    renderCurrentView(currentTodoList);
  }
});

document.getElementById("toggleTime").addEventListener("click", () => {
  if (viewMode !== "time") {
    viewMode = "time";
    localStorage.setItem("todoViewMode", viewMode);   // ★ 저장
    updateToggleUI();
    renderCurrentView(currentTodoList);
  }
});
    
    // 설정 뷰: 학번 저장 버튼 이벤트 처리
    document.getElementById("saveStudentNoButton").addEventListener("click", async function() {
      const studentNo = document.getElementById("studentnoInputSettings").value.trim();
      
      // 로깅
      logUserAction('student_number_saved', { 
        hasStudentNo: studentNo !== ''
      });

      if (studentNo === "") {
        showSnackbar("학번을 입력하세요.");
        return;
      }
      
      // 학번 평문 저장
      localStorage.setItem("studentno", studentNo);
      
      try {
        // 학번 해시 처리 및 저장
        const hashedStudentNo = await hashStudentNo(studentNo);
        localStorage.setItem("hashedStudentNo", hashedStudentNo);
        
        showSnackbar("학번 설정이 저장되었습니다.");
      
        // 서비스 워커 준비 및 구독 완료를 기다림
        const registration = await navigator.serviceWorker.ready;
        await subscribeUser(registration);
        
        // 구독 완료 후에 화면 전환 및 데이터 가져오기
        window.location.hash = "#main";
        fetchStudentInfo(studentNo);
      } catch (error) {
        console.error("구독 과정에서 오류 발생:", error);
        showSnackbar("알림 설정 중 오류가 발생했습니다.");
        // 오류가 발생해도 메인 화면으로 이동
        window.location.hash = "#main";
        fetchStudentInfo(studentNo);
      }
    });
    
    // 서비스워커 등록
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => console.log('서비스워커 등록 성공:', registration.scope))
          .catch(err => console.error('서비스워커 등록 실패:', err));
      });
    }
    
    // Utility 함수들
    function urlB64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
    
    function padZero(num) {
      return num < 10 ? '0' + num : num;
    }
    
    function parseDueDate(dueStr) {
      const year = dueStr.slice(0, 4);
      const month = dueStr.slice(4, 6);
      const day = dueStr.slice(6, 8);
      const hour = dueStr.slice(8, 10);
      const minute = dueStr.slice(10, 12);
      const second = dueStr.slice(12, 14);
      return new Date(year, parseInt(month) - 1, day, hour, minute, second);
    }
    
    function formatDueDate(date) {
      const month = padZero(date.getMonth() + 1);
      const day = padZero(date.getDate());
      const hours = padZero(date.getHours());
      const minutes = padZero(date.getMinutes());
      const weekdays = ['일','월','화','수','목','금','토'];
      const weekday = weekdays[date.getDay()];
      return `${month}.${day} (${weekday}) ${hours}:${minutes}`;
    }

// 1) 남은 시간 계산 헬퍼
function computeRemaining(from, to) {
  let diff = to - from;
  if (diff < 0) diff = 0;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * 1000 * 60 * 60 * 24;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 1000 * 60 * 60;
  const minutes = Math.floor(diff / (1000 * 60));
  return { days, hours, minutes };
}
    
// ── 공통 헬퍼: 그룹 헤더와 컨테이너 생성 ──
function appendGroupSection(parent, labelText) {
  // 1) header container
  const headerContainer = document.createElement('div');
  headerContainer.classList.add('group-header-container');
  // 2) header
  const groupHeader = document.createElement('div');
  groupHeader.classList.add('group-header');
  groupHeader.textContent = labelText;
  headerContainer.appendChild(groupHeader);
  parent.appendChild(headerContainer);
  // 3) 빈 group container 반환
  const groupContainer = document.createElement('div');
  groupContainer.classList.add('group-container');
  parent.appendChild(groupContainer);
  return groupContainer;
}

function buildSummary(dt) {
  const rem = computeRemaining(new Date(), dt);
  let remainingText;
  if (rem.days > 0) {
    remainingText = rem.hours > 0
      ? `${rem.days}일 ${rem.hours}시간 남음`
      : `${rem.days}일 남음`;
  } else if (rem.hours > 0) {
    remainingText = `${rem.hours}시간 남음`;
  } else {
    remainingText = `${rem.minutes}분 남음`;
  }
  const el = document.createElement('div');
  el.classList.add('todo-date');
  el.textContent = `~${formatDueDate(dt)}, ${remainingText}`;
  return el;
}


/* ── 과목별 뷰 ────────────────────────────────────────── */
function renderTodoList(todoList) {
  const resultDiv = document.getElementById("fetchResult");
  resultDiv.innerHTML = "";
  const typeColors = getTypeColors(); // 현재 모드에 맞는 색상 가져오기

  /* 1) 과목별 그룹화 */
  const grouped = {};
  todoList.forEach(item => {
    if (isExcluded(item)) return;
    (grouped[item.course_nm] ||= []).push(item);
  });

  /* 2) 과목 순서대로 출력 */
  Object.keys(grouped).sort().forEach(course => {
    const groupContainer = appendGroupSection(resultDiv, `📚 ${course}`);

    /* (과목 안) 마감시간별 그룹 */
    const byDue = {};
    grouped[course].forEach(it => (byDue[it.due_date] ||= []).push(it));

    Object.keys(byDue).sort().forEach(dueKey => {
      const subDiv = document.createElement("div");
      subDiv.classList.add("sub-section");

      const ul = document.createElement("ul");
      ul.classList.add("todo-ul");

      byDue[dueKey].forEach(item => {
        const li = document.createElement("li");
        li.classList.add("todo-item");

        /* ── ① 유형 배지 ── */
        const badgeW = document.createElement("span");
        badgeW.className = "badge-wrapper";
        const badge     = document.createElement("span");
        badge.className = "badge";
        badge.textContent = item.type;
        badge.style.backgroundColor = typeColors[item.type] || "gray";
        badgeW.appendChild(badge);
        li.appendChild(badgeW);

        /* ── ② 제목 + 추가제출 래퍼 ── */
        const wrap = document.createElement("div");
        wrap.className = "item-text-wrap";        // flex-column

        /* 제목 */
        const title = document.createElement("span");
        title.className = "item-title";
        title.textContent = item.item_title_temp;
        wrap.appendChild(title);

        /* 추가 제출 안내 */
        if (item.info && item.info !== item.due_date) {
          const infoDate  = parseDueDate(item.info);
          const rem       = computeRemaining(new Date(), infoDate);
          const remainStr = rem.days > 0
              ? `${rem.days}일 ${rem.hours}시간 남음`
              : `${rem.hours}시간 ${rem.minutes}분 남음`;
          const extra = document.createElement("span");
          extra.className = "item-extra";         // 파란색
          extra.textContent =
            `추가 제출: ~${formatDueDate(infoDate)}, ${remainStr}`;
          wrap.appendChild(extra);
        }

        li.appendChild(wrap);
        ul.appendChild(li);
      });

      subDiv.appendChild(ul);
      subDiv.appendChild(buildSummary(parseDueDate(dueKey)));
      groupContainer.appendChild(subDiv);
    });
  });
}

/* ── 시간순 뷰 ─────────────────────────────────────────── */
function renderTodoListTime(todoList) {
  const resultDiv = document.getElementById("fetchResult");
  resultDiv.innerHTML = "";
  const typeColors = getTypeColors(); // 현재 모드에 맞는 색상 가져오기

  /* 1) 날짜별 그룹 */
  const byDate = {};
  todoList.forEach(item => {
    if (isExcluded(item)) return;
    const d = parseDueDate(item.due_date);
    const key = `${padZero(d.getMonth() + 1)}월 ${padZero(d.getDate())}일 `
              + `(${["일","월","화","수","목","금","토"][d.getDay()]})`;
    (byDate[key] ||= []).push(item);
  });

  /* 2) 날짜 순서대로 */
  Object.keys(byDate).sort().forEach(dateKey => {
    const label = dateKey === formatToday().slice(0, 6) ? "오늘" : dateKey;
    const groupContainer = appendGroupSection(resultDiv, label);

    /* (날짜 안) 시간별 그룹 */
    const byTime = {};
    byDate[dateKey].forEach(item => {
      const t = parseDueDate(item.due_date);
      const tk = `${padZero(t.getHours())}:${padZero(t.getMinutes())}`;
      (byTime[tk] ||= []).push(item);
    });

    Object.keys(byTime).sort().forEach(timeKey => {
      const subDiv = document.createElement("div");
      subDiv.classList.add("sub-section");

      const ul = document.createElement("ul");
      ul.classList.add("todo-ul");

      byTime[timeKey].forEach(item => {
        const li = document.createElement("li");
        li.classList.add("todo-item");

        /* ① 배지 */
        const badgeW = document.createElement("span");
        badgeW.className = "badge-wrapper";
        const badge     = document.createElement("span");
        badge.className = "badge";
        badge.textContent = item.type;
        badge.style.backgroundColor = typeColors[item.type] || "gray";
        badgeW.appendChild(badge);
        li.appendChild(badgeW);

        /* ② 제목+추가제출 래퍼 */
        const wrap = document.createElement("div");
        wrap.className = "item-text-wrap";

        const title = document.createElement("span");
        title.className = "item-title";
        title.textContent = `${item.course_nm} - ${item.item_title_temp}`;
        wrap.appendChild(title);

        if (item.info && item.info !== item.due_date) {
          const infoDate  = parseDueDate(item.info);
          const rem       = computeRemaining(new Date(), infoDate);
          const remainStr = rem.days > 0
              ? `${rem.days}일 ${rem.hours}시간 남음`
              : `${rem.hours}시간 ${rem.minutes}분 남음`;
          const extra = document.createElement("span");
          extra.className = "item-extra";
          extra.textContent =
            `추가 제출: ~${formatDueDate(infoDate)}, ${remainStr}`;
          wrap.appendChild(extra);
        }

        li.appendChild(wrap);
        ul.appendChild(li);
      });

      subDiv.appendChild(ul);
      subDiv.appendChild(buildSummary(parseDueDate(byTime[timeKey][0].due_date)));
      groupContainer.appendChild(subDiv);
    });
  });
}

/* ---------------- 유형 한글 라벨 ---------------- */
const TYPE_LABEL = {
  "콘텐츠":"콘텐츠", "토론":"토론", "자료실":"자료실",
  "과제":"과제", "팀프로젝트":"팀프로젝트",
  "퀴즈":"퀴즈", "시험":"시험"
};

/**
 * 지정일(baseDate) 기준으로 '오늘/내일/n일 후 마감' 알림 한 줄을 생성합니다.
 * - 마감시간명시텍스트: "오늘 마감 " / "내일 마감 " / "n일 후 마감 " (항상 필수)
 * - 항목유형개수텍스트: "과제 2개 콘텐츠 1개" (일반 상황)
 * - 단일항목세부표시텍스트: "[유형]과목명: 제목" (해당 기간 일정이 1개일 때)
 *
 * @param {Date}   baseDate - 알림 기준일 (00:00 기준)
 * @param {Array}  todoList - 전체 할 일 목록
 * @returns {String}        - 최대 두 줄(각각 위 규칙)에 따른 알림 메시지
 */
 function formatPushMessageForDay(baseDate, todoList) {
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // (0) 알림 제외 규칙 적용(area="alarm")
  const filtered = todoList.filter(item => !isExcluded(item, "alarm"));

  // (1) 날짜 차이별로 버킷에 모으기
  const startOfDay = new Date(baseDate.getFullYear(),
                              baseDate.getMonth(),
                              baseDate.getDate());
  const buckets = {};  // { diffDays: [item, ...] }
  filtered.forEach(item => {
    const due = parseDueDate(item.due_date);
    const diff = Math.floor((new Date(due.getFullYear(), due.getMonth(), due.getDate()) - startOfDay) / ONE_DAY);
    if (diff < 0) return;
    (buckets[diff] ||= []).push(item);
  });

  // (2) 사용할 diff 순서: 0(오늘),1(내일),가장 작은>1(n일 후)
  const diffs = [];
  if (buckets[0]) diffs.push(0);
  if (buckets[1]) diffs.push(1);
  const future = Object.keys(buckets)
                       .map(Number)
                       .filter(d => d > 1)
                       .sort((a, b) => a - b)[0];
  if (future !== undefined) diffs.push(future);

  // (3) 각 diff마다 한 줄 메시지 생성
  const TYPE_LABEL = {
    "콘텐츠":"콘텐츠","토론":"토론","자료실":"자료실",
    "과제":"과제","팀프로젝트":"팀프로젝트",
    "퀴즈":"퀴즈","시험":"시험"
  };

  const makeLine = d => {
    // 3-1) 마감시간명시텍스트
    const deadlineLabel =
      d === 0 ? "[오늘 마감] " :
      d === 1 ? "[내일 마감] " :
                 `[${d}일 후 마감] `;

    const items = buckets[d];

    // 3-2) 단일항목세부표시텍스트 (일정이 1개일 때)
    if (items.length === 1) {
      const it = items[0];
      const detailText = `(${it.type})${it.course_nm}: ${it.item_title_temp}`;
      return deadlineLabel + detailText;
    }

    // 3-3) 항목유형개수텍스트 (일정이 2개 이상일 때)
    const counts = {};
    items.forEach(it => {
      const lbl = TYPE_LABEL[it.type] || it.type;
      counts[lbl] = (counts[lbl] || 0) + 1;
    });
    const countSummary = Object.entries(counts)
      .map(([k, n]) => `${k} ${n}개`)
      .join(" ");

    return deadlineLabel + countSummary;
  };

  // (4) 최대 두 줄 반환
  return diffs.slice(0, 2)
              .map(makeLine)
              .join("\n");
}

// 학번을 SHA-256 해시로 변환하는 함수 추가
function hashStudentNo(studentNo) {
  // SubtleCrypto API를 사용하여 SHA-256 해시 생성
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(studentNo))
    .then(hashBuffer => {
      // ArrayBuffer를 16진수 문자열로 변환
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
}

// 메인 데이터 조회 함수 수정
async function fetchStudentInfo(studentNo) {
  const startTime = performance.now();
  try {
    // 학번을 SHA-256 해시로 변환
    const hashedStudentNo = await hashStudentNo(studentNo);
    
    // 로그 전송 - 데이터 조회 시작
    logUserAction('data_fetch_started', { studentHash: hashedStudentNo.substring(0, 8) });
    
    // 해시된 학번으로 서버에 요청
    const response = await fetch("https://cnutodo.kro.kr/autodcs/fetch", {
    method: "GET",
      headers: { "hashedstudentno": hashedStudentNo }
    });
    
    if (!response.ok) {
      const errData = await response.json();
      
      // 오류 로깅
      const fetchTime = performance.now() - startTime;
      logUserAction('data_fetch_failed', { 
        error: errData.error || 'unknown',
        time: Math.round(fetchTime),
        status: response.status
      });
      
      showSnackbar(errData.error || "데이터 조회 중 오류가 발생했습니다.");
      
      // 데이터 조회 실패 시 안내 메시지 표시
      if (document.getElementById("view-main").classList.contains("active")) {
        document.getElementById("fetchResult").textContent = "";
        document.getElementById("viewToggle").style.display = "none";
        document.getElementById("noStudentNoGuide").style.display = "none";
        document.getElementById("noDataGuide").style.display = "block";
      }
      
      throw errData;
    }
    
    const data = await response.json();
    console.log("메인 화면 받은 데이터:", data);
    
    // 성공 로깅
    const fetchTime = performance.now() - startTime;
    logUserAction('data_fetch_success', { 
      time: Math.round(fetchTime),
      todoCount: data.todo_list ? data.todo_list.length : 0,
      hasData: !!(data.todo_list && data.todo_list.length)
    });

    if (data.todo_list && data.todo_list.length > 0) {
      // 1) 업데이트 시간 표시
      const updateElem = document.getElementById("updateInfo");
      updateElem.textContent = `업데이트: ${new Date(data.update_time).toLocaleString()}`;

      // 2) 이전 데이터와 비교하여 변경 여부 확인
      const cachedDataStr = localStorage.getItem("todoListData");
      const todoListChanged = !cachedDataStr || 
        JSON.stringify(data.todo_list) !== cachedDataStr;
        
      // 3) 알림 시간 변경 여부 확인
      const currentAlarmTime = localStorage.getItem("dailyAlarmTime") || "09:00";
      const lastUsedAlarmTime = localStorage.getItem("lastUsedAlarmTime") || "";
      const alarmTimeChanged = currentAlarmTime !== lastUsedAlarmTime;

      // 4) 할 일 목록 캐싱 및 렌더
      currentTodoList = data.todo_list;
    
      // 메인 뷰가 활성화된 경우에만 렌더링
      if (document.getElementById("view-main").classList.contains("active")) {
        renderCurrentView(currentTodoList);
        document.getElementById("viewToggle").style.display = "flex";
        document.getElementById("noStudentNoGuide").style.display = "none";
        document.getElementById("noDataGuide").style.display = "none";
      }
      
      localStorage.setItem("todoListData", JSON.stringify(currentTodoList));
      localStorage.setItem("todoUpdateTime", data.update_time);

      // 5) 데이터가 변경되었거나 알림 시간이 변경된 경우에만 알림 재등록
      if (todoListChanged || alarmTimeChanged) {
        let reason = "";
        if (todoListChanged) reason += "할 일 목록 변경";
        if (alarmTimeChanged) {
          reason += (reason ? ", " : "") + "알림 시간 변경";
        }
        console.log(`변경 감지(${reason}): 푸시 알림 재등록`);
        
        navigator.serviceWorker.ready.then(registration => {
          registration.pushManager.getSubscription().then(subscription => {
            if (!subscription) return;

            // (1) 사용자가 설정한 시각 (기본 09:00)
            const [hh, mm] = currentAlarmTime.split(":").map(Number);

            // (2) 첫 알림 시각: 오늘 hh:mm (이미 지났으면 내일)
            const now = new Date();
            let day = new Date(
              now.getFullYear(), now.getMonth(), now.getDate(),
              hh, mm, 0, 0
            );
            if (Date.now() > day.getTime()) {
              day.setDate(day.getDate() + 1);
            }

            // (3) 마지막 마감일 찾기
            let lastDue = new Date(0);
            currentTodoList.forEach(item => {
              const due = parseDueDate(item.due_date);
              if (due > lastDue) lastDue = due;
            });
            const limitDate = new Date(
              lastDue.getFullYear(), lastDue.getMonth(), lastDue.getDate(),
              hh, mm, 0, 0
            );

            // (4) 최대 14일(오늘 포함)까지만 예약
            const hardCap = new Date(day);
            hardCap.setDate(day.getDate() + 13);
            if (limitDate > hardCap) {
              limitDate.setTime(hardCap.getTime());
            }

            // (5) 하루씩 증가하며 예약 리스트 작성
            const pushAlarms = [];
            while (day <= limitDate) {
              pushAlarms.push({
                scheduledTime: day.getTime(),
                message      : formatPushMessageForDay(day, currentTodoList)
              });
              day.setDate(day.getDate() + 1);
            }

            // (6) 서버에 예약 전송 (서버가 기존 예약을 취소 후 재등록)
            fetch("/scheduleNotification", {
              method : "POST",
              headers: { "Content-Type": "application/json" },
              body   : JSON.stringify({ subscription, push_alarms: pushAlarms })
            }).then(() => {
              // 알림 등록 성공 시 마지막 사용 알림 시간 저장
              localStorage.setItem("lastUsedAlarmTime", currentAlarmTime);
              if (alarmTimeChanged) {
                console.log(`알림 시간 변경 적용 완료: ${currentAlarmTime}`);
              }
            });
          });
        });
      } else {
        console.log("변경 없음: 푸시 알림 재등록 생략");
      }

    } else {
      // 메인 뷰가 활성화된 경우에만 메시지 표시
      if (document.getElementById("view-main").classList.contains("active")) {
        document.getElementById("fetchResult").textContent = "";
        document.getElementById("updateInfo").textContent = "";
        document.getElementById("viewToggle").style.display = "none";
        document.getElementById("noStudentNoGuide").style.display = "none";
        document.getElementById("noDataGuide").style.display = "block";
      }
    }
  } catch (error) {
    console.error("메인 데이터 조회 실패:", error);
    showSnackbar(error.error || "데이터 조회 중 오류가 발생했습니다.");
    
    // 데이터 조회 실패 시 안내 메시지 표시
    if (document.getElementById("view-main").classList.contains("active")) {
      document.getElementById("fetchResult").textContent = "";
      document.getElementById("updateInfo").textContent = "";
      document.getElementById("viewToggle").style.display = "none";
      document.getElementById("noStudentNoGuide").style.display = "none";
      document.getElementById("noDataGuide").style.display = "block";
    }
  }
}

async function subscribeUser(registration) {
   const publicKey = "BOhDx6qmgOFoN0-TUSvl2KCC56XUIXY3svPqnfuSfMwLKDuspLNlnaSih8RTsDaAhyTe_C57QOzQ8Sm32cYrdUQ";

   /* Android = 'default' 일 때도 권한창이 안 뜨므로 명시적 click 이벤트 내에서만 호출 */
   const permission = await Notification.requestPermission();
   if (permission !== 'granted') {
     showSnackbar("알림 권한이 필요합니다.");
     updateNotificationStatus();
     return;
   }

   /* 이미 구독돼 있으면 재사용 → 중복 POST 차단  */
   let sub = await registration.pushManager.getSubscription();
   if (!sub) {
     sub = await registration.pushManager.subscribe({
       userVisibleOnly: true,
       applicationServerKey: urlB64ToUint8Array(publicKey)
     });
   }

   /* 서버에 구독 전송 */
   await fetch('/subscribe', {
     method : 'POST',
     headers: { 'Content-Type': 'application/json' },
     body   : JSON.stringify(sub)
   });

   showSnackbar("푸시 알림이 활성화되었습니다.");
   updateNotificationStatus();
   return sub; // 구독 객체 반환 추가
 }

    // 푸시 알림 구독 버튼 클릭 이벤트 - 더 이상 필요하지 않음
    
    // 푸시 알림 구독 해제 버튼 클릭 이벤트
    document.getElementById('unsubscribeButton').addEventListener('click', function() {
      logUserAction('notification_unsubscribe_clicked');
      
      navigator.serviceWorker.ready.then(function(registration) {
        unsubscribeUser(registration);
      });
    });
    
    // 알림 구독 해제 함수
    async function unsubscribeUser(registration) {
      try {
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          showSnackbar("이미 알림이 해제되어 있습니다.");
          updateNotificationStatus();
          return;
        }
        
        // 서버에 구독 해제 요청
        await fetch('/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        
        // 브라우저 구독 해제
        await subscription.unsubscribe();
        
        // 알림 시간 관련 로컬 스토리지 정리
        localStorage.removeItem("lastUsedAlarmTime");
        
        showSnackbar("푸시 알림이 해제되었습니다.");
        updateNotificationStatus();
      } catch (error) {
        console.error("알림 해제 중 오류 발생:", error);
        showSnackbar("알림 해제 중 오류가 발생했습니다.");
        updateNotificationStatus();
      }
    }
    
    navigator.serviceWorker.ready.then(reg => {
  reg.addEventListener('pushsubscriptionchange', () => subscribeUser(reg));
});
    // SPA 라우터: 해시 기반 뷰 전환 (메인 뷰는 캐시 데이터 사용)
    function renderView() {
      const hash = window.location.hash || "#main";
      document.getElementById("view-main").classList.remove("active");
      document.getElementById("view-calendar").classList.remove("active");
      document.getElementById("view-settings").classList.remove("active");
      document.getElementById("circleRefreshButton").style.display = "flex";

      if (hash === "#calendar") {
        document.getElementById("view-calendar").classList.add("active");
        document.getElementById("calendarDate").innerText = formatToday();
        document.getElementById("circleRefreshButton").style.display = "none";

        updateCalendar();         // ← 새 함수 호출
      } else if (hash === "#settings") {
        document.getElementById("view-settings").classList.add("active");
        document.getElementById("circleRefreshButton").style.display = "none";
        
        // 설정 화면에 진입할 때 알림 상태와 PWA 상태 업데이트
        updateNotificationStatus();
        updatePwaStatus();
        
        /* ▶ 저장된 학번이 있으면 바로 표시 */
        const studentInput = document.getElementById("studentnoInputSettings");
        const savedStudent = localStorage.getItem("studentno");
        if (savedStudent) studentInput.value = savedStudent;
        
        populateExclusionSubjects();
        renderExclusionRules();
      } else { // #main
          document.getElementById("view-main").classList.add("active");

          const savedStudentNo = localStorage.getItem("studentno");
          if (!savedStudentNo) {
            document.getElementById("fetchResult").textContent = "";
            document.getElementById("updateInfo").textContent = "";
            document.getElementById("viewToggle").style.display = "none";
            document.getElementById("noStudentNoGuide").style.display = "block";
            document.getElementById("noDataGuide").style.display = "none";
            return;
          }

          const cachedData = localStorage.getItem("todoListData");
          if (cachedData) {
            currentTodoList = JSON.parse(cachedData);
            renderCurrentView(currentTodoList);
            const ut = localStorage.getItem("todoUpdateTime");
            if (ut) {
              document.getElementById('updateInfo').textContent =
                `업데이트: ${new Date(ut).toLocaleString()}`;
            }
          } else {
            fetchStudentInfo(savedStudentNo);
          }
      }
    }
    

    const refreshBtn  = document.getElementById('circleRefreshButton');
    const refreshIcon = refreshBtn.querySelector('.refresh-icon');

    refreshBtn.addEventListener('click', () => {
      // 1) 애니메이션 리셋 & 재시작
      refreshIcon.classList.remove('spin');
      void refreshIcon.offsetWidth;         // reflow 강제
      refreshIcon.classList.add('spin');
      refreshIcon.addEventListener('animationend', () => {
        refreshIcon.classList.remove('spin');
      }, { once: true });

      // 2) 화면 클리어
      const resultDiv = document.getElementById('fetchResult');
      resultDiv.innerHTML = '';
      resultDiv.textContent = '데이터를 갱신하는 중입니다...';

      // 3) 백엔드 fetch(캐시 업데이트)
      const savedStudentNo = localStorage.getItem('studentno');
      if (savedStudentNo) fetchStudentInfo(savedStudentNo);
    });

    function expandPeriod(ev, baseYear) {
      console.log(ev, baseYear)
      const [startStr, endStr] = ev.date.split("~").map(s => s.trim());

      const parse = str => {
        const [mm, dd] = str.split("(")[0].split(".").map(Number);
        return { mm, dd };
      };

      const { mm: sm, dd: sd } = parse(startStr);
      const { mm: em, dd: ed } = parse(endStr);

      const start = new Date(baseYear, sm - 1, sd);

      /* 종료월이 시작월보다 작으면 연도 교차 → +1y */
      const endYear = (em < sm) ? baseYear + 1 : baseYear;
      const end = new Date(endYear, em - 1, ed);

      const days = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
       return days;
    }

    /* ===============================================
       학사일정 JSON을: ① localStorage 캐시 → ② 서버 fetch
       =============================================== */

    /* ───────── loadCalendarYear 수정본 ───────── */
    /**
     * 연도별 학사일정을 (1) 로컬캐시 → (2) 서버 순으로 로드한다.
     * - key: "calendar_<year>"
     * - value: { ts:Number, data:Array(12) }  // ts = 저장 시각
     */
     async function loadCalendarYear(year) {
      const key  = `calendar_${year}`;
      const now  = Date.now();

      /* ── 1) localStorage 캐시 확인 ─────────────────────────── */
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          const obj = JSON.parse(cached);
          if (now - obj.ts < CAL_TTL && Array.isArray(obj.data)) {
            calData[year] = obj.data;      // 메모리로 적재
            return;                        // ← 서버 fetch 건너뜀
          }
        } catch (e) {
          console.warn("학사일정 캐시 파싱 오류:", e);
        }
      }

      /* ── 2) 캐시 miss → 서버 fetch ────────────────────────── */
      const res    = await fetch(`/api/calendar?year=${year}`);
      const months = await res.json();   // [{monthKr, events:[...]}]

      // 0‒11월 배열 준비
      const map = Array.from({ length: 12 }, () => []);

      months.forEach(mo => {
        const originIdx = Number(mo.monthKr.slice(0, 2)) - 1;

        mo.events.forEach(ev => {
          if (ev.date.includes("~")) {
            // 기간 이벤트 전개
            expandPeriod(ev, year).forEach(dt => {
              const mi = dt.getMonth();
              if (!map[mi].some(x => x.date === ev.date && x.title === ev.title)) {
                map[mi].push(ev);
              }
            });
          } else {
            map[originIdx].push(ev);
          }
        });
      });

      calData[year] = map;                      // 메모리 적재
      localStorage.setItem(key, JSON.stringify({ ts: now, data: map })); // 디스크 저장
    }
    // ② renderCalendarMonth 함수: calData[year][monthIdx] 에서 뽑아 렌더링
    // ② renderCalendarMonth: calData[year][monthIdx]를 꺼내 달력 뷰에 렌더링
    function renderCalendarMonth(year, monthIdx) {
      const dest = document.getElementById("fetchResultCalendar");
      dest.innerHTML = "";

      /* 헤더(YYYY년 MM월) */
      document.getElementById("calHeader").textContent =
        `${year}년 ${String(monthIdx + 1).padStart(2, "0")}월`;

      /* 이번 달 이벤트 배열 */
      const events = (calData[year] || {})[monthIdx] || [];
      if (!events.length) {
        dest.textContent = "일정이 없습니다.";
        return;
      }

      /* ── 1. 정렬 함수 ─────────────────────────────── */

      // ① 시작일(범위 앞·단일 앞) "일" 값
      function getStartDay(ev) {
        const part = ev.date.split("~")[0].trim();       // 앞쪽 날짜
        const clean = part.split("(")[0];                // "MM.DD"
        const m = parseInt(clean.slice(0, 2), 10) - 1;   // 0‑11
        const d = parseInt(clean.slice(3, 5), 10);

        if (m < monthIdx) return 0;                      // 이전 달 → 최상단
        if (m > monthIdx) return 32;                     // 이후 달 → 최하단
        return d;
      }

      // ② 종료일(범위 뒤·단일 앞) "일" 값
      function getEndDay(ev) {
        const part = ev.date.includes("~")
          ? ev.date.split("~")[1].trim()                 // 범위 뒤쪽
          : ev.date.split("(")[0].trim();                // 단일 날짜
        const m = parseInt(part.slice(0, 2), 10) - 1;
        const d = parseInt(part.slice(3, 5), 10);

        if (m < monthIdx) return 0;
        if (m > monthIdx) return new Date(year, monthIdx + 1, 0).getDate();
        return d;
      }

      // ③ "시작일 → 종료일" 2‑단계 오름차순
      events.sort((a, b) => {
        const startDiff = getStartDay(a) - getStartDay(b);
        return startDiff !== 0 ? startDiff : getEndDay(a) - getEndDay(b);
      });

      /* ── 2. 렌더링 ────────────────────────────────── */
      const ul = document.createElement("ul");
      ul.classList.add("todo-ul");

      events.forEach(ev => {
        const li = document.createElement("li");
        li.classList.add("todo-item");

        const badgeW = document.createElement("span");
        badgeW.classList.add("badge-wrapper");
        const badge = document.createElement("span");
        badge.classList.add("badge");
        badge.textContent = ev.date;          // 기간 표시
        badgeW.appendChild(badge);
        li.appendChild(badgeW);

        const txt = document.createElement("span");
        txt.classList.add("item-text");
        txt.textContent = ev.title;
        li.appendChild(txt);

        ul.appendChild(li);
      });

      dest.appendChild(ul);

      /* 학기 진행도 갱신 */
      const bounds = getSemesterBounds(calData[new Date().getFullYear()]);
      if (bounds) {
        const fmt = d => `${d.getMonth() + 1}월 ${d.getDate()}일`;
        document.getElementById("startDateLabel").textContent = "개강: " + fmt(bounds.start);
        document.getElementById("endDateLabel").textContent = fmt(bounds.end) + " 종강";
      }
      animateSemesterProgress(bounds);
    }

    async function updateCalendar(){
      
      /* 필요한 연도 데이터가 없으면 로드 */
      if(!calData[calYear]) await loadCalendarYear(calYear);
      renderCalendarMonth(calYear, calMonth);
    }

    document.getElementById("prevMonth").addEventListener("click", async()=>{
      calMonth--;
      if(calMonth<0){ calMonth=11; calYear--; }
      await updateCalendar();
    });
    document.getElementById("nextMonth").addEventListener("click", async()=>{
      calMonth++;
      if(calMonth>11){ calMonth=0; calYear++; }
      await updateCalendar();


    });

    // 학기 구간(startDate, endDate) 찾기
    function getSemesterBounds(calendarMap) {
      const today = new Date();
      const m = today.getMonth() + 1;  // 1~12
      const y = today.getFullYear();
      // 1학기: 3~6월, 2학기: 9~12월
      let startEv, endEv;
      if (m >= 3 && m <= 6) {
        // 3월 개강, 6월 방학
        startEv = calendarMap[2].find(ev => ev.title.includes("개강"));
        endEv   = calendarMap[5].find(ev => ev.title.includes("방학"));
      } else if (m >= 9 && m <= 12) {
        startEv = calendarMap[8].find(ev => ev.title.includes("개강"));
        endEv   = calendarMap[11].find(ev => ev.title.includes("방학"));
      } else {
        return null;
      }
      if (!startEv || !endEv) return null;

      // "MM.DD" 앞부분 파싱
      const parseDate = (ev, monIdx) => {
        const mmdd = ev.date.split("~")[0].trim(); // 시작일만
        const [mm, dd] = mmdd.split("(")[0].split(".").map(Number);
        return new Date(y, mm - 1, dd);
      };

      const sDate = parseDate(startEv, null);
      let eDate;
      if (endEv.date.includes("~")) {
        // 종강이 "~" 뒷부분
        const mmdd = endEv.date.split("~")[1].trim();
        const [mm, dd] = mmdd.split("(")[0].split(".").map(Number);
        eDate = new Date(y, mm - 1, dd);
      } else {
        eDate = parseDate(endEv, null);
      }
      return { start: sDate, end: eDate };
    }

// 프로그레스바 업데이트 애니메이션
function animateSemesterProgress(bounds) {
  if (!bounds) {
    document.getElementById("semesterProgress").style.display = "none";
    return;
  }
  const { start, end } = bounds;
  const total = end - start;
  const fillEl = document.getElementById("progressFill");
  const textEl = document.getElementById("progressText");

  function update() {
    const now = Date.now();
    const pct = Math.max(0, Math.min(1, (now - start) / total));
    const pctText = (pct * 100).toFixed(6) + "%";
    fillEl.style.width = pct * 100 + "%";
    textEl.textContent = pctText;
  }
  // 매초 갱신
  update();
  clearInterval(animateSemesterProgress._timer);
  animateSemesterProgress._timer = setInterval(update, 100);
}

window.addEventListener("hashchange", renderView);
renderView();

// 다크모드 변경 감지 이벤트 추가
function setupThemeChangeListener() {
  // MutationObserver를 사용하여 dark-mode 클래스 추가/제거 감지
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'class') {
        // 현재 보여지는 뷰를 다시 렌더링
        if (currentTodoList.length > 0) {
          renderCurrentView(currentTodoList);
        }
      }
    });
  });
  
  observer.observe(document.body, { attributes: true });
}

// 테마 프리뷰 선택 상태 업데이트
function updateThemePreviewSelection(mode) {
  document.getElementById('lightThemePreview').classList.toggle('selected', mode === 'light');
  document.getElementById('darkThemePreview').classList.toggle('selected', mode === 'dark');
  document.getElementById('systemThemePreview').classList.toggle('selected', mode === 'system');
  
  // 선택된 테마를 로컬 스토리지에 저장
  localStorage.setItem('theme', mode);
}

// 알림 상태 확인 및 업데이트 함수
async function updateNotificationStatus() {
  const statusIndicator = document.getElementById('notificationStatusIndicator');
  const statusText = document.getElementById('notificationStatusText');
  
  try {
    // 서비스 워커 지원 확인
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      statusIndicator.className = 'status-indicator status-inactive';
      statusText.textContent = '이 브라우저는 푸시 알림을 지원하지 않습니다.';
      return;
    }
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      statusIndicator.className = 'status-indicator status-inactive';
      statusText.textContent = '알림이 설정되지 않았습니다.';
      return;
    }
    
    // 로컬 스토리지에서 알림 시간 확인
    const alarmTime = localStorage.getItem('dailyAlarmTime') || '09:00';
    
    // 구독이 있으면 항상 활성화 상태로 표시
    statusIndicator.className = 'status-indicator status-active';
    statusText.textContent = `알림 활성화됨 (매일 ${alarmTime})`;
  } catch (error) {
    console.error('알림 상태 확인 오류:', error);
    statusIndicator.className = 'status-indicator status-inactive';
    statusText.textContent = '알림 상태를 확인할 수 없습니다.';
  }
}

// 스토어 링크 복사 함수
function copyStoreLink() {
  const link = "http://store.cnutodo.kro.kr";
  navigator.clipboard.writeText(link).then(() => {
    showSnackbar("링크가 복사되었습니다.");
  }).catch(err => {
    console.error("링크 복사 실패:", err);
    showSnackbar("링크 복사에 실패했습니다.");
  });
}
