/**
 * 日志标签页
 */

import React, { useState } from 'react';
import { Card, Button, Space, Empty } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import './LogsTab.less';

interface LogsTabProps {
  taskId: string | undefined;
}

const LogsTab: React.FC<LogsTabProps> = ({ taskId }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    // TODO: 实现从API获取日志并下载
    console.log('Download logs for task:', taskId);
  };

  const handleRefresh = () => {
    // TODO: 实现从API刷新日志
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="logs-tab">
      <Card
        title="任务日志"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownload}
            >
              下载
            </Button>
          </Space>
        }
        bordered={false}
      >
        <Empty 
          description="实时日志功能待开发，请通过API接口获取日志"
          style={{ padding: '60px 0' }}
        />
      </Card>
    </div>
  );
};

export default LogsTab;

