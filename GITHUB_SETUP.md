# GitHub 설정 가이드

이 문서는 프로젝트를 GitHub에 업로드하고 관리하기 위한 가이드입니다.

## 1. Git 저장소 초기화

프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다:

```bash
git init
```

## 2. 파일 추가

생성한 `.gitignore` 파일이 불필요한 파일을 무시하도록 설정한 후, 모든 파일을 스테이징합니다:

```bash
git add .
```

## 3. 첫 번째 커밋

변경 사항을 커밋합니다:

```bash
git commit -m "초기 프로젝트 구조 설정"
```

## 4. GitHub 저장소 생성

1. GitHub에 로그인
2. 오른쪽 상단의 '+' 버튼을 클릭하고 'New repository'를 선택
3. 저장소 이름(예: 'autoDCS')을 입력하고 필요한 설정을 완료
4. 저장소 생성 버튼 클릭

## 5. 로컬 저장소와 GitHub 저장소 연결

GitHub에서 생성된 저장소 URL을 사용하여 다음 명령어를 실행합니다:

```bash
git remote add origin https://github.com/사용자이름/autoDCS.git
```

## 6. 코드 푸시

코드를 GitHub에 푸시합니다:

```bash
git push -u origin main
```

## 브랜치 관리 전략

효과적인 개발을 위해 다음과 같은 브랜치 전략을 사용하는 것을 권장합니다:

1. **main**: 안정적인 프로덕션 버전
2. **develop**: 개발 중인 코드
3. **feature/기능명**: 새로운 기능 개발
4. **bugfix/버그명**: 버그 수정
5. **release/버전**: 배포 준비

### 새 기능 개발 예시

```bash
# develop 브랜치 생성 및 전환
git checkout -b develop

# 기능 브랜치 생성 및 전환
git checkout -b feature/push-notification

# 기능 개발 후 커밋
git add .
git commit -m "푸시 알림 기능 구현"

# develop 브랜치로 병합
git checkout develop
git merge feature/push-notification

# 기능 브랜치 삭제 (선택사항)
git branch -d feature/push-notification

# develop 브랜치 푸시
git push origin develop
```

## 팀 협업 가이드

1. 작업 시작 전 항상 최신 코드를 가져옵니다:
   ```bash
   git pull origin main
   git pull origin develop
   ```

2. 이슈 트래커를 사용하여 작업을 관리합니다.
3. Pull Request를 통해 코드 리뷰를 진행합니다.
4. 코드 스타일 가이드를 준수합니다. 