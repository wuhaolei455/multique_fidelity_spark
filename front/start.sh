#!/bin/bash

# Spark 调优框架前端启动脚本

echo "================================"
echo "Spark 调优框架前端项目"
echo "================================"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到 Node.js，请先安装 Node.js (https://nodejs.org/)"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: 未检测到 npm，请先安装 npm"
    exit 1
fi

echo "Node 版本: $(node -v)"
echo "npm 版本: $(npm -v)"
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "未检测到依赖，正在安装..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 依赖安装失败"
        exit 1
    fi
    echo "依赖安装完成"
    echo ""
fi

# 启动开发服务器
echo "正在启动开发服务器..."
echo "访问地址: http://localhost:4000"
echo ""

npm start

