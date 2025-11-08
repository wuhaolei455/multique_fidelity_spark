/**
 * 结果分析标签页
 */

import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Empty, Row, Col, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { getParameterImportance, getTaskResults } from '@/services/api/taskApi';
import ParameterImportanceChart from '@/components/charts/ParameterImportanceChart';
import type { TaskResult, ParameterImportance } from '@/types';

interface ResultsTabProps {
  task: TaskResult | null;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ task }) => {
  const [parameterImportance, setParameterImportance] = useState<ParameterImportance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!task?.taskId) return;

    const fetchParameterImportance = async () => {
      setLoading(true);
      try {
        const data = await getParameterImportance(task.taskId);
        setParameterImportance(data.parameters || []);
      } catch (error) {
        console.error('获取参数重要性失败:', error);
        setParameterImportance([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParameterImportance();
  }, [task?.taskId]);

  const handleDownloadResults = async () => {
    if (!task?.taskId) return;
    try {
      const data = await getTaskResults(task.taskId, 'json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-${task.taskId}-results.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载结果失败:', error);
    }
  };

  if (!task) return null;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="最佳配置"
            bordered={false}
            extra={
              <Button icon={<DownloadOutlined />} onClick={handleDownloadResults}>
                下载结果
              </Button>
            }
          >
            {task.bestConfig?.config && typeof task.bestConfig.config === 'object' ? (
              <Descriptions column={2} bordered>
                <Descriptions.Item label="最佳性能" span={2}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                    {task.bestConfig.bestObjective?.toFixed(2) || 'N/A'}
                  </span>
                </Descriptions.Item>
                {Object.entries(task.bestConfig.config).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            ) : (
              <Empty description="暂无最佳配置" />
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="参数重要性分析" bordered={false} loading={loading}>
            {parameterImportance.length > 0 ? (
              <ParameterImportanceChart data={parameterImportance} height={400} />
            ) : (
              <Empty description="暂无参数重要性数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ResultsTab;

