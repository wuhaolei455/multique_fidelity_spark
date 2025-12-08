#!/bin/bash

# 接收任务名称参数
TASK_NAME=${1:-"default_task"}
CONFIG_PATH="${CONFIG_PATH:-configs/base.yaml}"
ITER_NUM="${ITER_NUM:-10}"
HISTORY_DIR="${HISTORY_DIR:-mock/history}"
SAVE_DIR="${SAVE_DIR:-results/spark_results/}"
COMPRESS="${COMPRESS:-shap}"
CP_TOPK="${CP_TOPK:-40}"
OPT="${OPT:-MFES_SMAC}"
LOG_LEVEL="${LOG_LEVEL:-info}"
# TEST_MODE env var: "true" to enable, otherwise disable (or check if set)
TEST_MODE_FLAG=""
if [ "$TEST_MODE" = "true" ]; then
    TEST_MODE_FLAG="--test_mode"
fi


# 工作目录与依赖路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Determine Main Path
if [ -f "$SCRIPT_DIR/main.py" ]; then
    MAIN_PATH="$SCRIPT_DIR/main.py"
    REQ_FILE="$SCRIPT_DIR/requirements.txt"
elif [ -f "$SCRIPT_DIR/libs/framework/main.py" ]; then
    MAIN_PATH="$SCRIPT_DIR/libs/framework/main.py"
    REQ_FILE="$SCRIPT_DIR/libs/framework/requirements.txt"
else
    echo "❌ 错误: 未找到 main.py"
    exit 1
fi

if [ "$SKIP_VENV" != "true" ]; then
    VENV_DIR="$SCRIPT_DIR/.venv"
    REQ_HASH_FILE="$VENV_DIR/.requirements.sha256"

    # 使用本地 Python3.9 虚拟环境
    if [ ! -d "$VENV_DIR" ]; then
        echo "⚙️  创建 Python3.9 虚拟环境..."
        python3 -m venv "$VENV_DIR"
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
else
    echo "⚠️  跳过虚拟环境设置 (SKIP_VENV=true)"
fi


echo "=========================================="
echo "🚀 启动调优任务"
echo "=========================================="
echo ""
echo "📋 任务名称: $TASK_NAME"
echo "📄 配置文件: $CONFIG_PATH"
echo "📂 历史目录: $HISTORY_DIR"
echo "💾 结果目录: $SAVE_DIR"
echo "⚙️  优化器:   $OPT"
echo "📝 日志级别: $LOG_LEVEL"
echo "🧪 测试模式: $TEST_MODE"
echo ""
echo "=========================================="

python3 "$MAIN_PATH" \
    --config "$CONFIG_PATH" \
    $TEST_MODE_FLAG \
    --iter_num "$ITER_NUM" \
    --task "$TASK_NAME" \
    --history_dir "$HISTORY_DIR" \
    --save_dir "$SAVE_DIR" \
    --compress "$COMPRESS" \
    --cp_topk "$CP_TOPK" \
    --opt "$OPT" \
    --log_level "$LOG_LEVEL"


echo ""
echo "=========================================="
echo "✅ 调优任务完成！"
echo "=========================================="
