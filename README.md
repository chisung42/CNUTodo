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
├── pwa/                 # 프론트엔드 PWA 클라이언트
│   └── AutoDCS-PWA/
│       ├── index.js     # PWA 메인 코드
│       ├── ga-server.js # 구글 애널리틱스 연동 모듈
│       ├── public/      # 정적 파일
│       └── resize.js    # 이미지 리사이징 도구
│
├── .gitignore           # Git 무시 파일 설정
├── README.md            # 프로젝트 설명서
├── GITHUB_SETUP.md      # GitHub 설정 가이드
├── GITHUB_AUTH_GUIDE.md # GitHub 인증 가이드
└── SETUP_COMMANDS.sh    # 자동 설정 스크립트
```

## 기능

- 서버 측 데이터 관리 및 API 제공
- PWA 클라이언트를 통한 모바일 친화적 인터페이스
- 푸시 알림 기능 제공
- GitHub를 통한 효율적인 코드 관리
- 구글 애널리틱스 통합 대시보드

## 설치 방법

### GitHub에서 클론

```bash
git clone https://github.com/chisung42/autoDCS_PWA.git
cd autoDCS_PWA
```

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

## 구글 애널리틱스 설정 방법

### 1. 필요한 라이브러리 설치

```bash
cd pwa/AutoDCS-PWA
npm install @google-analytics/data node-fetch
```

### 2. 구글 애널리틱스 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트를 생성합니다.
2. [Google Analytics](https://analytics.google.com/)에서 계정과 데이터 스트림을 설정합니다.
3. Google Cloud Console에서 서비스 계정을 생성합니다:
   - IAM & 관리 > 서비스 계정 > 서비스 계정 만들기
   - 적절한 권한 부여(Analytics 읽기 권한)
   - 키 생성(JSON 형식)
4. 생성된 서비스 계정 키 파일을 프로젝트의 안전한 위치에 복사합니다.

### 3. 환경 변수 설정

`ga-config.example.json` 파일을 `ga-config.json`으로 복사하고, 다음 정보를 수정합니다:

```bash
cp pwa/AutoDCS-PWA/ga-config.example.json pwa/AutoDCS-PWA/ga-config.json
```

그리고 다음 정보를 채워넣습니다:
- propertyId: GA4 속성 ID (G-XXXXXXXXXX 형식)
- apiSecret: GA4 API 시크릿 키
- serviceAccount: 2단계에서 다운로드한 서비스 계정 JSON 내용

### 4. 관리자 대시보드 접속

서버 실행 후, 다음 URL로 관리자 대시보드에 접속할 수 있습니다:
```
http://localhost:8080/admin/dashboard
```

기본 계정 정보:
- 사용자: admin
- 비밀번호: secure_password_here (실제 운영 환경에서는 반드시 변경하세요)

## 개발 환경 설정

1. 이 저장소를 클론합니다:
   ```bash
   git clone https://github.com/chisung42/autoDCS_PWA.git
   cd autoDCS_PWA
   ```

2. 서버와 PWA 클라이언트의 의존성을 설치합니다:
   ```bash
   cd server && npm install
   cd ../pwa/AutoDCS-PWA && npm install
   ```

## GitHub 관리

이 프로젝트는 GitHub를 통해 관리됩니다. 관련 문서:

- `GITHUB_SETUP.md`: GitHub 저장소 설정 및 브랜치 관리 전략
- `GITHUB_AUTH_GUIDE.md`: GitHub 인증 및 업로드 방법
- `SETUP_COMMANDS.sh`: GitHub 저장소 초기화 및 설정 자동화 스크립트

## 브랜치 전략

- `main`: 안정적인 프로덕션 버전
- `develop`: 개발 중인 코드
- `feature/기능명`: 새로운 기능 개발
- `bugfix/버그명`: 버그 수정
- `release/버전`: 배포 준비

# 실제 화면

<img width="1125" height="2436" alt="PhotoshopExtension_Image" src="https://github.com/user-attachments/assets/cf2aa807-131b-404d-b89c-7b783e2b0017" />
<img width="1125" height="2436" alt="PhotoshopExtension_Image (3)" src="https://github.com/user-attachments/assets/97e6d3d6-cc17-4b41-b799-03cfe6a653bd" />
<img width="1125" height="2436" alt="PhotoshopExtension_Image (2)" src="https://github.com/user-attachments/assets/20636c09-3e65-425f-b5d1-bcc9962a0fab" />
<img width="1125" height="2436" alt="PhotoshopExtension_Image (1)" src="https://github.com/user-attachments/assets/ae57f74b-9dcb-4a5a-b607-c31a5665ce84" />




https://github.com/user-attachments/assets/66ee93ee-2908-453b-bb48-c18479726cce



https://github.com/user-attachments/assets/08498ae1-6fce-42f6-9a72-7330a4d5df9d



## 통계
![pwa](https://github.com/user-attachments/assets/733b3ac2-6abd-4366-900d-4c453fe7a60b)
![pwa2](https://github.com/user-attachments/assets/e4a05d59-26d4-4bdd-b69c-8843496128a3)
![pwa3](https://github.com/user-attachments/assets/ec914fa6-7a6a-4a54-8cd8-554b70c197e8)
구글 통계에서는 약 300명의 사용자가 발생했다고 하지만
실제로 크롬 확장프로그램을 설치하고 데이터가 저장된 사용자수는 92명입니다. (생성된 json 데이터 개수로 추정)
<img width="2560" height="1440" alt="Screenshot 2026-03-07 at 08 17 35" src="https://github.com/user-attachments/assets/28ee3ab6-800c-4268-bb3b-32b90d72209b" />

## 향후 계획




https://github.com/user-attachments/assets/965582c2-0fa9-4dce-a46a-d113cfe8ad24



https://github.com/user-attachments/assets/4129d24e-9c8b-459a-ad3a-fac14766592f


https://github.com/user-attachments/assets/a4b98f50-5b42-479a-b8cb-271eac16d56e


## 라이센스

이 프로젝트는 ISC 라이센스 하에 배포됩니다. 
