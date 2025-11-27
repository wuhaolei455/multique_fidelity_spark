/**
 * 路由配置
 */

import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import TaskList from '@/pages/TaskList';
import TaskDetail from '@/pages/TaskDetail';
import TaskCreate from '@/pages/TaskCreate';
import TaskMonitor from '@/pages/TaskMonitor';
import Results from '@/pages/Results';
import Config from '@/pages/Config';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'tasks',
        element: <TaskList />,
      },
      {
        path: 'tasks/create',
        element: <TaskCreate />,
      },
      {
        path: 'tasks/:taskId',
        element: <TaskDetail />,
      },
      {
        path: 'tasks/:taskId/monitor',
        element: <TaskMonitor />,
      },
      {
        path: 'results',
        element: <Results />,
      },
      {
        path: 'config',
        element: <Config />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;

