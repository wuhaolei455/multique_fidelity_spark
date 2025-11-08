/**
 * 应用侧边栏组件
 */

import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UnorderedListOutlined,
  PlusCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './AppSidebar.less';

const { Sider } = Layout;

interface AppSidebarProps {
  collapsed: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/tasks',
      icon: <UnorderedListOutlined />,
      label: '任务列表',
    },
    {
      key: '/tasks/create',
      icon: <PlusCircleOutlined />,
      label: '创建任务',
    },
    {
      key: '/results',
      icon: <BarChartOutlined />,
      label: '结果分析',
    },
    {
      key: '/config',
      icon: <SettingOutlined />,
      label: '配置管理',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="app-sidebar"
      width={200}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default AppSidebar;

