/**
 * 配置空间相关类型定义
 */

// 参数类型 - 匹配后端JSON结构
export type ParameterType = 
  | 'uniform_int' 
  | 'uniform_float' 
  | 'categorical' 
  | 'ordinal'
  | 'int' // 兼容旧格式
  | 'float'; // 兼容旧格式

// 超参数定义 - 匹配后端JSON结构
export interface Hyperparameter {
  name: string;
  type: ParameterType;
  log: boolean;
  lower?: number;
  upper?: number;
  default?: number | string | boolean;
  choices?: Array<string | number | boolean>; // 参数的可选值列表
  description?: string;
}

// 参数定义 - 前端使用的简化版本
export interface Parameter {
  name: string;
  type: ParameterType;
  range?: [number, number];
  choices?: (string | number | boolean)[];
  default?: number | string | boolean;
  log?: boolean;
  description?: string;
}

// 配置空间 - 前端使用
export interface ConfigSpace {
  id: string;
  name: string;
  description?: string;
  parameters: Parameter[];
  createdAt: string;
  updatedAt: string;
}

// 后端配置空间结构
export interface BackendConfigSpace {
  original: {
    hyperparameters: Hyperparameter[];
  };
  dimension: number;
  range: Record<string, [number, number]>;
}

// 配置模板
export interface Template {
  id: string;
  name: string;
  description?: string;
  config: Record<string, string | number | boolean>; // 配置参数键值对
  createdAt: string;
}

