# multique_fidelity_spark

多保真 Spark SQL 调优套件，采用 monorepo 形式同时托管前端、后端应用与共享 Python 框架。

## 顶层目录结构

```
.
├── apps/                 # 独立的应用项目
│   ├── frontend/         # Web 前端（React）
│   └── backend/          # 后端服务（NestJS）
├── libs/
│   ├── framework/        # 原生 Python 调优框架（保持完整代码）
│   └── ...               # 未来可扩展的其他共享库
├── infra/                # Docker/部署/CI 等基础设施（预留）
└── README.md
```

### Python 框架 (`libs/framework`)

该目录完整保留了原 root 下的 Python 代码，包括：

- `Advisor/`, `Evaluator/`, `Optimizer/`, `extensions/`, `utils/`
- `manager/`, `configs/`, `exps/`
- 入口脚本 `main.py`、启动脚本 `start.sh`
- `requirements.txt`

**注意：** 框架代码在迁移过程中未做任何修改，仅调整了物理位置。

## 运行方式

1. 安装依赖
   ```bash
   cd libs/framework
   pip install -r requirements.txt
   ```

2. 运行主程序（示例）
   ```bash
   PYTHONPATH=$(pwd) python main.py \
     --config configs/waterfall.yaml \
     --iter_num 10 \
     --task demo_task
   ```

   - 如果需要跨目录调用，可将 `PYTHONPATH` 指向 `libs/framework`，例如  
     `PYTHONPATH=/path/to/multique_fidelity_spark/libs/framework`.

3. 使用启动脚本
   ```bash
   cd libs/framework
   ./start.sh my_task_name
   ```

## 前后端应用

- `apps/frontend`: 典型 React 工程，包含 `package.json`、`src/`、`tests` 等。
- `apps/backend`: NestJS 服务，目录结构与 Nest CLI 兼容。

两个应用彼此独立，可分别安装依赖并执行开发/构建命令。

## 后续规划

- 在 `infra/` 内补充统一的 Docker/CI 配置。
- 视需要在 `libs/python-shared` 下增加跨语言共享组件（如 TS 类型定义）。