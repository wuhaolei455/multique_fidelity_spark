#!/bin/bash

##############################################################################
# Multique Fidelity Spark 一键 Docker 部署脚本
# 适用于 Ubuntu 服务器环境
# 作者: Auto-generated deployment script
# 版本: 1.0.0
##############################################################################

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计算项目根目录（脚本位于 infra/scripts）
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_COMPOSE_CMD=("docker-compose")
CACHE_DIR="$PROJECT_DIR/.cache/docker-build"

declare -A SERVICE_HASHES=()
declare -a SERVICE_PATHS=()

BACKEND_PATHS=(
  "apps/backend"
  "infra/docker/Dockerfile.backend"
)

FRONTEND_PATHS=(
  "apps/frontend"
  "infra/docker/Dockerfile.frontend"
)

print_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

print_banner() {
  echo -e "${GREEN}"
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║                                                           ║"
  echo "║     Multique Fidelity Spark 自动部署脚本                  ║"
  echo "║     Docker Compose + Nginx 一键部署                       ║"
  echo "║                                                           ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

require_root() {
  if [[ $EUID -ne 0 ]]; then
    print_error "请使用 root 用户运行此脚本（需要修改 Docker 配置）"
    exit 1
  fi
}

detect_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    print_error "未检测到 docker，请先安装 Docker CE"
    exit 1
  fi
}

detect_docker_compose() {
  if ! command -v docker-compose >/dev/null 2>&1; then
    print_error "未检测到 docker-compose，请先安装 docker-compose 命令行工具"
    exit 1
  fi
}

configure_docker_registry() {
  print_info "配置 Docker 镜像加速器..."
  mkdir -p /etc/docker

  if [[ -f /etc/docker/daemon.json ]]; then
    if ! grep -q "registry-mirrors" /etc/docker/daemon.json; then
      print_warning "备份现有 /etc/docker/daemon.json"
      cp /etc/docker/daemon.json "/etc/docker/daemon.json.bak.$(date +%Y%m%d%H%M%S)"
    else
      print_info "检测到已配置镜像加速器，跳过此步骤"
      return
    fi
  fi

  cat >/etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://docker.m.daocloud.io"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

  print_success "镜像加速器配置完成"
  print_info "重启 Docker 服务以应用配置..."
  systemctl daemon-reload
  systemctl restart docker
  sleep 3
  print_success "Docker 服务已重启"
}

check_project_structure() {
  print_info "检查项目结构..."
  if [[ ! -d "$PROJECT_DIR" ]]; then
    print_error "项目目录不存在: $PROJECT_DIR"
    exit 1
  fi

  pushd "$PROJECT_DIR" >/dev/null
  local required_files=(
    "infra/docker/docker-compose.yml"
    "infra/docker/Dockerfile.backend"
    "infra/docker/Dockerfile.frontend"
    "infra/nginx/nginx.conf"
    "infra/nginx/multique.conf"
    "apps/backend/package.json"
    "apps/frontend/package.json"
  )

  for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
      print_error "缺少必要文件: $PROJECT_DIR/$file"
      exit 1
    fi
  done
  popd >/dev/null
  print_success "项目结构检查通过"
}

prepare_directories() {
  print_info "创建任务运行所需目录..."
  local dirs=(
    "configs/space"
    "configs/evaluator"
    "holly"
    "holly/config"
    "holly/history"
    "holly/data"
    "holly/result"
    "holly/result/log"
    "results/tasks"
  )

  pushd "$PROJECT_DIR" >/dev/null
  for dir in "${dirs[@]}"; do
    mkdir -p "$dir"
  done
  chmod 755 holly holly/* results || true
  popd >/dev/null
  print_success "目录创建完成"
}

prepare_cache_dir() {
  mkdir -p "$CACHE_DIR"
}

stop_old_containers() {
  print_info "停止旧的 Docker 容器..."
  pushd "$PROJECT_DIR/infra/docker" >/dev/null
  if "${DOCKER_COMPOSE_CMD[@]}" ps >/dev/null 2>&1; then
    if "${DOCKER_COMPOSE_CMD[@]}" ps | grep -q "Up"; then
      "${DOCKER_COMPOSE_CMD[@]}" down --remove-orphans
      print_success "旧容器已停止"
    else
      print_info "没有运行中的容器"
    fi
  else
    print_warning "docker-compose ps 执行失败，可忽略"
  fi
  popd >/dev/null
}

clean_old_images() {
  print_info "清理未使用的 Docker 镜像..."
  docker image prune -f || print_warning "镜像清理失败，可手动处理"
}

pre_pull_base_images() {
  print_info "预拉取常用基础镜像..."
  local images=(
    "node:18-bullseye"
    "node:18-alpine"
    "nginx:alpine"
  )

  for image in "${images[@]}"; do
    print_info "拉取 $image..."
    if docker pull "$image"; then
      print_success "$image 拉取成功"
    else
      print_warning "$image 拉取失败，将在构建阶段重试"
    fi
  done
}

compute_hash_for_paths() {
  local paths=("$@")
  python3 - "$PROJECT_DIR" "${paths[@]}" <<'PY'
import hashlib
import os
import sys

root = sys.argv[1]
paths = sys.argv[2:]
skip_dirs = {'.git', 'node_modules', 'dist', 'build', '.next', '.turbo', '.cache'}
files = []

def handle_path(abs_path):
    if os.path.isfile(abs_path):
        rel = os.path.relpath(abs_path, root)
        files.append(rel)
    elif os.path.isdir(abs_path):
        for dirpath, dirnames, filenames in os.walk(abs_path):
            dirnames[:] = [d for d in dirnames if d not in skip_dirs and not d.startswith('.pytest_cache')]
            for filename in filenames:
                rel = os.path.relpath(os.path.join(dirpath, filename), root)
                files.append(rel)

for rel_path in paths:
    abs_path = os.path.join(root, rel_path)
    if os.path.exists(abs_path):
        handle_path(abs_path)

if not files:
    print("EMPTY")
    sys.exit(0)

files.sort()
hasher = hashlib.sha256()
for rel in files:
    hasher.update(rel.encode('utf-8'))
    abs_file = os.path.join(root, rel)
    with open(abs_file, 'rb') as fh:
        while True:
            chunk = fh.read(65536)
            if not chunk:
                break
            hasher.update(chunk)

print(hasher.hexdigest())
PY
}

load_service_config() {
  local service="$1"
  case "$service" in
    backend)
      SERVICE_IMAGE="multique-backend:latest"
      SERVICE_PATHS=("${BACKEND_PATHS[@]}")
      ;;
    frontend)
      SERVICE_IMAGE="multique-frontend:latest"
      SERVICE_PATHS=("${FRONTEND_PATHS[@]}")
      ;;
    *)
      print_warning "未知服务：$service"
      SERVICE_IMAGE=""
      SERVICE_PATHS=()
      ;;
  esac
}

should_build_service() {
  local service="$1"
  load_service_config "$service"

  if [[ -z "$SERVICE_IMAGE" || ${#SERVICE_PATHS[@]} -eq 0 ]]; then
    return 0
  fi

  local current_hash
  current_hash="$(compute_hash_for_paths "${SERVICE_PATHS[@]}")"
  SERVICE_HASHES["$service"]="$current_hash"

  local cache_file="$CACHE_DIR/${service}.hash"
  local previous_hash=""
  if [[ -f "$cache_file" ]]; then
    previous_hash="$(<"$cache_file")"
  fi

  local image_id
  image_id="$(docker images -q "$SERVICE_IMAGE" 2>/dev/null || true)"

  if [[ -z "$previous_hash" ]]; then
    print_info "$service 首次构建或缓存缺失，将执行构建"
    return 0
  fi

  if [[ "$current_hash" != "$previous_hash" ]]; then
    print_info "$service 检测到代码或依赖变化，将执行构建"
    return 0
  fi

  if [[ -z "$image_id" ]]; then
    print_info "$service 镜像不存在，触发构建"
    return 0
  fi

  print_info "$service 无变化，复用缓存镜像"
  return 1
}

record_service_hash() {
  local service="$1"
  local hash="${SERVICE_HASHES[$service]:-}"
  if [[ -z "$hash" ]]; then
    return
  fi
  echo "$hash" >"$CACHE_DIR/${service}.hash"
}

build_and_start() {
  print_info "开始构建并启动容器..."
  pushd "$PROJECT_DIR/infra/docker" >/dev/null
  local services_to_build=()
  for service in backend frontend; do
    if should_build_service "$service"; then
      services_to_build+=("$service")
    fi
  done

  if ((${#services_to_build[@]} > 0)); then
    pre_pull_base_images
    print_info "构建镜像（docker-compose build ${services_to_build[*]}）..."
    "${DOCKER_COMPOSE_CMD[@]}" build "${services_to_build[@]}"
    print_success "镜像构建完成"
    for service in "${services_to_build[@]}"; do
      record_service_hash "$service"
    done
  else
    print_info "所有服务均无代码变更，跳过镜像构建阶段"
  fi

  print_info "以后台模式启动容器..."
  "${DOCKER_COMPOSE_CMD[@]}" up -d
  print_success "容器已启动："
  "${DOCKER_COMPOSE_CMD[@]}" ps
  popd >/dev/null
}

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
    print_info "尝试从 $service 获取 IP..."
    if HOST_IP=$(curl -s --connect-timeout 3 "$service"); then
      # 简单的校验：IP应该包含点号且长度合理
      if [[ "$HOST_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_success "成功获取公网 IP: $HOST_IP"
        break
      fi
    fi
    HOST_IP="" # 重置为空，以便继续尝试
  done
  
  if [[ -z "$HOST_IP" ]]; then
    print_warning "无法获取公网 IP，尝试获取内网 IP..."
    # 尝试获取 eth0 的 IP，或者是第一个非 Docker 网桥的 IP
    # hostname -I 可能会返回 Docker 网桥 IP (如 172.17.0.1)，我们尽量避开
    # 使用 ip route get 1 获取路由到外网的 IP
    if command -v ip >/dev/null 2>&1; then
        HOST_IP=$(ip route get 1 | awk '{print $7; exit}')
    fi
    
    if [[ -z "$HOST_IP" ]]; then
        HOST_IP=$(hostname -I | awk '{print $1}')
    fi
  fi
  
  if [[ -z "$HOST_IP" ]]; then
     HOST_IP="127.0.0.1"
     print_warning "无法获取有效 IP，默认使用 127.0.0.1"
  else
     print_info "最终使用 IP: $HOST_IP"
  fi
  export HOST_IP
}

main() {
  print_banner
  require_root
  detect_docker
  detect_docker_compose
  detect_host_ip
  configure_docker_registry
  check_project_structure
  prepare_directories
  prepare_cache_dir
  stop_old_containers
  clean_old_images
  build_and_start
  print_success "部署完成！"
  print_success "后端 API: http://$HOST_IP:8881"
  print_success "前端访问: http://$HOST_IP:8882"
  print_success "Nginx 入口: http://$HOST_IP:88"
}

main "$@"

