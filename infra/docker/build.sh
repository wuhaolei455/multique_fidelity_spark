#!/bin/bash

set -e

echo "======================================"
echo "Multique Fidelity Spark Docker Build"
echo "======================================"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
# 确保每次执行都使用本项目的 compose 文件，避免误读其他项目配置
echo -e "${YELLOW}已锁定 COMPOSE_FILE=${COMPOSE_FILE}${NC}"
echo ""

echo -e "${BLUE}[1/4] 预拉取基础镜像...${NC}"
docker pull node:18-bullseye
docker pull node:18-alpine
docker pull nginx:alpine
echo -e "${GREEN}✓ 基础镜像已准备${NC}"
echo ""

echo -e "${BLUE}[2/4] 构建服务镜像...${NC}"
cd "$SCRIPT_DIR"

if [ "$1" = "--no-cache" ]; then
  docker-compose build --no-cache
else
  docker-compose build
fi
echo -e "${GREEN}✓ Docker 镜像构建完成${NC}"
echo ""

echo -e "${BLUE}[3/4] 当前镜像列表${NC}"
docker-compose images
echo ""

echo -e "${BLUE}[4/4] 后续步骤${NC}"
echo "启动: docker-compose up -d"
echo "日志: docker-compose logs -f"
echo "停止: docker-compose down"
echo ""
echo -e "${GREEN}======================================"
echo "构建完成"
echo "======================================${NC}"


