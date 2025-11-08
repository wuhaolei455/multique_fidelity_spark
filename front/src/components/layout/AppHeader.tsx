/**
 * 应用头部组件
 */

import React from 'react';
import { Layout, Space, Typography, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { toggleSidebar } from '@/store/slices/uiSlice';
import './AppHeader.less';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader: React.FC = () => {
  const dispatch = useAppDispatch();
  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <Header className="app-header">
      <div className="app-header-left">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleSidebar}
          className="sidebar-toggle"
        />
        <Title level={4} className="app-title">
          Spark 调优框架
        </Title>
      </div>
      <div className="app-header-right">
        <Space>
          <Button
            type="text"
            icon={<GithubOutlined />}
            href="https://github.com"
            target="_blank"
          >
            GitHub
          </Button>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;

