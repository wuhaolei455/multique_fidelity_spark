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

该目录是一个 **git submodule**，指向独立的框架仓库：`https://github.com/Elubrazione/multique_fidelity_spark.git`

框架代码包括：

- `Advisor/`, `Evaluator/`, `Optimizer/`, `extensions/`, `utils/`
- `manager/`, `configs/`, `exps/`
- 入口脚本 `main.py`、启动脚本 `start.sh`
- `requirements.txt`

#### 首次克隆仓库后初始化 submodule

```bash
# 克隆主仓库（包含 submodule）
git clone --recursive https://github.com/wuhaolei455/multique_fidelity_spark.git

# 或者如果已经克隆了主仓库，需要初始化 submodule
git submodule update --init --recursive
```

#### 更新 submodule 到最新版本

```bash
cd libs/framework
git pull origin main
cd ../..
git add libs/framework
git commit -m "更新 framework submodule"
```

#### 切换到 submodule 的特定版本

```bash
cd libs/framework
git checkout <commit-hash-or-branch>
cd ../..
git add libs/framework
git commit -m "切换到 framework 特定版本"
```

## 开发环境快速启动

推荐使用根目录下的 `start_dev.sh` 脚本，一键启动包含前后端的开发环境，支持**热更新**。

```bash
./start_dev.sh          # 启动开发环境（后台运行）
./start_dev.sh logs     # 查看实时日志
./start_dev.sh down     # 停止服务并移除容器
```

- **热更新说明**：
  - 前端 (`apps/frontend`) 和 后端 (`apps/backend`) 的源代码已通过 Volume 挂载到容器中。
  - 修改代码后，服务会自动重新编译或刷新，无需重启容器。
  - 前端服务地址：`http://localhost:8882`
  - 后端服务地址：`http://localhost:8881`

## Python 框架运行方式 (手动)

如果仅需调试 Python 算法框架，可单独运行：

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
   - 如果需要跨目录调用，可将 `PYTHONPATH` 指向 `libs/framework`。

3. 使用启动脚本
   ```bash
   cd libs/framework
   ./start.sh my_task_name
   ```

## 生产环境部署

使用 Docker 容器化部署生产环境，由 Nginx 统一代理。

### 1. 构建与启动

```bash
cd infra/docker
./build.sh              # 构建生产镜像
docker-compose up -d    # 启动生产环境
```

- 默认暴露端口：
  - `88`：统一访问入口（Nginx 反向代理）
  - `8881`：后端 API 服务
  - `8882`：前端静态资源

### 2. 停止与清理

如需停止服务并删除相关容器（清理环境），请在 `infra/docker` 目录下执行：

```bash
cd infra/docker
docker-compose down
```

### 3. 注意事项
- 生产环境镜像不包含源码挂载，修改代码后需要重新执行 `./build.sh`。
- Python 组件运行在后端容器中，维持 Python 3.9 环境。
- 前后端均基于 Node 18 构建。

## UI 任务上传与目录规范

- 仓库根目录下新增 `holly/`，其内固定包含 `config/`、`history/`、`data/`、`result/` 等子目录，后端会自动创建并写入上传内容。
- 前端「任务创建」向导允许用户填写 `base.yaml` 中常用字段、并上传 `history_json`（必填）与数据文件（可选），提交后会由后端生成独立的 YAML 并调用 `libs/framework/start.sh`。
- 生成的 YAML 位于 `holly/config/<taskId>.yaml`，历史与数据文件分别落在 `holly/history/`、`holly/data/` 对应子目录，调优结果统一写入 `holly/result/`。
- 通过 API `/api/tasks/launch-framework` 可直接触发上述流程，返回的任务可在监控页面实时查看日志与状态。

## 后续规划

- 视需要在 `libs/python-shared` 下增加跨语言共享组件（如 TS 类型定义）。