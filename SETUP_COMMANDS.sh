#!/bin/bash

# Git 저장소 초기화 (이미 초기화되어 있으면 건너뜀)
if [ ! -d ".git" ]; then
  git init
fi

# 파일 스테이징
git add .

# 첫 번째 커밋
git status | grep "nothing to commit" > /dev/null
if [ $? -ne 0 ]; then
  git commit -m "초기 프로젝트 구조 설정"
fi

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
  CURRENT_BRANCH="master"
fi

# GitHub 저장소 URL 설정 (이미 있으면 업데이트)
if git remote | grep origin > /dev/null; then
  echo "기존 origin 리모트를 제거하고 새로 설정합니다."
  git remote remove origin
fi
git remote add origin https://github.com/chisung42/autoDCS_PWA.git

# master 브랜치를 main으로 변경 (필요한 경우)
if [ "$CURRENT_BRANCH" == "master" ]; then
  echo "master 브랜치를 main으로 변경합니다."
  git branch -M main
  CURRENT_BRANCH="main"
fi

echo "GitHub 저장소와 동기화 시도 중..."

# 원격 저장소 내용 가져오기 시도
git fetch origin 2>/dev/null

# 원격 저장소의 브랜치가 존재하는지 확인
if git branch -r | grep "origin/$CURRENT_BRANCH" > /dev/null; then
  echo "원격 저장소의 내용을 가져와 병합합니다."
  git pull --no-edit origin $CURRENT_BRANCH
else
  echo "원격 저장소에 해당 브랜치가 없습니다. 첫 푸시를 시도합니다."
fi

# 푸시 방법 선택
echo "푸시 방법을 선택하세요:"
echo "1) 일반 푸시 (git push)"
echo "2) 강제 푸시 (git push --force)"
echo "3) 취소"
read -p "선택 (기본값: 1): " PUSH_OPTION

case $PUSH_OPTION in
  2)
    echo "강제 푸시를 실행합니다..."
    git push --force origin $CURRENT_BRANCH
    ;;
  3)
    echo "푸시를 취소했습니다."
    ;;
  *)
    echo "일반 푸시를 실행합니다..."
    git push origin $CURRENT_BRANCH
    ;;
esac

if [ $? -eq 0 ]; then
  echo "GitHub에 프로젝트 업로드가 완료되었습니다."
else
  echo "GitHub에 푸시하는 과정에서 문제가 발생했습니다."
  echo "수동으로 다음 명령을 실행해보세요:"
  echo "1. GitHub에서 저장소의 현재 상태를 확인: git fetch origin"
  echo "2. 변경 내용 병합: git pull --no-edit origin $CURRENT_BRANCH"
  echo "3. 충돌 해결 후 다시 푸시: git push origin $CURRENT_BRANCH"
  echo "또는 강제 푸시를 사용하려면: git push --force origin $CURRENT_BRANCH"
fi 