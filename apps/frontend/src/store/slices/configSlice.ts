/**
 * 配置空间状态管理
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ConfigSpace, Template } from '@/types';
import * as configApi from '@/services/api/configApi';

interface ConfigState {
  configSpaces: ConfigSpace[];
  currentConfigSpace: ConfigSpace | null;
  templates: Template[];
  loading: boolean;
  error: string | null;
}

const initialState: ConfigState = {
  configSpaces: [],
  currentConfigSpace: null,
  templates: [],
  loading: false,
  error: null,
};

// 异步操作
export const fetchConfigSpaces = createAsyncThunk(
  'config/fetchConfigSpaces',
  async () => {
    const response = await configApi.getConfigSpaces();
    return response;
  }
);

export const fetchConfigSpace = createAsyncThunk(
  'config/fetchConfigSpace',
  async (spaceId: string) => {
    const response = await configApi.getConfigSpace(spaceId);
    return response;
  }
);

export const fetchTemplates = createAsyncThunk(
  'config/fetchTemplates',
  async () => {
    const response = await configApi.getTemplates();
    return response;
  }
);

// Slice
const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    clearCurrentConfigSpace: (state) => {
      state.currentConfigSpace = null;
    },
  },
  extraReducers: (builder) => {
    // 获取配置空间列表
    builder
      .addCase(fetchConfigSpaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConfigSpaces.fulfilled, (state, action) => {
        state.loading = false;
        state.configSpaces = action.payload;
      })
      .addCase(fetchConfigSpaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取配置空间列表失败';
        state.configSpaces = []; // 确保失败时也保持为数组
      });

    // 获取配置空间详情
    builder
      .addCase(fetchConfigSpace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConfigSpace.fulfilled, (state, action) => {
        state.loading = false;
        state.currentConfigSpace = action.payload;
      })
      .addCase(fetchConfigSpace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取配置空间详情失败';
      });

    // 获取模板列表
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取模板列表失败';
      });
  },
});

export const { clearCurrentConfigSpace } = configSlice.actions;
export default configSlice.reducer;

