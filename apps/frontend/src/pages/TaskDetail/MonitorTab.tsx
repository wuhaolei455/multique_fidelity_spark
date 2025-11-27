/**
 * 任务监控标签页
 */

import React, { useEffect, useState } from 'react';
import { Card, Empty, Spin, Row, Col, Statistic } from 'antd';
import { getTaskTrend } from '@/services/api/taskApi';
import PerformanceChart from '@/components/charts/PerformanceChart';
import type { TaskResult } from '@/types';

interface MonitorTabProps {
  task: TaskResult | null;
}

const MonitorTab: React.FC<MonitorTabProps> = ({ task }) => {
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<{
    iterations: number[];
    objectives: number[];
    bestObjectives: number[];
  } | null>(null);

  useEffect(() => {
    if (!task?.taskId) return;

    const fetchTrendData = async () => {
      setLoading(true);
      try {
        const data = await getTaskTrend(task.taskId);
        // 后端返回的是 TrendResponseDto 格式，需要转换
        if (data && data.data && Array.isArray(data.data)) {
          const iterations = data.data.map((item) => item.iteration);
          const objectives = data.data.map((item) => item.objective);
          const bestObjectives = data.data.map((item) => item.bestObjective);
          
          setTrendData({
            iterations,
            objectives,
            bestObjectives,
          });
        }
      } catch (error) {
        console.error('获取趋势数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [task?.taskId]);

  if (!task) return null;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="当前迭代"
              value={task.observationCount}
              suffix={`/ ${task.observationCount}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="最佳性能"
              value={task.bestConfig.bestObjective}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="已评估配置数"
              value={task.observationCount}
            />
          </Card>
        </Col>
      </Row>

      <Card title="性能曲线" bordered={false}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : trendData && trendData.iterations.length > 0 ? (
          <PerformanceChart data={trendData} showBest={true} height={400} />
        ) : (
          <Empty description="暂无数据" />
        )}
      </Card>
    </div>
  );
};

export default MonitorTab;

