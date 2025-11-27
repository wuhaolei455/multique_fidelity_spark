#!/bin/bash

# 瀑布流组件调优启动脚本
# 使用 waterfall-component-optimized.json 配置空间进行参数调优

# 接收任务名称参数
TASK_NAME=${1:-"default_task"}

# 工作目录与依赖路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
REQ_FILE="$SCRIPT_DIR/requirements.txt"
REQ_HASH_FILE="$VENV_DIR/.requirements.sha256"

# 使用本地 Python3.9 虚拟环境

if [ ! -d "$VENV_DIR" ]; then
    echo "⚙️  创建 Python3.9 虚拟环境..."
    python3.9 -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo "❌ 错误: 无法创建 Python3.9 虚拟环境"
        exit 1
    fi
fi

source "$VENV_DIR/bin/activate"

if [ $? -ne 0 ]; then
    echo "❌ 错误: 无法激活虚拟环境 $VENV_DIR"
    exit 1
fi

# 安装依赖（根据 requirements.txt 哈希判断是否需要刷新）
if [ ! -f "$REQ_FILE" ]; then
    echo "❌ 错误: 未找到依赖文件 $REQ_FILE"
    exit 1
fi

CURRENT_HASH=$(sha256sum "$REQ_FILE" | awk '{print $1}')
NEED_INSTALL=true

if [ -f "$REQ_HASH_FILE" ]; then
    SAVED_HASH=$(cat "$REQ_HASH_FILE")
    if [ "$CURRENT_HASH" = "$SAVED_HASH" ]; then
        NEED_INSTALL=false
    fi
fi

if [ "$NEED_INSTALL" = true ]; then
    echo "📦 安装/更新 framework 依赖..."
    pip install -r "$REQ_FILE"

    if [ $? -ne 0 ]; then
        echo "❌ 错误: 依赖安装失败"
        exit 1
    fi
    echo "$CURRENT_HASH" > "$REQ_HASH_FILE"
fi

echo "=========================================="
echo "🚀 启动瀑布流组件调优任务"
echo "=========================================="
echo ""
echo "📋 任务名称: $TASK_NAME"
echo "📦 配置空间: waterfall-component-optimized.json"
echo "🎯 调优目标: 优化瀑布流组件性能"
echo "📊 参数数量: 25 个"
echo ""
echo "=========================================="

python "$SCRIPT_DIR/main.py" \
    --config configs/base.yaml \
    --test_mode \
    --iter_num 10 \
    --task "$TASK_NAME" \
    --history_dir mock/history \
    --save_dir results/waterfall_results/ \
    --compress shap \
    --cp_topk 40 


echo ""
echo "=========================================="
echo "✅ 调优任务完成！"
echo "📁 结果保存在: results/waterfall_results/"
echo "=========================================="

