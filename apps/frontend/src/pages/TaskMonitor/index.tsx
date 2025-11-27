import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Tag, Button, Typography, Space, Alert, Row, Col, Progress } from 'antd';
import { 
  SyncOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTaskWebSocket, TaskLogMessage, TaskStatusMessage } from '../../hooks/useTaskWebSocket';
import './index.less';

const { Title, Text, Paragraph } = Typography;

interface LogEntry extends TaskLogMessage {
  id: string;
  level?: 'info' | 'warning' | 'error' | 'success';
}

const TaskMonitor: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskStatusMessage | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // 解析日志级别
  const parseLogLevel = (content: string): 'info' | 'warning' | 'error' | 'success' => {
    const upperContent = content.toUpperCase();
    if (upperContent.includes('[ERROR]') || upperContent.includes('ERROR:')) {
      return 'error';
    }
    if (upperContent.includes('[WARNING]') || upperContent.includes('WARNING:')) {
      return 'warning';
    }
    if (upperContent.includes('[INFO]') || upperContent.includes('INFO:')) {
      return 'info';
    }
    if (upperContent.includes('✅') || upperContent.includes('SUCCESS')) {
      return 'success';
    }
    return 'info';
  };

  // 添加日志
  const addLog = (message: TaskLogMessage) => {
    const logLevel = parseLogLevel(message.content);
    const logEntry: LogEntry = {
      ...message,
      id: `${Date.now()}-${Math.random()}`,
      level: logLevel, // 添加解析后的级别
    };
    
    setLogs((prev) => [...prev, logEntry]);
  };

  // WebSocket 连接
  const { isConnected, subscribeTask, unsubscribeTask } = useTaskWebSocket({
    autoConnect: true,
    onLog: (message) => {
      console.log('收到日志:', message);
      if (message.taskId === taskId) {
        addLog(message);
      }
    },
    onStatus: (message) => {
      console.log('收到状态更新:', message);
      if (message.taskId === taskId) {
        setTaskStatus(message);
      }
    },
    onConnect: () => {
      console.log('WebSocket 已连接');
      // 订阅逻辑由 useEffect 处理，避免重复
    },
  });

  // 订阅任务
  useEffect(() => {
    if (isConnected && taskId) {
      subscribeTask(taskId);
    }

    return () => {
      if (taskId) {
        unsubscribeTask(taskId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, taskId]); // 只依赖状态，不依赖函数

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 获取状态图标和颜色
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'running':
        return {
          icon: <SyncOutlined spin />,
          color: 'processing',
          text: '运行中',
        };
      case 'completed':
        return {
          icon: <CheckCircleOutlined />,
          color: 'success',
          text: '已完成',
        };
      case 'failed':
        return {
          icon: <CloseCircleOutlined />,
          color: 'error',
          text: '失败',
        };
      case 'pending':
        return {
          icon: <ClockCircleOutlined />,
          color: 'default',
          text: '等待中',
        };
      default:
        return {
          icon: <ClockCircleOutlined />,
          color: 'default',
          text: '未知',
        };
    }
  };

  const statusConfig = getStatusConfig(taskStatus?.status);

  // 清空日志
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="task-monitor">
      <div className="task-monitor-header">
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/tasks')}
          >
            返回任务列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            任务监控: {taskId}
          </Title>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* 任务状态卡片 */}
        <Col span={24}>
          <Card 
            title="任务状态" 
            extra={
              <Space>
                <Tag color={isConnected ? 'success' : 'error'}>
                  {isConnected ? 'WebSocket 已连接' : 'WebSocket 未连接'}
                </Tag>
                <Button 
                  size="small" 
                  icon={<ReloadOutlined />}
                  onClick={() => window.location.reload()}
                >
                  刷新页面
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Row gutter={16}>
                <Col span={8}>
                  <Space>
                    <Text strong>任务状态:</Text>
                    <Tag 
                      icon={statusConfig.icon} 
                      color={statusConfig.color}
                    >
                      {statusConfig.text}
                    </Tag>
                  </Space>
                </Col>
                {taskStatus?.message && (
                  <Col span={16}>
                    <Space>
                      <Text strong>消息:</Text>
                      <Text>{taskStatus.message}</Text>
                    </Space>
                  </Col>
                )}
              </Row>
              
              {taskStatus?.progress !== undefined && (
                <div>
                  <Text strong>进度:</Text>
                  <Progress 
                    percent={taskStatus.progress} 
                    status={taskStatus.status === 'failed' ? 'exception' : 'active'}
                  />
                </div>
              )}

              {taskStatus?.timestamp && (
                <Text type="secondary">
                  最后更新: {new Date(taskStatus.timestamp).toLocaleString()}
                </Text>
              )}
            </Space>
          </Card>
        </Col>

        {/* 日志查看器 */}
        <Col span={24}>
          <Card 
            title={`实时日志 (${logs.length} 条)`}
            extra={
              <Space>
                <Button 
                  size="small"
                  type={autoScroll ? 'primary' : 'default'}
                  onClick={() => setAutoScroll(!autoScroll)}
                >
                  {autoScroll ? '自动滚动: 开' : '自动滚动: 关'}
                </Button>
                <Button 
                  size="small" 
                  danger
                  onClick={clearLogs}
                >
                  清空日志
                </Button>
              </Space>
            }
          >
            {!isConnected && (
              <Alert
                message="WebSocket 未连接"
                description="正在尝试连接到服务器，日志推送可能会延迟..."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            <div 
              ref={logContainerRef}
              className="log-container"
            >
              {logs.length === 0 ? (
                <div className="log-empty">
                  <Text type="secondary">暂无日志输出</Text>
                </div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`log-entry log-${log.type} log-level-${log.level || 'info'}`}
                  >
                    <span className="log-timestamp">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`log-type log-type-${log.type}`}>
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className={`log-level log-level-badge-${log.level || 'info'}`}>
                      [{(log.level || 'info').toUpperCase()}]
                    </span>
                    <span className="log-content">
                      {log.content}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TaskMonitor;

