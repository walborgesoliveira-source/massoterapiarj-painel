#!/bin/bash
set -e

cd /root/massoterapiarj-painel
git pull
docker compose up -d --build
