/**
 * 应用主布局组件
 */

import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import { useAppSelector } from '@/hooks/useAppDispatch';
import './AppLayout.less';

const { Content } = Layout;

const AppLayout: React.FC = () => {
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  return (
    <Layout className="app-layout">
      <AppHeader />
      <Layout>
        <AppSidebar collapsed={sidebarCollapsed} />
        <Layout className="app-content-layout">
          <Content className="app-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default AppLayout;

