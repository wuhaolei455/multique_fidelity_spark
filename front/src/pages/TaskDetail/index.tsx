/**
 * 任务详情页面
 */

import React, { useEffect } from 'react';
import { Card, Tabs, Button, Space, Tag, Descriptions, message } from 'antd';
import { ArrowLeftOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { fetchTaskDetail, updateTaskStatus } from '@/store/slices/taskSlice';
import { TASK_STATUS_COLORS, TASK_STATUS_TEXT } from '@/utils/constants';
import OverviewTab from './OverviewTab';
import MonitorTab from './MonitorTab';
import ConfigsTab from './ConfigsTab';
import LogsTab from './LogsTab';
import ResultsTab from './ResultsTab';
import './index.less';

const TaskDetail: React.FC = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const dispatch = useAppDispatch();
  const { currentTask, loading } = useAppSelector((state) => state.task);

  useEffect(() => {
    if (taskId) {
      dispatch(fetchTaskDetail(taskId));
    }
  }, [dispatch, taskId]);

  const handleStop = async () => {
    if (!taskId) return;
    try {
      await dispatch(updateTaskStatus({ taskId, action: 'stop' })).unwrap();
      message.success('任务已停止');
      dispatch(fetchTaskDetail(taskId));
    } catch (error) {
      message.error('停止任务失败');
    }
  };

  const handleBack = () => {
    navigate('/tasks');
  };

  if (!currentTask && !loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>任务不存在</p>
          <Button onClick={handleBack}>返回任务列表</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="task-detail-page">
      {/* 头部 */}
      <Card className="task-header">
        <div className="header-content">
          <div className="header-left">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{ marginRight: 16 }}
            >
              返回
            </Button>
            <div>
              <h2 style={{ margin: 0 }}>{currentTask?.taskId}</h2>
              <p style={{ margin: '8px 0 0', color: '#999' }}>
                任务详情
              </p>
            </div>
          </div>
          <div className="header-right">
            <Space>
              <Tag color={TASK_STATUS_COLORS['completed']}>
                {TASK_STATUS_TEXT['completed']}
              </Tag>
            </Space>
          </div>
        </div>
      </Card>

      {/* 标签页 */}
      <Card style={{ marginTop: 16 }}>
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: 'overview',
              label: '概览',
              children: <OverviewTab task={currentTask} />,
            },
            {
              key: 'monitor',
              label: '实时监控',
              children: <MonitorTab task={currentTask} />,
            },
            {
              key: 'configs',
              label: '配置历史',
              children: <ConfigsTab task={currentTask} />,
            },
            {
              key: 'logs',
              label: '日志',
              children: <LogsTab taskId={taskId} />,
            },
            {
              key: 'results',
              label: '结果分析',
              children: <ResultsTab task={currentTask} />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default TaskDetail;

