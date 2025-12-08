#!/bin/bash

##############################################################################
# Docker & Docker Compose 自动化安装脚本
#
# 功能：
# 1. 安装 Docker Engine (通过官方脚本)
# 2. 安装 Docker Compose (v2.29.1)
# 3. 配置 Docker 镜像加速 (国内源)
#
# 使用方法：
# sudo ./init_docker.sh
##############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查 Root 权限
if [ "$(id -u)" != "0" ]; then
   echo -e "${RED}[ERROR] 请使用 root 权限运行此脚本 (sudo ./init_docker.sh)${NC}"
   exit 1
fi

print_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. 安装 Docker
install_docker() {
    if command -v docker >/dev/null 2>&1; then
        print_warning "Docker 已安装，跳过安装步骤。"
        docker --version
    else
        print_info "正在安装 Docker..."
        # 使用阿里云镜像源加速安装脚本下载
        curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
        
        systemctl enable docker
        systemctl start docker
        print_success "Docker 安装完成。"
    fi
}

# 2. 安装 Docker Compose
install_compose() {
    local COMPOSE_VERSION="v2.29.1"
    local NEED_INSTALL=0
    
    if command -v docker-compose >/dev/null 2>&1; then
        # 获取当前版本
        local CURRENT_VER=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)
        print_info "发现当前 Docker Compose 版本: $CURRENT_VER"
        
        # 简单判断：如果是 1.x 版本，建议升级
        if [[ "$CURRENT_VER" == 1.* ]]; then
            print_warning "当前版本较旧 (V1)，准备升级到 $COMPOSE_VERSION (V2)..."
            # 尝试移除旧的二进制文件（如果是放在 /usr/local/bin 下）
            rm -f /usr/local/bin/docker-compose
            NEED_INSTALL=1
        else
            print_success "Docker Compose 版本符合要求 (V2)。"
        fi
    else
        NEED_INSTALL=1
    fi
    
    if [ "$NEED_INSTALL" -eq 1 ]; then
        print_info "正在安装 Docker Compose ($COMPOSE_VERSION)..."
        curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # 验证
        if command -v docker-compose >/dev/null 2>&1; then
             print_success "Docker Compose 安装完成。"
             docker-compose --version
        else
             print_error "Docker Compose 安装失败。"
             exit 1
        fi
    fi
}

# 3. 配置镜像加速
configure_mirror() {
    print_info "配置 Docker 镜像加速..."
    
    mkdir -p /etc/docker
    
    if [ -f /etc/docker/daemon.json ]; then
        print_warning "/etc/docker/daemon.json 已存在，正在备份为 daemon.json.bak..."
        cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
    fi

    tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://huecker.io",
    "https://dockerhub.timeweb.cloud",
    "https://noohub.ru"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF

    systemctl daemon-reload
    systemctl restart docker
    print_success "Docker 镜像加速配置完成并已重启服务。"
}

# 主逻辑
echo "=========================================="
echo "开始安装 Docker 环境..."
echo "=========================================="

install_docker
install_compose
configure_mirror

echo ""
echo -e "${GREEN}所有安装步骤已完成！${NC}"
echo "请确保当前用户已加入 docker 组（如果非 root 用户直接使用 docker 命令）："
echo "  sudo usermod -aG docker \$USER"
echo "然后重新登录使更改生效。"

