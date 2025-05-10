# AutoDCS 프로젝트

자동화된 DCS(Distributed Control System) 관리를 위한 프로젝트입니다. 서버와 PWA(Progressive Web App) 클라이언트로 구성되어 있습니다.

## 프로젝트 구조

```
autoDCS/
├── server/              # 백엔드 서버
│   ├── main.js          # 서버 메인 코드
│   ├── mapping.json     # 데이터 매핑 설정
│   └── data/            # 서버 데이터 디렉토리
│
└── pwa/                 # 프론트엔드 PWA 클라이언트
    └── AutoDCS-PWA/
        ├── index.js     # PWA 메인 코드
        ├── public/      # 정적 파일
        └── resize.js    # 이미지 리사이징 도구
```

## 기능

- 서버 측 데이터 관리 및 API 제공
- PWA 클라이언트를 통한 모바일 친화적 인터페이스
- 푸시 알림 기능 제공

## 설치 방법

### 서버 설치

```bash
cd server
npm install
```

### PWA 클라이언트 설치

```bash
cd pwa/AutoDCS-PWA
npm install
```

## 실행 방법

### 서버 실행

```bash
cd server
node main.js
```

### PWA 클라이언트 실행

```bash
cd pwa/AutoDCS-PWA
npm start
```

## 개발 환경 설정

1. 이 저장소를 클론합니다:
   ```bash
   git clone https://github.com/your-username/autoDCS.git
   cd autoDCS
   ```

2. 서버와 PWA 클라이언트의 의존성을 설치합니다:
   ```bash
   cd server && npm install
   cd ../pwa/AutoDCS-PWA && npm install
   ```

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 기능 브랜치를 생성합니다: `git checkout -b feature/amazing-feature`
3. 변경사항을 커밋합니다: `git commit -m 'Add some amazing feature'`
4. 브랜치에 푸시합니다: `git push origin feature/amazing-feature`
5. Pull Request를 제출합니다.

## 라이센스

이 프로젝트는 ISC 라이센스 하에 배포됩니다. 