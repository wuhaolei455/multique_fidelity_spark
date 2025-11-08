/**
 * 格式化工具函数
 */

import dayjs from 'dayjs';

// 格式化日期时间
export const formatDateTime = (dateTime: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(dateTime).format(format);
};

// 格式化相对时间
export const formatRelativeTime = (dateTime: string | Date): string => {
  const now = dayjs();
  const target = dayjs(dateTime);
  const diff = now.diff(target, 'second');

  if (diff < 60) {
    return `${diff}秒前`;
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟前`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时前`;
  } else if (diff < 2592000) {
    return `${Math.floor(diff / 86400)}天前`;
  } else {
    return target.format('YYYY-MM-DD');
  }
};

// 格式化数字
export const formatNumber = (num: number, precision = 2): string => {
  if (num === null || num === undefined) return '-';
  return num.toFixed(precision);
};

// 格式化百分比
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// 格式化持续时间（秒转为可读格式）
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(0)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分`;
  }
};

