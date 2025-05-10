# GitHub 인증 및 업로드 가이드

GitHub에 프로젝트를 업로드하기 위해서는 인증이 필요합니다. 다음 방법 중 하나를 선택하여 진행하세요.

## 1. Personal Access Token (PAT) 사용

1. GitHub 계정으로 로그인합니다.
2. 우측 상단의 프로필 아이콘 > Settings > Developer settings > Personal access tokens > Tokens (classic)으로 이동합니다.
3. "Generate new token"을 클릭하고 "Classic" 옵션을 선택합니다.
4. 토큰에 적절한 이름을 지정하고, `repo` 권한을 선택합니다.
5. "Generate token"을 클릭하고 생성된 토큰을 복사합니다.
6. 다음 명령어로 저장소를 설정합니다:

```bash
git remote set-url origin https://USERNAME:TOKEN@github.com/chisung42/autoDCS_PWA.git
```

7. 이제 푸시 명령어를 실행합니다:

```bash
git push -u origin main
```

## 2. SSH 키 방식 사용

1. SSH 키 생성:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. SSH 키 복사:

```bash
cat ~/.ssh/id_ed25519.pub
```

3. GitHub 계정에 SSH 키 등록:
   - GitHub 계정으로 로그인
   - 우측 상단의 프로필 아이콘 > Settings > SSH and GPG keys > New SSH key
   - 적절한 제목을 입력하고 복사한 키를 붙여넣기
   - "Add SSH key" 클릭

4. 리모트 URL을 SSH 방식으로 변경:

```bash
git remote set-url origin git@github.com:chisung42/autoDCS_PWA.git
```

5. 푸시 명령어 실행:

```bash
git push -u origin main
```

## 3. GitHub CLI 사용

GitHub CLI를 사용하면 더 쉽게 인증할 수 있습니다.

1. GitHub CLI 설치:

```bash
# Ubuntu/Debian
sudo apt install gh

# macOS
brew install gh

# Windows
winget install -e --id GitHub.cli
```

2. GitHub CLI 로그인:

```bash
gh auth login
```

3. 프롬프트에 따라 인증 과정을 완료합니다.

4. 푸시 명령어 실행:

```bash
git push -u origin main
```

## 참고사항

- 토큰 방식을 사용하는 경우, 토큰을 안전하게 보관하세요.
- SSH 키 방식은 한 번 설정하면 암호 입력 없이 푸시할 수 있습니다.
- GitHub CLI는 가장 사용하기 쉬운 방법입니다. 