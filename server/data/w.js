const fs = require('fs');
const path = require('path');

let previousCount = 0;

function logWithTime(message) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${message}`);
}

function countJsonFiles() {
  fs.readdir('.', (err, files) => {
    if (err) {
      console.error('디렉토리 읽기 오류:', err);
      return;
    }

    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    const currentCount = jsonFiles.length;

    if (currentCount > previousCount) {
      logWithTime(`JSON 파일 개수 증가: ${previousCount} → ${currentCount}`);
    }

    previousCount = currentCount;
  });
}

// 5초마다 확인
setInterval(countJsonFiles, 60000);

// 최초 실행 시 바로 체크
countJsonFiles();
