# Spark 多保真度调优框架前端项目

这是一个基于 React + TypeScript + Redux + Webpack 构建的前端可视化系统，用于展示和管理 Spark/MySQL 多保真度超参数调优框架的运行过程和结果。

## 技术栈

- **框架**: React 18.x
- **语言**: TypeScript 5.x
- **构建工具**: Webpack 5.x
- **状态管理**: Redux Toolkit
- **UI 组件库**: Ant Design 5.x
- **数据可视化**: ECharts
- **HTTP 客户端**: Axios
- **实时通信**: Socket.io-client
- **路由**: React Router 6.x

## 项目结构

```
front/
├── public/                 # 静态资源
│   ├── index.html         # HTML 模板
│   └── favicon.ico        # 网站图标
├── src/
│   ├── components/        # 通用组件
│   │   ├── layout/       # 布局组件
│   │   └── charts/       # 图表组件
│   ├── pages/            # 页面组件
│   │   ├── Dashboard/    # 仪表盘
│   │   ├── TaskList/     # 任务列表
│   │   ├── TaskDetail/   # 任务详情
│   │   ├── TaskCreate/   # 创建任务
│   │   ├── Results/      # 结果分析
│   │   └── Config/       # 配置管理
│   ├── hooks/            # 自定义 Hooks
│   ├── services/         # API 服务
│   │   ├── api/         # REST API
│   │   └── websocket/   # WebSocket
│   ├── store/            # Redux 状态管理
│   │   └── slices/      # Redux Slices
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   ├── App.tsx           # 根组件
│   ├── App.css           # 全局样式
│   ├── index.tsx         # 入口文件
│   └── router.tsx        # 路由配置
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm start
```

应用将在 [http://localhost:4000](http://localhost:4000) 启动。

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 代码检查

```bash
npm run lint
npm run lint:fix
```

### 类型检查

```bash
npm run type-check
```

## 功能模块

### 1. 仪表盘（Dashboard）
- 系统概览统计
- 最近任务列表
- 快速操作入口

### 2. 任务管理
- **任务列表**: 展示所有任务，支持搜索、筛选、分页
- **任务创建**: 步骤式向导创建任务
- **任务详情**: 
  - 概览：任务基本信息和进度
  - 实时监控：性能曲线图、当前迭代信息
  - 配置历史：已评估配置列表
  - 日志：实时日志流
  - 结果分析：性能趋势、最佳配置

### 3. 结果分析
- 多任务对比
- 性能指标可视化
- 参数影响分析

### 4. 配置管理
- 配置空间管理
- 参数模板管理

## API 配置

后端 API 服务地址在 `webpack.config.js` 中配置：

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

**说明：**
- 前端开发服务器运行在 `http://localhost:4000`
- 后端 API 服务运行在 `http://localhost:3000`
- 所有 `/api/*` 请求会自动代理到后端服务器

## 开发规范

### 组件命名
- 使用 PascalCase 命名组件文件：`ComponentName.tsx`
- 使用 camelCase 命名工具函数文件：`utilFunction.ts`

### 样式文件
- 组件样式使用 Less，文件名与组件名对应：`ComponentName.less`
- 全局样式放在 `App.css`

### 类型定义
- 所有类型定义放在 `src/types/` 目录
- 使用 TypeScript 接口定义数据结构

### Redux 使用
- 使用 Redux Toolkit 简化状态管理
- 异步操作使用 `createAsyncThunk`
- 使用自定义 hooks：`useAppDispatch` 和 `useAppSelector`

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

MIT

