# Spark多保真度调优框架 - 后端API

基于NestJS的后端API服务，提供配置空间（Config Space）和任务结果（Result）相关的RESTful API接口。

## 项目结构

```
backend/
├── src/
│   ├── common/              # 通用模块
│   │   ├── types/           # 基础类型定义
│   │   └── dto/             # 通用DTO
│   ├── config-space/        # 配置空间模块
│   │   ├── dto/             # DTO定义
│   │   ├── interfaces/      # 接口定义
│   │   └── config-space.controller.ts
│   ├── result/              # 结果模块
│   │   ├── dto/             # DTO定义
│   │   ├── interfaces/      # 接口定义
│   │   └── result.controller.ts
│   └── main.ts              # 应用入口
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 核心特性

### 1. 类型安全
- 使用TypeScript泛型系统提供完整的类型安全
- 所有DTO都使用class-validator进行验证
- 接口定义清晰，便于实现和扩展

### 2. Config Space API
- 创建、查询、更新、删除配置空间
- 配置参数验证
- 支持预设配置空间（从文件加载）
- 参数定义查询

### 3. Result API
- 任务结果查询
- 观察记录分页查询和过滤
- 最佳配置查询
- 性能趋势分析
- 参数重要性分析
- 多任务对比

## API接口

### Config Space接口

- `POST /api/config-spaces` - 创建配置空间
- `GET /api/config-spaces` - 获取配置空间列表（支持分页和查询）
- `GET /api/config-spaces/:id` - 根据ID获取配置空间
- `GET /api/config-spaces/name/:name` - 根据名称获取配置空间
- `PUT /api/config-spaces/:id` - 更新配置空间
- `DELETE /api/config-spaces/:id` - 删除配置空间
- `POST /api/config-spaces/validate` - 验证配置参数
- `GET /api/config-spaces/:id/parameters` - 获取参数列表
- `GET /api/config-spaces/:id/parameters/:parameterName` - 获取参数定义

### Result接口

- `GET /api/tasks/:taskId/result` - 获取任务的完整结果
- `GET /api/tasks/:taskId/observations` - 获取观察记录列表
- `GET /api/tasks/:taskId/observations/:index` - 获取单个观察记录
- `GET /api/tasks/:taskId/best-config` - 获取最佳配置
- `GET /api/tasks/:taskId/trend` - 获取性能趋势
- `GET /api/tasks/:taskId/parameter-importance` - 获取参数重要性
- `POST /api/tasks/compare` - 对比多个任务
- `GET /api/tasks/:taskId/summary` - 获取任务摘要

## 数据类型说明

### Config Space
配置空间定义了可调优参数的取值范围和类型。支持两种格式：
1. **JSON格式**（huge_space.json/expert_space.json）：简单的键值对格式
2. **完整格式**（结果文件中的space.original）：包含详细的hyperparameter定义

### Result
任务结果包含：
- **task_id**: 任务标识
- **meta_info**: 元信息（元特征、随机种子、配置空间等）
- **observations**: 观察记录数组，每个记录包含：
  - config: 配置参数字典
  - objectives: 目标值数组
  - constraints: 约束数组
  - extra_info: 额外信息（SQL执行时间等）

## 开发指南

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run start:dev
```

### 构建
```bash
npm run build
```

### 生产模式
```bash
npm run start:prod
```

## 下一步

1. 实现Service层的具体逻辑
2. 添加数据持久化（数据库或文件系统）
3. 添加错误处理和日志
4. 添加单元测试和集成测试
5. 集成Swagger文档
