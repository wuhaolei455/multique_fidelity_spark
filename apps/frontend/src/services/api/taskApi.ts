import request from '../request';
import { toTaskSummary } from '@/types/task';
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
  Config,
} from '@/types';

export interface LaunchFrameworkPayload {
  name: string;
  description?: string;
  iterNum?: number;
  database?: string;
  similarityThreshold?: number;
  logDir?: string;
  dataDir?: string;
  historyDir?: string;
  saveDir?: string;
  target?: string;
  seed?: number;
  randProb?: number;
  randMode?: 'ran' | 'rs';
  opt?: string;
  logLevel?: 'info' | 'debug';
  testMode?: boolean;
  wsInitNum?: number;
  wsTopk?: number;
  wsInnerSurrogateModel?: string;
  wsStrategy?: string;
  tlTopk?: number;
  tlStrategy?: string;
  compress?: string;
  cpStrategy?: string;
  cpTopk?: number;
  cpSigma?: number;
  cpTopRatio?: number;
  schedulerR?: number;
  schedulerEta?: number;
  configSpacePath?: string;
  expertSpacePath?: string;
  historyFileName?: string;
  historyFileContent?: string;
  serverHistoryFile?: string;
  dataFileName?: string;
  dataFileContent?: string;
  serverDataFile?: string;
  hugeSpaceFileContent?: string;
}

// 获取服务端文件列表
export const getServerFiles = (type: 'history' | 'data', path?: string): Promise<string[]> => {
  return request({
    url: '/tasks/server-files',
    method: 'GET',
    params: { type, path },
  });
};

// 获取任务列表（完整数据，包含 meta_info 和 observations）
export const getTasks = (): Promise<TaskListResponse> => {
  return request({
    url: '/tasks/list',
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
    url: `/tasks/${taskId}`,
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

export const createFrameworkTask = (data: LaunchFrameworkPayload) => {
  return request<{
    taskId: string;
    createdAt: string;
    status: string;
    configSpacePath: string;
    scriptPath: string;
    configFilePath: string;
    historyFilePath: string;
    dataFilePath: string;
  }>({
    url: '/tasks/create',
    method: 'POST',
    data,
  });
};

export const startTask = (taskId: string) => {
  return request<void>({
    url: `/tasks/${taskId}/start`,
    method: 'POST',
  });
};

// 获取观察记录列表（对应后端的 observations 接口）
// TODO: 该接口在后端已被删除，需要确认前端是否真的需要，如果需要则需在 TaskController 中重新实现
export const getTaskHistory = (
  taskId: string,
  query: { page?: number; pageSize?: number }
): Promise<{ observations: Observation[]; total: number }> => {
  // 临时：直接获取任务详情，然后前端分页
  return getTaskDetail(taskId).then(result => {
      const observations = result.observations || [];
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return {
          observations: observations.slice(start, end),
          total: observations.length
      };
  });
};

// 获取任务状态摘要（对应后端的 summary 接口）
export const getTaskStatus = (taskId: string): Promise<TaskStatusSummary> => {
    // 临时：从详情中提取
    return getTaskDetail(taskId).then(result => ({
        taskId: result.taskId,
        status: 'completed' as const, // 假设
        currentIteration: result.observationCount,
        totalIterations: result.observationCount,
        bestObjective: result.bestConfig?.bestObjective || 0,
        numEvaluated: result.observationCount
    }));
};

// 获取任务最佳配置
export const getBestConfig = (taskId: string): Promise<BestConfigResponse> => {
    // 临时：从详情中提取
    return getTaskDetail(taskId).then(result => ({
        config: result.bestConfig?.config || {},
        objective: result.bestConfig?.bestObjective || 0,
        iteration: 0 // 暂时未知
    }));
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
    // 临时：从详情中计算
    return getTaskDetail(taskId).then(result => {
        let best = Infinity;
        const data = (result.observations || []).map((obs, idx) => {
            best = Math.min(best, obs.objectives[0]);
            return {
                iteration: idx,
                objective: obs.objectives[0],
                bestObjective: best,
                elapsedTime: obs.elapsed_time
            };
        });
        return {
            data,
            totalIterations: data.length,
            bestObjective: best,
            averageObjective: 0 // 略
        };
    });
};

interface ObservationResponse {
  index: number;
  config: Config;
  objectives: number[];
  constraints?: number[] | null;
  trialState: number;
  elapsedTime: number;
  createTime: string;
  extraInfo?: Record<string, unknown>;
}

interface ObservationListResponse {
  items: ObservationResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getTaskObservations = (
  taskId: string,
  params?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' },
): Promise<ObservationListResponse> => {
    return getTaskDetail(taskId).then(result => {
        // 简单实现，暂不支持排序
        const observations = result.observations || [];
        const page = params?.page || 1;
        const pageSize = params?.pageSize || 10;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = observations.slice(start, end).map((obs, idx) => ({
            index: start + idx,
            config: obs.config,
            objectives: obs.objectives,
            constraints: obs.constraints,
            trialState: obs.trial_state,
            elapsedTime: obs.elapsed_time,
            createTime: obs.create_time,
            extraInfo: obs.extra_info
        }));
        
        return {
            items,
            total: observations.length,
            page,
            pageSize,
            totalPages: Math.ceil(observations.length / pageSize)
        };
    });
};

// 获取参数重要性
export const getParameterImportance = (taskId: string): Promise<{
  parameters: ParameterImportance[];
}> => {
  // 暂未实现
  return Promise.resolve({ parameters: [] });
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

