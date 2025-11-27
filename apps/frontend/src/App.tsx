/**
 * 根组件
 */

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from '@/store';
import router from '@/router';
import './App.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 8,
          },
        }}
      >
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </Provider>
  );
};

export default App;

