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

## Docker 部署

- `infra/docker`：包含 Node 后端、前端构建镜像与 `docker-compose.yml`、`build.sh`。
- `infra/nginx`：提供静态站点与反向代理所需的 `nginx.conf`、`multique.conf`。

### 快速使用

```bash
cd infra/docker
./build.sh          # 构建全部镜像（如需，可加 --no-cache）
docker-compose up -d
```

- 默认暴露的端口：`8881`（NestJS 后端）、`8882`（静态前端）、`88`（总入口反向代理）。
- Python 相关组件维持 3.9 版本（参见 `libs/framework`），前后端皆基于 Node 18，便于统一依赖链。

## UI 任务上传与目录规范

- 仓库根目录下新增 `holly/`，其内固定包含 `config/`、`history/`、`data/`、`result/` 等子目录，后端会自动创建并写入上传内容。
- 前端「任务创建」向导允许用户填写 `base.yaml` 中常用字段、并上传 `history_json`（必填）与数据文件（可选），提交后会由后端生成独立的 YAML 并调用 `libs/framework/start.sh`。
- 生成的 YAML 位于 `holly/config/<taskId>.yaml`，历史与数据文件分别落在 `holly/history/`、`holly/data/` 对应子目录，调优结果统一写入 `holly/result/`。
- 通过 API `/api/tasks/launch-framework` 可直接触发上述流程，返回的任务可在监控页面实时查看日志与状态。

## 后续规划

- 视需要在 `libs/python-shared` 下增加跨语言共享组件（如 TS 类型定义）。