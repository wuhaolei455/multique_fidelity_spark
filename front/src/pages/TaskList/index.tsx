/**
 * 任务列表页面
 */

import React, { useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  CopyOutlined,
  MonitorOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { fetchTasks, deleteTask, setQuery } from '@/store/slices/taskSlice';
import { TASK_STATUS_COLORS, TASK_STATUS_TEXT, METHOD_TEXT } from '@/utils/constants';
import { formatDateTime } from '@/utils/format';
import type { Task, TaskStatus, OptimizationMethod } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import './index.less';

const { Search } = Input;

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tasks, total, loading, query } = useAppSelector((state) => state.task);

  useEffect(() => {
    dispatch(fetchTasks(query));
  }, [dispatch, query]);

  useEffect(() => {
    console.log('tasks', tasks);
  });

  // 搜索
  const handleSearch = (keyword: string) => {
    dispatch(setQuery({ keyword, page: 1 }));
  };

  // 状态筛选
  const handleStatusFilter = (status: TaskStatus | 'all') => {
    dispatch(setQuery({ status: status === 'all' ? undefined : status, page: 1 }));
  };

  // 方法筛选
  const handleMethodFilter = (method: OptimizationMethod | 'all') => {
    dispatch(setQuery({ method: method === 'all' ? undefined : method, page: 1 }));
  };

  // 分页
  const handlePageChange = (page: number, pageSize: number) => {
    dispatch(setQuery({ page, pageSize }));
  };

  // 刷新
  const handleRefresh = () => {
    dispatch(fetchTasks(query));
  };

  // 删除任务
  const handleDelete = async (taskId: string) => {
    try {
      await dispatch(deleteTask(taskId)).unwrap();
      message.success('任务已删除');
      dispatch(fetchTasks(query));
    } catch (error) {
      message.error('删除任务失败');
    }
  };

  // 表格列
  const columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <a onClick={() => navigate(`/tasks/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '优化方法',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      render: (method: OptimizationMethod) => METHOD_TEXT[method],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={TASK_STATUS_COLORS[status]}>
          {TASK_STATUS_TEXT[status]}
        </Tag>
      ),
    },
    {
      title: '配置空间',
      key: 'config_space',
      width: 150,
      render: (_, record) => record.config?.config_space || 'unknown',
    },
    {
      title: '进度',
      key: 'progress',
      width: 150,
      render: (_, record) => (
        <div>
          <div>
            {record.progress.currentIter}/{record.progress.totalIter}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            最佳: {record.progress.bestObjective.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      title: '结果统计',
      key: 'stats',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            <span style={{ color: '#666' }}>目标数: </span>
            {record.numObjectives || 0}
          </div>
          <div style={{ fontSize: '12px' }}>
            <span style={{ color: '#666' }}>约束数: </span>
            {record.numConstraints || 0}
          </div>
          {record.averageObjective && (
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: '#666' }}>平均: </span>
              {record.averageObjective.toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => formatDateTime(text),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (text) => formatDateTime(text),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/tasks/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<MonitorOutlined />}
            onClick={() => navigate(`/tasks/${record.id}/monitor`)}
          >
            监控
          </Button>
          <Popconfirm
            title="确定删除此任务吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="task-list-page">
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 工具栏 */}
          <div className="toolbar">
            <Space>
              <Search
                placeholder="搜索任务名称"
                allowClear
                onSearch={handleSearch}
                style={{ width: 250 }}
              />
              <Select
                placeholder="状态筛选"
                style={{ width: 120 }}
                onChange={handleStatusFilter}
                allowClear
              >
                <Select.Option value="all">全部状态</Select.Option>
                <Select.Option value="pending">等待中</Select.Option>
                <Select.Option value="running">运行中</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
                <Select.Option value="failed">失败</Select.Option>
                <Select.Option value="stopped">已停止</Select.Option>
              </Select>
              <Select
                placeholder="方法筛选"
                style={{ width: 150 }}
                onChange={handleMethodFilter}
                allowClear
              >
                <Select.Option value="all">全部方法</Select.Option>
                <Select.Option value="SMAC">SMAC</Select.Option>
                <Select.Option value="GP">GP</Select.Option>
                <Select.Option value="MFES_SMAC">MFES-SMAC</Select.Option>
                <Select.Option value="MFES_GP">MFES-GP</Select.Option>
                <Select.Option value="BOHB_GP">BOHB-GP</Select.Option>
                <Select.Option value="BOHB_SMAC">BOHB-SMAC</Select.Option>
              </Select>
            </Space>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/tasks/create')}
              >
                创建任务
              </Button>
            </Space>
          </div>

          {/* 表格 */}
          <Table
            columns={columns}
            dataSource={tasks}
            loading={loading}
            rowKey="id"
            pagination={{
              current: query.page,
              pageSize: query.pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: handlePageChange,
            }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default TaskList;

