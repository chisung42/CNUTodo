#!/bin/bash

count=$(ls -1 *.json 2>/dev/null | wc -l)
echo "JSON 파일 개수: $count"
