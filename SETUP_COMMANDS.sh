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

# 코드 푸시
echo "브랜치 '$CURRENT_BRANCH'를 GitHub에 푸시합니다."
git push -u origin $CURRENT_BRANCH

echo "GitHub에 프로젝트 업로드가 완료되었습니다." 