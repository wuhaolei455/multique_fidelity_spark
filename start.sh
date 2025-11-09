#!/bin/bash

# 瀑布流组件调优启动脚本
# 使用 waterfall-component-optimized.json 配置空间进行参数调优

# 接收任务名称参数
TASK_NAME=${1:-"default_task"}

# 初始化 conda（根据系统自动检测 conda 路径）
if [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/anaconda3/etc/profile.d/conda.sh"
elif [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/miniconda3/etc/profile.d/conda.sh"
elif [ -f "/opt/anaconda3/etc/profile.d/conda.sh" ]; then
    source "/opt/anaconda3/etc/profile.d/conda.sh"
elif [ -f "/opt/miniconda3/etc/profile.d/conda.sh" ]; then
    source "/opt/miniconda3/etc/profile.d/conda.sh"
else
    echo "❌ 错误: 未找到 conda 安装路径"
    echo "请手动设置 conda 路径或运行: conda init bash"
    exit 1
fi

# 激活 conda 环境
conda activate spark

# 检查环境是否激活成功
if [ $? -ne 0 ]; then
    echo "❌ 错误: 无法激活 conda 环境 'spark'"
    echo "请确保环境存在: conda env list"
    exit 1
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

python main.py \
    --config configs/waterfall.yaml \
    --test_mode \
    --iter_num 10 \
    --task "$TASK_NAME"

echo ""
echo "=========================================="
echo "✅ 调优任务完成！"
echo "📁 结果保存在: results/waterfall_results/"
echo "=========================================="

