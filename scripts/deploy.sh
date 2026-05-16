#!/bin/bash
set -e

cd /root/massoterapiarj-painel

if [ -d .repo ]; then
  if git --git-dir=.repo --work-tree=. rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git --git-dir=.repo --work-tree=. pull --ff-only
  fi
else
  if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git pull --ff-only
  fi
fi

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run build

TARGET_DIR=/root/massoterapiarj/painel
mkdir -p "$TARGET_DIR"
find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a dist/. "$TARGET_DIR/"

cd /root/massoterapiarj
docker compose up -d
