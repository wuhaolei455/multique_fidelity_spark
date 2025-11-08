/**
 * 任务状态管理
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Task, TaskResult, TaskListQuery, TaskCreateRequest, TaskProgress } from '@/types';
import { toTask } from '@/types';
import * as taskApi from '@/services/api/taskApi';

interface TaskState {
  tasks: Task[];
  currentTask: TaskResult | null;
  total: number;
  loading: boolean;
  error: string | null;
  query: TaskListQuery;
}

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  total: 0,
  loading: false,
  error: null,
  query: {
    page: 1,
    pageSize: 10,
  },
};

// 异步操作
export const fetchTasks = createAsyncThunk(
  'task/fetchTasks',
  async (_query?: TaskListQuery) => {
    const response = await taskApi.getTasks();
    console.log('fetchTasks - 原始响应:', response);
    console.log('fetchTasks - tasks数量:', response.tasks?.length);
    
    // 将 TaskResult[] 转换为 Task[]
    const tasks = response.tasks.map((taskResult, index) => {
      console.log(`转换任务 ${index}:`, taskResult);
      try {
        const task = toTask(taskResult);
        console.log(`转换后的任务 ${index}:`, task);
        return task;
      } catch (error) {
        console.error(`转换任务 ${index} 失败:`, error, taskResult);
        throw error;
      }
    });
    
    console.log('fetchTasks - 转换后的tasks:', tasks);
    return {
      tasks,
      total: response.total,
    };
  }
);

export const fetchTaskDetail = createAsyncThunk(
  'task/fetchTaskDetail',
  async (taskId: string) => {
    const response = await taskApi.getTaskDetail(taskId);
    return response;
  }
);

export const createTask = createAsyncThunk(
  'task/createTask',
  async (data: TaskCreateRequest) => {
    const response = await taskApi.createTask(data);
    return response;
  }
);

export const updateTaskStatus = createAsyncThunk(
  'task/updateTaskStatus',
  async ({ taskId, action }: { taskId: string; action: string }) => {
    const response = await taskApi.updateTask(taskId, { action });
    return response;
  }
);

export const deleteTask = createAsyncThunk(
  'task/deleteTask',
  async (taskId: string) => {
    await taskApi.deleteTask(taskId);
    return taskId;
  }
);

export const cloneTask = createAsyncThunk(
  'task/cloneTask',
  async (taskId: string) => {
    const response = await taskApi.cloneTask(taskId);
    return response;
  }
);

// Slice
const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<Partial<TaskListQuery>>) => {
      state.query = { ...state.query, ...action.payload };
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    updateTaskProgress: (state, action: PayloadAction<{ taskId: string; progress: Partial<TaskProgress> }>) => {
      const task = state.tasks.find((t: Task) => t.id === action.payload.taskId);
      if (task) {
        task.progress = { ...task.progress, ...action.payload.progress };
      }
      if (state.currentTask?.taskId === action.payload.taskId) {
        // TaskResult 没有 progress 字段，需要更新观察计数
        // 这里保持兼容性，不做更改
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 获取任务列表
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.tasks;
        state.total = action.payload.total;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取任务列表失败';
      });

    // 获取任务详情
    builder
      .addCase(fetchTaskDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取任务详情失败';
      });

    // 创建任务
    builder
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '创建任务失败';
      });

    // 删除任务
    builder
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter((task: Task) => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '删除任务失败';
      });
  },
});

export const { setQuery, clearCurrentTask, updateTaskProgress, clearError } = taskSlice.actions;
export default taskSlice.reducer;

