const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 9316//process.env.AUTODCS_PORT
const SECRET_KEY = process.env.AUTODCS_KEY

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// 데이터를 저장할 디렉토리 (todo_list 데이터 파일들이 저장됨)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// user id와 학번의 매핑 정보를 저장할 파일 경로 (새 구조: { userId: [hashedStudentNo, order_type] })
const mappingFilePath = path.join(__dirname, 'mapping.json');
// 매핑 파일이 없으면 초기화
if (!fs.existsSync(mappingFilePath)) {
  fs.writeFileSync(mappingFilePath, JSON.stringify({}));
}
// 로그 남기기
function FetchLog(kako_id, type) {
  // 한국 시간으로 변환 (UTC+9)
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const time = koreaTime.toISOString().replace('Z', '(KST)');
  console.log(`[${time}]`, kako_id, type);
}

// 비밀키 검증 미들웨어
function checkSecretKey(req, res, next) {
  const key = req.headers['x-secret-key'];
  if (!key || key !== SECRET_KEY) {
    return res.status(403).json({ error: "Unauthorized: invalid secret key." });
  }
  next();
}

// 헬퍼 함수: 매핑 파일 읽기
function loadMapping() {
  try {
    const data = fs.readFileSync(mappingFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    
    console.error("Mapping file 읽기 오류:", err);
    return {};
  }
}

// 헬퍼 함수: 매핑 파일 저장
function saveMapping(mapping) {
  fs.writeFileSync(mappingFilePath, JSON.stringify(mapping, null, 2));
}

// due_date ("YYYYMMDDHHMMSS")를 "MM-DD HH:MM" 형식으로 변환하는 기존 함수 (유지)
function formatDueDate(due) {
  if (due && due.length >= 12) {
    return due.substring(4,6) + "-" + due.substring(6,8) + " " + due.substring(8,10) + ":" + due.substring(10,12);
  }
  return due;
}

// 새 함수: due_date를 "MM-DD (요일) HH:MM" 형식으로 변환
function formatDueDateWithDay(due) {
  if (due && due.length >= 12) {
    const year = parseInt(due.substring(0, 4));
    const month = due.substring(4, 6);
    const day = due.substring(6, 8);
    const hour = due.substring(8, 10);
    const minute = due.substring(10, 12);
    const dateObj = new Date(year, parseInt(month)-1, parseInt(day), parseInt(hour), parseInt(minute));
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayLetter = days[dateObj.getDay()];
    return `${month}-${day} (${dayLetter}) ${hour}:${minute}`;
  }
  return due;
}

// update_time (ISO 형식)을 "MM/DD HH:mm 기준" 형식으로 변환하는 함수
function formatUpdateTime(updateTimeStr) {
  const updateTime = new Date(updateTimeStr);
  const month = ("0" + (updateTime.getMonth() + 1)).slice(-2);
  const day = ("0" + updateTime.getDate()).slice(-2);
  const hours = ("0" + updateTime.getHours()).slice(-2);
  const minutes = ("0" + updateTime.getMinutes()).slice(-2);
  return `${month}/${day} ${hours}:${minutes} 기준`;
}

// module_type 변환 매핑
const moduleTypeMapping = {
  LV: "콘텐츠",
  LD: "토론",
  LS: "자료실",
  LR: "과제",
  LT: "팀프로젝트",
  LQ: "퀴즈",
  LE: "시험"
};

/**
 * [등록/수정 엔드포인트] POST /mapping
 * payload.userRequest.user.id와 payload.userRequest.utterance(학번 평문)를 받아,
 * 학번을 SHA‑256 해시 처리한 값을 매핑의 첫 번째 요소로 저장하고, 신규 등록 시 order_type은 "과목"으로 초기화합니다.
 */
app.post('/mapping', checkSecretKey,(req, res) => {
  const payload = req.body;
  const userId = payload.userRequest && payload.userRequest.user && payload.userRequest.user.id;
  if (!userId) {
    return res.status(400).json({ error: 'User id가 payload에 존재하지 않습니다.' });
  }
  const studentNo = payload.userRequest && payload.userRequest.utterance;
  if (!studentNo) {
    return res.status(400).json({ error: 'Utterance(학번)이 payload에 존재하지 않습니다.' });
  }
  const hashedStudentNo = crypto.createHash('sha256').update(studentNo).digest('hex');
  const mapping = loadMapping();
  if (mapping[userId]) {
    if (mapping[userId][0] === hashedStudentNo) {
      return res.json({ message: '학번이 동일합니다. 업데이트가 필요하지 않습니다.', userId, studentNo, hashed: hashedStudentNo, order_type: mapping[userId][1] });
    } else {
      mapping[userId][0] = hashedStudentNo;
      if (!mapping[userId][1]) {
        mapping[userId][1] = "과목";
      }
      saveMapping(mapping);
      return res.json({ message: '학번 업데이트 성공', userId, studentNo, hashed: hashedStudentNo, order_type: mapping[userId][1] });
    }
  } else {
    mapping[userId] = [hashedStudentNo, "과목"];
    saveMapping(mapping);
    return res.json({ message: '학번 등록 성공', userId, studentNo, hashed: hashedStudentNo, order_type: "과목" });
  }
});

/**
 * [주문 유형 업데이트 엔드포인트] POST /skill/order
 * payload.userRequest.user.id와 payload.userRequest.utterance(주문 유형 텍스트)를 받아,
 * 매핑 파일의 해당 사용자의 두 번째 요소(order_type)를 업데이트합니다.
 */
app.post('/skill/order', checkSecretKey,(req, res) => {
  const payload = req.body;
  const userId = payload.userRequest && payload.userRequest.user && payload.userRequest.user.id;
  if (!userId) {
    return res.status(400).json({ error: 'User id가 payload에 존재하지 않습니다.' });
  }
  const orderType = payload.userRequest && payload.userRequest.utterance;
//  console.log("주문 유형:", orderType);
  if (!orderType) {
    return res.status(400).json({ error: 'Utterance(주문 유형)이 payload에 존재하지 않습니다.' });
  }
  const mapping = loadMapping();
  if (!mapping[userId]) {
    return res.status(400).json({ error: '등록된 학번 정보가 없습니다. 먼저 /mapping 엔드포인트를 통해 학번을 등록해 주세요.' });
  }
  mapping[userId][1] = orderType;
  saveMapping(mapping);
  res.json({ message: '주문 유형 업데이트 성공', userId, order_type: orderType });
  FetchLog(userId, "주문 유형 업데이트")
});

/**
 * [정보 저장 엔드포인트] POST /store
 * 해시 처리된 user_no와 todo_list, update_time 등을 포함한 JSON 데이터를 받아,
 * data/<user_no>.json 파일로 저장합니다.
 */
app.post('/store', (req, res) => {
  const data = req.body;
  if (!data.user_no) {
    return res.status(400).json({ error: 'user_no 값이 필요합니다.' });
  }
  
  const fileName = data.user_no + '.json';
  const filePath = path.join(dataDir, fileName);
  
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("파일 저장 오류:", err);
      return res.status(500).json({ error: '파일 저장 오류' });
    }
    //console.log(`저장 완료: ${fileName}`);
    res.json({ message: '데이터 저장 성공', user_no: data.user_no });

    FetchLog(data.user_no, "ToDoList 저장")
  });
});

/**
 * [데이터 조회 엔드포인트] GET /fetch
 * "studentno" 헤더에 평문 학번을 담아 요청하면, 학번을 해시 처리한 후 해당 파일의 JSON 데이터를 반환합니다.
 */
app.get('/fetch', (req, res) => {
  const studentNo = req.headers['studentno'];
  if (!studentNo) {
    return res.status(400).json({ 
      error: '학번이 제공되지 않았습니다.',
      message: '요청에 학번 정보가 포함되어 있지 않습니다. 학번을 입력한 후 다시 시도해주세요.' 
    });
  }
  
  const hashedStudentNo = crypto.createHash('sha256').update(studentNo).digest('hex');
  const fileName = hashedStudentNo + '.json';
  const filePath = path.join(dataDir, fileName);
  
  fs.readFile(filePath, 'utf8', (err, fileData) => {
    if (err) {
      console.error("파일 읽기 오류:", err);
      return res.status(404).json({ 
        error: `해당 학번으로 저장된 데이터가 없습니다.`,
        message: `학번 ${studentNo}에 해당하는 데이터를 찾을 수 없습니다. 학번을 확인하거나 먼저 데이터를 저장해주세요.` 
      });
    }
    try {
      const jsonData = JSON.parse(fileData);
      res.json(jsonData);
    } catch (error) {
      console.error("JSON 파싱 오류:", error);
      res.status(500).json({ 
        error: '저장된 데이터를 불러올 수 없습니다.',
        message: '데이터 형식에 문제가 있습니다. 관리자에게 문의하세요.' 
      });
    }
    //FetchLog(studentNo, "평문 학번 ToDoList 조회")
  });
});

/**
 * [Kakao 챗봇 스킬 엔드포인트] POST /skill
 * payload.userRequest.user.id를 사용해 매핑된 학번(해시 처리된 값)과 주문 유형(order_type)을 조회한 후,
 * order_type에 따라 todo_list 데이터를 다른 방식으로 포맷하여 응답합니다.
 *
 * - "과목": 각 course별 그룹화하여, 각 course 내에서 type별로 그룹화하고,
 *          동일한 due_date 그룹 내 항목들은 bullet 리스트로 나열하며, 
 *          due_date는 formatDueDateWithDay()를 사용하여 (~MM-DD (요일) HH:MM) 형식으로 표시.
 *
 * - "날짜": todo_list를 due_date 기준 오름차순으로 정렬하고, 각 due_date 그룹의 헤더를 
 *          ⏰(MM-DD (요일) HH:MM) 형식으로 표시한 후, 그룹 내 항목들을 course_nm과 type별로 나열합니다.
 *
 * - "유형": 기존 방식(유형별 그룹화)
 *
 * 마지막 줄에 update_time을 "MM/DD HH:mm 기준" 형식으로 추가합니다.
 */
app.post('/skill', checkSecretKey,(req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const payload = req.body;
  const userId = payload.userRequest && payload.userRequest.user && payload.userRequest.user.id;
  if (!userId) {
    return res.send(JSON.stringify({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: "User id가 제공되지 않았습니다." } }] }
    }));
  }
  const mapping = loadMapping();
  const studentNo = mapping[userId] ? mapping[userId][0] : null;
  const orderType = mapping[userId] ? mapping[userId][1] : "과목"; // 기본값 "과목"
  if (!studentNo) {
    return res.send(JSON.stringify({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: "등록된 학번 정보가 없습니다. 학번을 등록해 주세요." } }] }
    }));
  }
  const fileName = studentNo + '.json';
  const filePath = path.join(dataDir, fileName);
  
  fs.readFile(filePath, 'utf8', (err, fileData) => {
    let responseText = "";
    if (err) {
      console.error("파일 읽기 오류:", err);
      responseText = "저장된 데이터가 없습니다.";
      return res.send(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: responseText } }] }
      }));
    }
    try {
      const jsonData = JSON.parse(fileData);
      
      if (jsonData.todo_list && Array.isArray(jsonData.todo_list) && jsonData.todo_list.length > 0) {
        if (orderType === "과목") {
          // "과목" 포맷: course별 그룹화, 각 course 내에서 type별 그룹화 및 due_date 그룹화
          const groupedCourses = {};
          jsonData.todo_list.forEach(item => {
            const course = item.course_nm;
            if (!groupedCourses[course]) {
              groupedCourses[course] = [];
            }
            groupedCourses[course].push(item);
          });
          for (const course in groupedCourses) {
            responseText += "📚" + course + "\n";
            const typeGroups = {};
            groupedCourses[course].forEach(item => {
              const key = `${item.type}||${item.due_date}`;
              if (!typeGroups[key]) {
                typeGroups[key] = [];
              }
              typeGroups[key].push(item.item_title_temp);
            });
            for (const key in typeGroups) {
              const [type, due] = key.split('||');
              // 날짜 포맷: (~MM-DD (요일) HH:MM)
              const formattedDue = formatDueDateWithDay(due);
              const titles = typeGroups[key].join("\n• ");
              responseText += `[${type}]\n`;
              responseText += `• ${titles}\n`;
              responseText += `(~${formattedDue})\n\n`;
            }
          }
        } else if (orderType === "날짜") {
          // "날짜" 포맷: todo_list를 due_date 기준 오름차순 정렬 후, due_date별로 그룹화
          let sortedList = jsonData.todo_list.slice().sort((a, b) => a.due_date.localeCompare(b.due_date));
          const groupsByDue = {};
          sortedList.forEach(item => {
            const due = item.due_date;
            if (!groupsByDue[due]) {
              groupsByDue[due] = [];
            }
            groupsByDue[due].push(item);
          });
          for (const due of Object.keys(groupsByDue).sort((a, b) => a.localeCompare(b))) {
            // 헤더: ⏰(MM-DD (요일) HH:MM)
            const formattedDue = formatDueDateWithDay(due);
            responseText += `⏰[${formattedDue}]\n`;
            // 그룹 내 항목들을 course_nm별로 그룹화
            const courses = {};
            groupsByDue[due].forEach(item => {
              const course = item.course_nm;
              if (!courses[course]) {
                courses[course] = [];
              }
              courses[course].push(item);
            });
            for (const course in courses) {
              responseText += `[${course}]\n`;
              // 그룹화: type별
              const types = {};
              courses[course].forEach(item => {
                const type = item.type;
                if (!types[type]) {
                  types[type] = [];
                }
                types[type].push(item.item_title_temp);
              });
              for (const type in types) {
                responseText += `${type}:\n`;
                types[type].forEach(title => {
                  responseText += `• ${title}\n`;
                });
              }
              responseText += "\n";
            }
            responseText += "\n";
          }
        } else if (orderType === "유형") {
          // "유형" 포맷: type별 그룹화, 각 그룹 내 항목은 course_nm - item_title_temp (기한: formattedDue) 형태로 출력
          const groupedByType = {};
          jsonData.todo_list.forEach(item => {
            const type = item.type;
            if (!groupedByType[type]) {
              groupedByType[type] = [];
            }
            groupedByType[type].push(item);
          });
          for (const type in groupedByType) {
            responseText += `[${type}]\n`;
            groupedByType[type].forEach(item => {
              responseText += `• ${item.course_nm} - ${item.item_title_temp} (기한: ${formatDueDate(item.due_date)})\n`;
            });
            responseText += "\n";
          }
        } else {
          // 기본 "과목" 포맷 사용
          const groupedCourses = {};
          jsonData.todo_list.forEach(item => {
            const course = item.course_nm;
            if (!groupedCourses[course]) {
              groupedCourses[course] = [];
            }
            groupedCourses[course].push(item);
          });
          for (const course in groupedCourses) {
            responseText += "📚" + course + "\n";
            const typeGroups = {};
            groupedCourses[course].forEach(item => {
              const key = `${item.type}||${item.due_date}`;
              if (!typeGroups[key]) {
                typeGroups[key] = [];
              }
              typeGroups[key].push(item.item_title_temp);
            });
            for (const key in typeGroups) {
              const [type, due] = key.split('||');
              const formattedDue = formatDueDateWithDay(due);
              const titles = typeGroups[key].join(", ");
              responseText += `[${type}]\n`;
              responseText += `• ${titles}\n`;
              responseText += `(~${formattedDue})\n\n`;
            }
          }
        }
      } else {
        responseText = "저장된 데이터가 없습니다.";
      }
      // 마지막 줄에 update_time 추가 (MM/DD HH:mm 기준)
      if (jsonData.update_time) {
        responseText += `[${formatUpdateTime(jsonData.update_time)}]`;
      }
      return res.send(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: responseText } }] }
      }));
    } catch (error) {
      console.error("JSON 파싱 오류:", error);
      return res.send(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: "저장된 데이터 파싱 오류" } }] }
      }));
    }
  });
  FetchLog(studentNo, "카톡 투두 조회")
});

app.listen(port, () => {
  console.log(`서버가 내부 포트 ${port}에서 실행 중입니다.`);
});