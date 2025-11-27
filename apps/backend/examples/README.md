# 瀑布流组件配置空间示例

## 概述

本示例演示如何为**瀑布流组件**创建一个配置空间。瀑布流是一个常见的前端UI组件，用于展示图片流、内容流等，具有自适应布局、懒加载、动画效果等特性。

## 配置参数说明

### 布局参数
- **waterfall.columnCount**: 列数 (2-6)
- **waterfall.columnGap**: 列间距 (8-32px)
- **waterfall.rowGap**: 行间距 (8-32px)
- **waterfall.minColumnWidth**: 最小列宽 (200-400px)

### 加载参数
- **waterfall.itemsPerLoad**: 每次加载的项目数 (10-50)
- **waterfall.lazyLoadThreshold**: 懒加载触发阈值 (200-1000px)
- **waterfall.preloadCount**: 预加载数量 (3-15)
- **waterfall.maxConcurrentLoads**: 最大并发加载数 (3-10)

### 图片参数
- **waterfall.imageQuality**: 图片质量 (0.6-1.0)
- **waterfall.thumbnailQuality**: 缩略图质量 (0.3-0.7)
- **waterfall.maxImageWidth**: 最大图片宽度 (400-1200px)
- **waterfall.maxImageHeight**: 最大图片高度 (400-2000px)
- **waterfall.imageLoadTimeout**: 图片加载超时时间 (5000-30000ms)

### 动画参数
- **waterfall.animationDuration**: 动画持续时间 (150-600ms)
- **waterfall.animationDelay**: 动画延迟 (0-100ms)

### 性能参数
- **waterfall.cacheSize**: 缓存大小 (50-300项)
- **waterfall.renderBatchSize**: 渲染批次大小 (5-30)
- **waterfall.renderDelay**: 渲染延迟 (0-100ms)
- **waterfall.scrollThrottleDelay**: 滚动节流延迟 (50-300ms)
- **waterfall.resizeDebounceDelay**: 窗口调整防抖延迟 (100-500ms)
- **waterfall.virtualScrollBuffer**: 虚拟滚动缓冲区 (500-2000px)

### 容错参数
- **waterfall.retryAttempts**: 重试次数 (1-5)
- **waterfall.retryDelay**: 重试延迟 (500-3000ms)
- **waterfall.placeholderColor**: 占位符颜色值 (200-255)

### 布局优化参数
- **waterfall.rebalanceThreshold**: 列高差重平衡阈值 (0.1-0.5)

## 使用方法

### 1. 确保后端服务已启动

```bash
cd backend
npm run dev
```

后端服务会在 `http://localhost:3000` 运行。

### 2. 执行添加脚本

```bash
cd backend/examples
chmod +x add_waterfall_config_space.sh
./add_waterfall_config_space.sh
```

### 3. 或者直接使用curl命令

```bash
curl -X POST http://localhost:3000/api/config-spaces \
  -H "Content-Type: application/json" \
  -d @waterfall_config_space.json
```

## 验证配置空间

### 查看所有配置空间

```bash
curl http://localhost:3000/api/config-spaces
```

### 根据名称查找

```bash
curl http://localhost:3000/api/config-spaces/name/waterfall-component-optimized
```

### 获取参数列表

```bash
# 假设返回的ID为 cs_123456
curl http://localhost:3000/api/config-spaces/cs_123456/parameters
```

## 性能优化建议

根据不同场景，可以调整配置以获得最佳性能：

### 高性能场景（移动端、低端设备）
- columnCount: 2-3
- imageQuality: 0.7-0.8
- thumbnailQuality: 0.4-0.5
- renderBatchSize: 5-8
- cacheSize: 50-80

### 桌面端场景
- columnCount: 3-5
- imageQuality: 0.85-0.95
- thumbnailQuality: 0.5-0.6
- renderBatchSize: 10-20
- cacheSize: 100-200

### 高质量展示场景
- columnCount: 3-4
- imageQuality: 0.9-1.0
- thumbnailQuality: 0.6-0.7
- renderBatchSize: 8-15
- cacheSize: 150-300

## 配置空间优化目标

通过贝叶斯优化等方法，可以针对以下目标优化配置：

1. **加载速度**: 最小化首屏加载时间
2. **渲染性能**: 最大化FPS，最小化渲染耗时
3. **用户体验**: 平衡质量和速度
4. **资源占用**: 最小化内存和带宽使用
5. **视觉平衡**: 优化布局均衡性

## 注意事项

1. 所有尺寸参数单位为像素(px)或毫秒(ms)
2. 质量参数为0-1之间的浮点数
3. 配置参数会影响瀑布流组件的性能和用户体验，需要根据实际场景调优
4. 可以使用多保真度优化策略，在不同数据量级下评估配置效果
