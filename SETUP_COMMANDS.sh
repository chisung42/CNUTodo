#!/bin/bash

# Git 저장소 초기화
git init

# 파일 스테이징
git add .

# 첫 번째 커밋
git commit -m "초기 프로젝트 구조 설정"

# GitHub 저장소 URL 설정 (실제 사용 시 URL 변경 필요)
git remote add origin https://github.com/chisung42/autoDCS_PWA.git

# 코드 푸시 (주석 해제 후 사용)
git push -u origin main

echo "위 명령어를 순서대로 실행하여 GitHub에 프로젝트를 업로드할 수 있습니다."
echo "원격 저장소 URL과 푸시 명령어는 GitHub 저장소 생성 후 주석을 해제하고 실행하세요." 