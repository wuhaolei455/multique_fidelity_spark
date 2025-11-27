/**
 * Result相关的完整类型定义
 * 基于 TEST____Wbest_all4Treacqk3Cshapk40sigma2.0top_ratio0.8__Sbohb__s42_2025-11-08-02-08-22-806416.json
 */

// 基础类型
export type Config = Record<string, number | string | boolean>;
export type Objectives = number[];
export type Constraints = number[] | null;
export type MetaFeature = number[];

// Random配置
export interface RandomConfig {
  seed: number;
  rand_prob: number;
  rand_mode: string;
}

// 超参数定义
export interface HyperparameterDefinition {
  name: string;
  type: string;
  log: boolean;
  lower: number;
  upper: number;
  default: number;
  choices?: any[];
}

// 配置空间元信息
export interface SpaceMetaInfo {
  original: {
    hyperparameters: HyperparameterDefinition[];
  };
}

// 任务元信息
export interface TaskMetaInfo {
  meta_feature: MetaFeature;
  random?: RandomConfig;
  space?: SpaceMetaInfo;
  warm_start?: string;
  tl_ws?: any;
}

// 额外信息
export interface ExtraInfo {
  origin?: string;
  qt_time?: Record<string, number>;
  resource_ratio?: number;
  [key: string]: any;
}

// 观察记录
export interface Observation {
  config: Config;
  objectives: Objectives;
  constraints: Constraints;
  trial_state: number;
  elapsed_time: number;
  create_time: string;
  extra_info?: ExtraInfo;
}

// 完整的任务结果（对应JSON文件结构）
export interface TaskResult {
  task_id: string;
  num_objectives: number;
  num_constraints: number;
  ref_point: number[] | null;
  meta_info: TaskMetaInfo;
  global_start_time?: string;
  observations: Observation[];
}

// 任务列表项（用于 /api/results/list 返回）
export interface TaskListItem {
  taskId: string;
  fileName: string;
  filePath: string;
  observationCount: number;
  bestObjective: number;
  averageObjective: number;
  numObjectives: number;
  numConstraints: number;
  createdAt: string;
  updatedAt: string;
  meta_info: TaskMetaInfo;
  observations: Observation[];
}

// 任务统计信息
export interface TaskStatistics {
  taskId: string;
  observationCount: number;
  bestObjective: number;
  averageObjective: number;
  totalElapsedTime: number;
  status: 'running' | 'completed' | 'failed';
}

// 趋势数据点
export interface TrendDataPoint {
  iteration: number;
  objective: number;
  bestObjective: number;
  elapsedTime: number;
}

// 参数重要性
export interface ParameterImportance {
  parameterName: string;
  importance: number;
  parameterType?: string;
}

// 任务对比
export interface TaskComparison {
  taskId: string;
  observationCount: number;
  bestObjective: number;
  averageObjective: number;
  totalElapsedTime: number;
  status: 'running' | 'completed' | 'failed';
}

// 分页查询参数
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
