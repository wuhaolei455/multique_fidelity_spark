#!/bin/bash

# 框架启动脚本
# 用于启动多保真度 Spark 调优框架

python main.py \
    --test_mode \
    --opt BOHB_GP \
    --log_level debug \
    --compress shap \
    --transfer reacq \
    --warm_start best_all \
    --task TEST \
    --target idx0 \
    --save_dir results \
    --iter_num 10 \
    --history_dir mock/history

