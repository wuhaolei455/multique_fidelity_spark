#!/bin/bash

# 添加瀑布流组件配置空间的curl命令
# 瀑布流组件是一个前端UI组件，用于展示图片流、内容流
# 配置参数涵盖：布局、渲染、加载、缓存、动画等方面

# API端点
API_URL="http://localhost:3000/api/config-spaces"

# 定义JSON文件路径
JSON_FILE="./waterfall_config_space.json"

# 检查JSON文件是否存在
if [ ! -f "$JSON_FILE" ]; then
  echo "错误: JSON文件未找到 $JSON_FILE"
  exit 1
fi

# 读取JSON文件内容并发送POST请求
echo "正在添加瀑布流组件配置空间..."
curl --noproxy '*' -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -d @"${JSON_FILE}"

echo ""
echo "配置空间添加完成！"
