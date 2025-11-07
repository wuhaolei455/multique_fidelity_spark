export type ParameterValue = number | string | boolean;

export enum ParameterType {
  INTEGER = 'integer',
  FLOAT = 'float',
  STRING = 'string',
  BOOLEAN = 'boolean',
}

export enum HyperparameterDistributionType {
  UNIFORM_INT = 'uniform_int',
  UNIFORM_FLOAT = 'uniform_float',
  LOG_UNIFORM_INT = 'log_uniform_int',
  LOG_UNIFORM_FLOAT = 'log_uniform_float',
  CATEGORICAL = 'categorical',
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface SortQuery {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

