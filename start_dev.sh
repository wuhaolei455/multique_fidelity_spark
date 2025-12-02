#!/bin/bash

##############################################################################
# Multique Fidelity Spark 开发环境快速启动脚本
# 
# 功能：
# 1. 自动检测环境依赖 (Docker, Docker Compose)
# 2. 自动探测主机 IP
# 3. 创建必要的项目目录
# 4. 使用 docker-compose.dev.yml 启动开发环境
# 
# 使用方法：
# ./start_dev.sh [up|down|logs|restart]
# 默认行为是 up (启动)
##############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$PROJECT_DIR/infra/docker/docker-compose.dev.yml"

# 打印辅助函数
print_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查依赖
check_requirements() {
  if ! command -v docker >/dev/null 2>&1; then
    print_error "未找到 docker，请先安装 Docker。"
    exit 1
  fi
  
  if ! command -v docker-compose >/dev/null 2>&1; then
    print_error "未找到 docker-compose，请先安装。"
    exit 1
  fi
}

# 探测主机 IP
detect_host_ip() {
  print_info "正在探测主机 IP..."
  HOST_IP=""
  
  # 尝试多个公网 IP 获取服务
  local services=(
    "http://icanhazip.com"
    "http://ifconfig.me"
    "http://ifconfig.co"
    "http://ipinfo.io/ip"
  )
  
  for service in "${services[@]}"; do
    if HOST_IP=$(curl -s --connect-timeout 2 "$service"); then
      # 简单的校验：IP应该包含点号且长度合理，去掉可能的尾部空格
      HOST_IP=$(echo "$HOST_IP" | tr -d '[:space:]')
      if [[ "$HOST_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_info "从 $service 获取到 IP: $HOST_IP"
        break
      fi
    fi
    HOST_IP=""
  done
  
  if [[ -z "$HOST_IP" ]]; then
    print_warning "获取公网 IP 失败，尝试获取内网 IP..."
    if command -v ip >/dev/null 2>&1; then
        HOST_IP=$(ip route get 1 | awk '{print $7; exit}')
    fi
    
    if [[ -z "$HOST_IP" ]]; then
      HOST_IP=$(hostname -I | awk '{print $1}')
    fi
  fi
  
  if [[ -z "$HOST_IP" ]]; then
     HOST_IP="127.0.0.1"
  fi
  print_info "使用 IP: $HOST_IP"
  export HOST_IP
}

# 准备目录
prepare_directories() {
  print_info "检查并创建必要目录..."
  local dirs=(
    "configs/space"
    "configs/evaluator"
    "holly/config"
    "holly/history"
    "holly/data"
    "holly/result/log"
    "results/tasks"
  )

  for dir in "${dirs[@]}"; do
    if [[ ! -d "$PROJECT_DIR/$dir" ]]; then
      mkdir -p "$PROJECT_DIR/$dir"
      # 尝试设置权限，开发环境下可能不需要太严格，但避免权限问题
      chmod 777 "$PROJECT_DIR/$dir" 2>/dev/null || true
    fi
  done
}

# 启动服务
do_up() {
  check_requirements
  detect_host_ip
  prepare_directories
  
  print_info "正在启动开发环境 (后台运行)..."
  docker-compose -f "$COMPOSE_FILE" up -d --build
  
  print_success "开发环境已启动！"
  echo ""
  echo -e "  后端服务: ${GREEN}http://localhost:8881${NC} (或 http://$HOST_IP:8881)"
  echo -e "  前端服务: ${GREEN}http://localhost:8882${NC} (或 http://$HOST_IP:8882)"
  echo ""
  echo -e "常用命令:"
  echo -e "  查看日志: ${YELLOW}./start_dev.sh logs${NC}"
  echo -e "  停止服务: ${YELLOW}./start_dev.sh down${NC}"
  echo -e "  重启服务: ${YELLOW}./start_dev.sh restart${NC}"
}

# 停止服务
do_down() {
  print_info "正在停止开发环境..."
  docker-compose -f "$COMPOSE_FILE" down
  print_success "服务已停止。"
}

# 查看日志
do_logs() {
  docker-compose -f "$COMPOSE_FILE" logs -f
}

# 主逻辑
case "$1" in
  down)
    do_down
    ;;
  logs)
    do_logs
    ;;
  restart)
    do_down
    do_up
    ;;
  *)
    do_up
    ;;
esac

