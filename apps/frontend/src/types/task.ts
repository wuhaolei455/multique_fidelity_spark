// 任务状态
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped';

// 优化方法
export type OptimizationMethod = 'SMAC' | 'GP' | 'MFES_SMAC' | 'MFES_GP' | 'BOHB_GP' | 'BOHB_SMAC';

// Warm Start 策略
export type WarmStartStrategy = 'none' | 'best_rover' | 'best_all' | 'top3_rover' | 'top3_all';

// Transfer Learning 策略
export type TransferLearningStrategy = 'none' | 'mce' | 're' | 'topo' | 'reacqk' | 'reacq';

// 压缩策略
export type CompressionStrategy = 'none' | 'shap' | 'expert' | 'range';

// 试验状态
export type TrialState = 0 | 1 | 2 | 3; // 0: 成功, 1: 失败, 2: 超时, 3: 其他

// 配置参数
export interface Config {
  [key: string]: number | string | boolean;
}

export interface TaskResult {
  taskId: string;
  num_objectives: number;
  num_constraints: number;
  ref_point: number[] | null;
  meta_info: MetaInfo;
  global_start_time: string;
  observations: Observation[];
  observationCount: number;
  bestObjective: number;
  averageObjective: number;
  bestConfig: {
    config: Config;
    bestObjective: number;
  };
}

// 观察记录 - 匹配后端JSON结构
export interface Observation {
  config: Config;
  objectives: number[]; // 改为数组，支持多目标优化
  constraints: number[] | null;
  trial_state: TrialState;
  elapsed_time: number; // 执行时间（秒）
  create_time: string; // ISO时间字符串
  extra_info?: {
    origin?: string; // 配置来源
    qt_time?: Record<string, number>; // 每个查询的执行时间
    et_time?: Record<string, number>; // 额外的时间信息
    plan_sqls?: string[]; // SQL计划
    plan_timeout?: number; // 计划超时时间
    [key: string]: unknown; // 其他动态字段
  };
}

// 任务配置
export interface TaskConfig {
  name: string;
  description?: string;
  method: OptimizationMethod;
  config_space: string;
  iter_num: number;
  init_num: number;
  warm_start_strategy: WarmStartStrategy;
  transfer_learning_strategy: TransferLearningStrategy;
  compression_strategy: CompressionStrategy;
  scheduler_params?: {
    R?: number;
    eta?: number;
  };
  environment: {
    database: string;
    sql_directory: string;
    cluster_config: string;
  };
}

// 随机策略配置
export interface RandomConfig {
  seed: number;
  rand_prob: number;
  rand_mode: string;
}

// 空间压缩配置
export interface SpaceConfig {
  original: {
    hyperparameters: Array<{
      name: string;
      type: string;
      log: boolean;
      lower?: number;
      upper?: number;
      default?: number | string;
      choices?: Array<string | number | boolean>; // 参数的可选值
    }>;
  };
  dimension: number;
  range: Record<string, [number, number]>;
}

// 范围压缩详情
export interface RangeCompressionDetail {
  type: 'numeric' | 'categorical';
  original_range?: [number, number];
  compressed_range?: [number, number];
  original_default?: number | string;
  compressed_default?: number | string;
  compression_ratio?: number;
}

// 压缩器配置
export interface CompressorConfig {
  strategy: CompressionStrategy;
  original_params: string[];
  compressed_params: string[];
  computed_params?: number; // 实际上是计算得到的参数数量
  range_compression_details?: Record<string, RangeCompressionDetail>;
}

// 元信息 - 匹配后端JSON结构
export interface MetaInfo {
  meta_feature: number[]; // 元特征向量
  random: RandomConfig;
  space: SpaceConfig;
  compressor: CompressorConfig;
  tl_ws?: string[][]; // Transfer Learning工作集：字符串数组的数组
  warm_start?: string[][]; // Warm Start数据：字符串数组的数组（任务相似度信息）
}

// 相似任务
export interface SimilarTask {
  task_id: string;
  task_name: string;
  similarity: number;
  best_config: Config;
  best_objective: number;
}

// 参数重要性
export interface ParameterImportance {
  parameter: string;
  importance: number;
  shap_value?: number;
}

// 任务查询参数
export interface TaskListQuery {
  page?: number;
  pageSize?: number;
  status?: TaskStatus;
  method?: OptimizationMethod;
  keyword?: string;
}

// 任务创建请求
export interface TaskCreateRequest {
  config: TaskConfig;
}

// 任务进度信息
export interface TaskProgress {
  currentIter: number;
  totalIter: number;
  bestObjective: number;
  numEvaluated: number;
}

// 任务列表项（用于列表展示的简化版本）
export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  method: OptimizationMethod;
  progress: TaskProgress;
  best_objective?: number;
  createdAt: string;
  updatedAt: string;
  // 配置信息
  config?: {
    config_space?: string;
    iter_num?: number;
    init_num?: number;
    warm_start_strategy?: WarmStartStrategy;
    transfer_learning_strategy?: TransferLearningStrategy;
    compression_strategy?: CompressionStrategy;
  };
  // 统计信息
  numObjectives?: number;
  numConstraints?: number;
  averageObjective?: number;
  observationCount?: number;
}

// ==================== API 相关接口 ====================

/**
 * 任务列表响应格式
 */
export interface TaskListResponse {
  tasks: TaskResult[];
  total: number;
}

/**
 * 任务摘要（用于列表展示）
 */
export interface TaskSummary {
  taskId: string;
  status: TaskStatus;
  method: OptimizationMethod;
  warmStartStrategy: WarmStartStrategy;
  transferLearningStrategy: TransferLearningStrategy;
  compressionStrategy: CompressionStrategy;
  observationCount: number;
  bestObjective: number;
  createdAt: string;
}

/**
 * 任务状态摘要
 */
export interface TaskStatusSummary {
  taskId: string;
  status: TaskStatus;
  currentIteration: number;
  totalIterations: number;
  bestObjective: number;
  numEvaluated: number;
}

/**
 * 最佳配置响应
 */
export interface BestConfigResponse {
  config: Config;
  objective: number;
  iteration: number;
}

/**
 * 任务对比响应
 */
export interface TaskComparisonResponse {
  tasks: Array<{
    taskId: string;
    method: OptimizationMethod;
    bestObjective: number;
    convergenceSpeed: number;
    observations: Observation[];
  }>;
}

// ==================== 辅助工具函数 ====================

/**
 * 从任务ID推断优化方法
 */
export function inferOptimizationMethod(taskResult: TaskResult): OptimizationMethod {
  const taskId = taskResult.taskId.toLowerCase();
  if (taskId.includes('bohb_gp')) return 'BOHB_GP';
  if (taskId.includes('bohb_smac') || taskId.includes('bohb')) return 'BOHB_SMAC';
  if (taskId.includes('mfes_gp')) return 'MFES_GP';
  if (taskId.includes('mfes_smac') || taskId.includes('mfes')) return 'MFES_SMAC';
  if (taskId.includes('smac')) return 'SMAC';
  if (taskId.includes('gp')) return 'GP';
  return 'SMAC'; // 默认值
}

/**
 * 从任务ID推断Warm Start策略
 */
export function inferWarmStartStrategy(taskResult: TaskResult): WarmStartStrategy {
  const taskId = taskResult.taskId.toLowerCase();
  if (taskId.includes('best_rover')) return 'best_rover';
  if (taskId.includes('best_all')) return 'best_all';
  if (taskId.includes('top3_rover')) return 'top3_rover';
  if (taskId.includes('top3_all')) return 'top3_all';
  // 检查 meta_info 中的 warm_start 字段
  if (taskResult.meta_info?.warm_start && taskResult.meta_info.warm_start.length > 0) {
    return 'best_all'; // 如果有warm_start数据，默认为best_all
  }
  return 'none';
}

/**
 * 从任务ID推断Transfer Learning策略
 */
export function inferTransferLearningStrategy(taskResult: TaskResult): TransferLearningStrategy {
  const taskId = taskResult.taskId.toLowerCase();
  if (taskId.includes('reacqk')) return 'reacqk';
  if (taskId.includes('reacq')) return 'reacq';
  if (taskId.includes('mce')) return 'mce';
  if (taskId.includes('topo')) return 'topo';
  if (taskId.includes('re') && !taskId.includes('reacq')) return 're';
  // 检查 meta_info 中的 tl_ws 字段
  if (taskResult.meta_info?.tl_ws && taskResult.meta_info.tl_ws.length > 0) {
    return 'reacqk'; // 如果有tl_ws数据，默认为reacqk
  }
  return 'none';
}

/**
 * 将TaskResult转换为TaskSummary（用于列表展示）
 */
export function toTaskSummary(taskResult: TaskResult): TaskSummary {
  const method = inferOptimizationMethod(taskResult);
  const warmStartStrategy = inferWarmStartStrategy(taskResult);
  const transferLearningStrategy = inferTransferLearningStrategy(taskResult);
  const compressionStrategy = taskResult.meta_info.compressor?.strategy || 'none';

  return {
    taskId: taskResult.taskId,
    status: 'completed' as TaskStatus, // 后端返回的都是已完成的任务
    method,
    warmStartStrategy,
    transferLearningStrategy,
    compressionStrategy,
    observationCount: taskResult.observationCount,
    bestObjective: taskResult.bestConfig.bestObjective,
    createdAt: taskResult.global_start_time,
  };
}

/**
 * 将TaskResult转换为Task（用于列表展示）
 */
export function toTask(taskResult: TaskResult): Task {
  console.log('toTask - 输入数据:', taskResult);
  
  // 安全检查
  if (!taskResult) {
    console.error('toTask - taskResult 为空');
    throw new Error('taskResult 为空');
  }

  const method = inferOptimizationMethod(taskResult);
  const warmStartStrategy = inferWarmStartStrategy(taskResult);
  const transferLearningStrategy = inferTransferLearningStrategy(taskResult);
  const compressionStrategy = taskResult.meta_info?.compressor?.strategy || 'none';

  // 计算平均目标值 - 添加安全检查
  const observations = taskResult.observations || [];
  const averageObjective = observations.length > 0 
    ? observations.reduce((sum, obs) => sum + (obs.objectives?.[0] || 0), 0) / observations.length
    : undefined;

  // 获取最佳目标值 - 添加安全检查
  const bestObjective = taskResult.bestConfig?.bestObjective || 0;

  const task = {
    id: taskResult.taskId,
    name: taskResult.taskId,
    status: 'completed' as TaskStatus,
    method,
    progress: {
      currentIter: taskResult.observationCount || 0,
      totalIter: taskResult.observationCount || 0,
      bestObjective,
      numEvaluated: taskResult.observationCount || 0,
    },
    best_objective: bestObjective,
    createdAt: taskResult.global_start_time || new Date().toISOString(),
    updatedAt: taskResult.global_start_time || new Date().toISOString(),
    config: {
      config_space: taskResult.meta_info?.space?.original?.hyperparameters?.length?.toString() || 'unknown',
      iter_num: taskResult.observationCount || 0,
      init_num: taskResult.meta_info?.random?.seed || 42,
      warm_start_strategy: warmStartStrategy,
      transfer_learning_strategy: transferLearningStrategy,
      compression_strategy: compressionStrategy,
    },
    // 统计信息
    numObjectives: taskResult.num_objectives || 0,
    numConstraints: taskResult.num_constraints || 0,
    averageObjective,
    observationCount: taskResult.observationCount || 0,
  };

  console.log('toTask - 输出数据:', task);
  return task;
}