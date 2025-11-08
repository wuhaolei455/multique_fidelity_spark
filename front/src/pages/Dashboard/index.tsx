/**
 * 仪表盘页面
 */

import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Space, Table, Tag } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { fetchTasks } from '@/store/slices/taskSlice';
import { TASK_STATUS_COLORS, TASK_STATUS_TEXT } from '@/utils/constants';
import { formatRelativeTime } from '@/utils/format';
import type { Task } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import './index.less';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tasks, loading } = useAppSelector((state) => state.task);

  useEffect(() => {
    dispatch(fetchTasks({ pageSize: 5 }));
  }, [dispatch]);

  // 计算统计数据
  const stats = {
    total: tasks.length,
    running: tasks.filter((t) => t.status === 'running').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  };

  // 最近任务表格列
  const columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/tasks/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={TASK_STATUS_COLORS[status as keyof typeof TASK_STATUS_COLORS]}>
          {TASK_STATUS_TEXT[status as keyof typeof TASK_STATUS_TEXT]}
        </Tag>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 120,
      render: (_, record) => (
        <span>
          {record.progress.currentIter}/{record.progress.totalIter}
        </span>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (text) => formatRelativeTime(text),
    },
  ];

  return (
    <div className="dashboard-page">
      <Row gutter={[16, 16]}>
        {/* 统计卡片 */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="运行中"
              value={stats.running}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SyncOutlined spin />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="失败"
              value={stats.failed}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>

        {/* 快速操作 */}
        <Col xs={24}>
          <Card title="快速操作" bordered={false}>
            <Space size="large">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/tasks/create')}
              >
                创建任务
              </Button>
              <Button size="large" onClick={() => navigate('/tasks')}>
                查看所有任务
              </Button>
              <Button size="large" onClick={() => navigate('/results')}>
                结果分析
              </Button>
              <Button size="large" onClick={() => navigate('/config')}>
                配置管理
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 最近任务 */}
        <Col xs={24}>
          <Card
            title="最近任务"
            extra={<a onClick={() => navigate('/tasks')}>查看全部</a>}
            bordered={false}
          >
            <Table
              columns={columns}
              dataSource={tasks}
              loading={loading}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

