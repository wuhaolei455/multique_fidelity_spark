/**
 * 常量定义
 */

import type { TaskStatus, OptimizationMethod } from '@/types';

// 任务状态颜色映射
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'default',
  running: 'processing',
  completed: 'success',
  failed: 'error',
  stopped: 'warning',
};

// 任务状态文本映射
export const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
  pending: '等待中',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
  stopped: '已停止',
};

// 优化方法文本映射
export const METHOD_TEXT: Record<OptimizationMethod, string> = {
  SMAC: 'SMAC',
  GP: 'GP',
  MFES_SMAC: 'MFES-SMAC',
  MFES_GP: 'MFES-GP',
  BOHB_GP: 'BOHB-GP',
  BOHB_SMAC: 'BOHB-SMAC',
};

// 日志级别颜色
export const LOG_LEVEL_COLORS = {
  info: '#1890ff',
  debug: '#52c41a',
  warn: '#faad14',
  error: '#f5222d',
};

// 默认分页大小
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

