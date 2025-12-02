/**
 * Redux Store 配置
 */

import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './slices/taskSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    task: taskReducer,
    ui: uiReducer,
  },
});

// 类型定义
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

