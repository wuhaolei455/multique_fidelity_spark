/**
 * UI 状态管理
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setTheme } = uiSlice.actions;
export default uiSlice.reducer;

