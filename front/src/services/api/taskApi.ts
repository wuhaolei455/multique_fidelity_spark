import request from '../request';
import type {
  TaskResult,
  Observation,
  SimilarTask,
  ParameterImportance,
  TaskListResponse,
  TaskSummary,
  TaskStatusSummary,
  BestConfigResponse,
  TaskComparisonResponse,
  TaskCreateRequest,
} from '@/types';
import { toTaskSummary } from '@/types';

// 获取任务列表（完整数据，包含 meta_info 和 observations）
export const getTasks = (): Promise<TaskListResponse> => {
  return request({
    url: '/results/list',
    method: 'GET',
  })
    .then((response) => {
      // 响应拦截器已经返回了 response.data，所以这里直接使用 response
      const data = response as unknown as TaskResult[];
      console.log('Backend results list:', data); // 输出完整的后端数据供调试

      if (Array.isArray(data)) {
        return {
          tasks: data,
          total: data.length,
        };
      }
      return {
        tasks: [],
        total: 0,
      };
    })
    .catch((error) => {
      // 如果后端不可用，返回空数据
      if (error.isBackendUnavailable) {
        return { tasks: [], total: 0 };
      }
      throw error;
    });
};

// 获取任务详情（完整结果数据）
export const getTaskDetail = (taskId: string): Promise<TaskResult> => {
  return request({
    url: `/results/${taskId}`,
    method: 'GET',
  })
    .then((response) => {
      // 响应拦截器已经返回了 response.data，所以这里直接使用 response
      const data = response as unknown as TaskResult;
      console.log('Backend result data:', data); // 输出完整的后端数据供调试
      return data;
    })
    .catch((error) => {
      // 如果后端不可用，返回空数据
      if (error.isBackendUnavailable) {
        throw new Error('后端服务不可用');
      }
      throw error;
    });
};

// 创建任务
export const createTask = (data: TaskCreateRequest): Promise<{ taskId: string; createdAt: string; status: string }> => {
  return request({
    url: '/results/create',
    method: 'POST',
    data: {
      name: data.config.name,
      description: data.config.description,
      method: data.config.method,
      configSpace: data.config.config_space,
      iterNum: data.config.iter_num,
      initNum: data.config.init_num,
      warmStartStrategy: data.config.warm_start_strategy,
      transferLearningStrategy: data.config.transfer_learning_strategy,
      compressionStrategy: data.config.compression_strategy,
      schedulerParams: data.config.scheduler_params,
      environment: data.config.environment,
    },
  });
};

// 更新任务（后端不支持，返回提示）
export const updateTask = (
  _taskId: string,
  _data: { action: string }
): Promise<{ success: boolean }> => {
  console.warn('后端不支持更新任务接口');
  return Promise.reject(new Error('后端不支持更新任务接口'));
};

// 删除任务（后端不支持，返回提示）
export const deleteTask = (_taskId: string): Promise<{ success: boolean }> => {
  console.warn('后端不支持删除任务接口');
  return Promise.reject(new Error('后端不支持删除任务接口'));
};

// 复制任务（后端不支持，返回提示）
export const cloneTask = (_taskId: string): Promise<{ taskId: string }> => {
  console.warn('后端不支持复制任务接口');
  return Promise.reject(new Error('后端不支持复制任务接口'));
};

// 获取观察记录列表（对应后端的 observations 接口）
export const getTaskHistory = (
  taskId: string,
  query: { page?: number; pageSize?: number }
): Promise<{ observations: Observation[]; total: number }> => {
  return request({
    url: `/results/${taskId}/observations`,
    method: 'GET',
    params: query,
  }).then((response) => {
    // 响应拦截器已经返回了 response.data，所以这里直接使用 response
    return response as unknown as { observations: Observation[]; total: number };
  });
};

// 获取任务状态摘要（对应后端的 summary 接口）
export const getTaskStatus = (taskId: string): Promise<TaskStatusSummary> => {
  return request({
    url: `/results/${taskId}/summary`,
    method: 'GET',
  });
};

// 获取任务最佳配置
export const getBestConfig = (taskId: string): Promise<BestConfigResponse> => {
  return request({
    url: `/results/${taskId}/best-config`,
    method: 'GET',
  });
};

// 获取相似任务（后端不支持，返回空数组）
export const getSimilarTasks = (_taskId: string): Promise<{ tasks: SimilarTask[] }> => {
  console.warn('后端不支持相似任务接口');
  return Promise.resolve({ tasks: [] });
};

// 获取任务结果数据（使用完整结果接口）
export const getTaskResults = (
  taskId: string,
  _format?: 'json' | 'csv'
): Promise<TaskResult> => {
  return getTaskDetail(taskId);
};

// 获取性能趋势数据
export const getTaskTrend = (taskId: string): Promise<{
  data: Array<{
    iteration: number;
    objective: number;
    bestObjective: number;
    elapsedTime: number;
  }>;
  totalIterations: number;
  bestObjective: number;
  averageObjective: number;
}> => {
  return request({
    url: `/results/${taskId}/trend`,
    method: 'GET',
  });
};

// 获取参数重要性
export const getParameterImportance = (taskId: string): Promise<{
  parameters: ParameterImportance[];
}> => {
  return request({
    url: `/results/${taskId}/parameter-importance`,
    method: 'GET',
  });
};

// 对比多个任务
export const compareTasks = (taskIds: string[]): Promise<TaskComparisonResponse> => {
  return request({
    url: '/results/compare',
    method: 'POST',
    data: { taskIds },
  });
};

/**
 * 获取任务摘要列表（轻量级，用于列表展示）
 */
export const getTaskSummaries = async (): Promise<{
  tasks: TaskSummary[];
  total: number;
}> => {
  const response = await getTasks();
  const summaries = response.tasks.map(toTaskSummary);
  return {
    tasks: summaries,
    total: summaries.length,
  };
};

