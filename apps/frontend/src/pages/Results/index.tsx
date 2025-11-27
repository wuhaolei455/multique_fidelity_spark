/**
 * 结果分析页面
 */

import React, { useEffect, useState } from 'react';
import { Card, Select, Row, Col, Statistic, Spin, Empty, Tabs, message } from 'antd';
import { LineChartOutlined, BarChartOutlined, DotChartOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { fetchTasks } from '@/store/slices/taskSlice';
import { getTaskTrend, getParameterImportance, getTaskDetail } from '@/services/api/taskApi';
import PerformanceChart from '@/components/charts/PerformanceChart';
import ParameterImportanceChart from '@/components/charts/ParameterImportanceChart';
import ObjectiveDistributionChart from '@/components/charts/ObjectiveDistributionChart';
import ParameterScatterChart from '@/components/charts/ParameterScatterChart';
import ParameterBoxChart from '@/components/charts/ParameterBoxChart';
import type { ParameterImportance } from '@/types';
import './index.less';

interface TrendData {
  iterations: number[];
  objectives: number[];
  bestObjectives: number[];
}

const Results: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, loading: tasksLoading } = useAppSelector((state) => state.task);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 数据状态
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [parameterImportance, setParameterImportance] = useState<ParameterImportance[]>([]);
  const [taskDetail, setTaskDetail] = useState<any>(null);

  // 对任务列表进行去重，确保 ID 唯一
  const uniqueTasks = React.useMemo(() => {
    const taskMap = new Map<string, typeof tasks[0]>();
    tasks.forEach(task => {
      if (!taskMap.has(task.id)) {
        taskMap.set(task.id, task);
      }
    });
    return Array.from(taskMap.values());
  }, [tasks]);

  // 获取当前选中的任务（从任务列表中）
  const selectedTask = uniqueTasks.find(task => task.id === selectedTaskId);

  // 调试：输出选中任务的数据
  useEffect(() => {
    console.log('tasks: ', tasks)
    if (selectedTask) {
      console.log('选中的任务数据:', selectedTask);
      console.log('任务统计信息:', {
        numObjectives: selectedTask.numObjectives,
        numConstraints: selectedTask.numConstraints,
        averageObjective: selectedTask.averageObjective,
        observationCount: selectedTask.observationCount,
      });
    }
  }, [selectedTask, tasks]);

  // 加载任务列表
  useEffect(() => {
    dispatch(fetchTasks({ page: 1, pageSize: 100 }));
  }, [dispatch]);

  // 当任务列表加载完成后，自动选择第一个任务
  useEffect(() => {
    if (uniqueTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(uniqueTasks[0].id);
    }
  }, [uniqueTasks, selectedTaskId]);

  // 加载选中任务的数据
  useEffect(() => {
    if (!selectedTaskId) return;

    const loadTaskData = async () => {
      setLoading(true);
      try {
        // 并行加载所有数据
        const [trendRes, importanceRes, detailRes] = await Promise.all([
          getTaskTrend(selectedTaskId).catch(() => null),
          getParameterImportance(selectedTaskId).catch(() => ({ parameters: [] })),
          getTaskDetail(selectedTaskId).catch(() => null),
        ]);

        // 处理趋势数据
        console.log('趋势数据响应:', trendRes);
        // 后端返回的结构包含 data 字段，所以这里访问 trendRes.data 是正确的
        if (trendRes && Array.isArray(trendRes.data) && trendRes.data.length > 0) {
          // 后端返回的是 TrendResponseDto 格式，需要转换
          const iterations = trendRes.data.map((item: any) => item.iteration);
          const objectives = trendRes.data.map((item: any) => item.objective);
          const bestObjectives = trendRes.data.map((item: any) => item.bestObjective);
          
          console.log('转换后的趋势数据:', { iterations, objectives, bestObjectives });
          
          setTrendData({
            iterations,
            objectives,
            bestObjectives,
          });
        } else {
          console.warn('趋势数据为空或格式不正确:', trendRes);
          setTrendData(null);
        }

        // 设置参数重要性
        setParameterImportance(importanceRes.parameters || []);

        // 设置任务详情
        setTaskDetail(detailRes);
      } catch (error) {
        console.error('加载任务数据失败:', error);
        message.error('加载任务数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadTaskData();
  }, [selectedTaskId]);

  // 准备散点图数据（选择最重要的参数）
  const getScatterData = () => {
    if (!parameterImportance.length || !taskDetail?.observations) {
      return null;
    }

    const topParameter = parameterImportance[0];
    const observations = taskDetail.observations;

    const values = observations
      .map((obs: any) => {
        const paramValue = obs.config[topParameter.parameter];
        const objective = obs.objectives[0];
        if (paramValue !== undefined && objective !== undefined) {
          return { x: parseFloat(paramValue), y: objective };
        }
        return null;
      })
      .filter((v: any) => v !== null);

    return {
      parameterName: topParameter.parameter,
      values,
    };
  };

  // 准备箱线图数据
  const getBoxData = () => {
    if (!parameterImportance.length || !taskDetail?.observations) {
      return [];
    }

    const observations = taskDetail.observations;
    const topParameters = parameterImportance.slice(0, 8); // 取前8个重要参数

    return topParameters.map((param) => {
      const values = observations
        .map((obs: any) => {
          const value = obs.config[param.parameter];
          return value !== undefined ? parseFloat(value) : null;
        })
        .filter((v: number | null) => v !== null);

      return {
        name: param.parameter.split('.').pop() || param.parameter,
        values,
      };
    });
  };

  const scatterData = getScatterData();
  const boxData = getBoxData();

  return (
    <div className="results-page">
      <Card>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16 }}>结果分析</h2>
          <Select
            style={{ width: '100%', maxWidth: 600 }}
            placeholder="选择要分析的任务"
            value={selectedTaskId}
            onChange={setSelectedTaskId}
            loading={tasksLoading}
            showSearch
            filterOption={(input, option) => {
              const children = option?.children;
              if (!children) return false;
              const childrenStr = String(children);
              return childrenStr.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {uniqueTasks.map((task) => {
              const observationCount = task.observationCount || task.progress?.numEvaluated || 0;
              const bestObjective = (task.best_objective || task.progress?.bestObjective || 0).toFixed(2);
              const averageObjective = task.averageObjective ? task.averageObjective.toFixed(2) : null;
              const numObjectives = task.numObjectives;
              
              let label = `${task.name} | 观察: ${observationCount} | 最佳: ${bestObjective}`;
              if (averageObjective) {
                label += ` | 平均: ${averageObjective}`;
              }
              if (numObjectives) {
                label += ` | 目标数: ${numObjectives}`;
              }
              
              return (
                <Select.Option key={task.id} value={task.id}>
                  {label}
                </Select.Option>
              );
            })}
          </Select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="加载数据中..." />
          </div>
        ) : !selectedTaskId ? (
          <Empty description="请选择一个任务进行分析" />
        ) : (
          <>
            {/* 统计信息 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="观察次数"
                    value={
                      taskDetail?.observationCount ||
                      selectedTask?.observationCount || 
                      selectedTask?.progress?.numEvaluated || 
                      0
                    }
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="最佳目标值"
                    value={
                      taskDetail?.bestObjective ||
                      selectedTask?.best_objective || 
                      selectedTask?.progress?.bestObjective ||
                      0
                    }
                    precision={4}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="平均目标值"
                    value={
                      taskDetail?.averageObjective ||
                      selectedTask?.averageObjective ||
                      (trendData && trendData.objectives.length > 0
                        ? trendData.objectives.reduce((a, b) => a + b, 0) /
                          trendData.objectives.length
                        : 0)
                    }
                    precision={4}
                    prefix={<DotChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="参数数量"
                    value={parameterImportance.length || 0}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* 额外统计信息 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="目标数量"
                    value={taskDetail?.numObjectives || selectedTask?.numObjectives || 0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="约束数量"
                    value={taskDetail?.numConstraints || selectedTask?.numConstraints || 0}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="配置空间"
                    value={selectedTask?.config?.config_space || 'unknown'}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="优化方法"
                    value={selectedTask?.method || '-'}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 图表展示 */}
            <Tabs
              defaultActiveKey="performance"
              items={[
                {
                  key: 'performance',
                  label: '性能趋势',
                  children: (
                    <Card bordered={false}>
                      {trendData && trendData.iterations?.length > 0 ? (
                        <>
                          <div style={{ marginBottom: 16, color: '#666', fontSize: 12 }}>
                            数据点数量: {trendData.iterations.length}
                          </div>
                          <PerformanceChart data={trendData} showBest height={500} />
                        </>
                      ) : (
                        <Empty 
                          description={
                            <div>
                              <div>暂无性能趋势数据</div>
                              {selectedTaskId && (
                                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                                  任务ID: {selectedTaskId}
                                </div>
                              )}
                            </div>
                          } 
                        />
                      )}
                    </Card>
                  ),
                },
                {
                  key: 'importance',
                  label: '参数重要性',
                  children: (
                    <Card bordered={false}>
                      {parameterImportance.length > 0 ? (
                        <ParameterImportanceChart
                          data={parameterImportance}
                          height={500}
                        />
                      ) : (
                        <Empty description="暂无参数重要性数据" />
                      )}
                    </Card>
                  ),
                },
                {
                  key: 'distribution',
                  label: '目标值分布',
                  children: (
                    <Card bordered={false}>
                      {trendData ? (
                        <ObjectiveDistributionChart
                          data={trendData.objectives}
                          height={500}
                        />
                      ) : (
                        <Empty description="暂无目标值分布数据" />
                      )}
                    </Card>
                  ),
                },
                {
                  key: 'scatter',
                  label: '参数关联分析',
                  children: (
                    <Card bordered={false}>
                      {scatterData ? (
                        <ParameterScatterChart data={scatterData} height={500} />
                      ) : (
                        <Empty description="暂无参数关联数据" />
                      )}
                    </Card>
                  ),
                },
                {
                  key: 'box',
                  label: '参数分布',
                  children: (
                    <Card bordered={false}>
                      {boxData.length > 0 ? (
                        <ParameterBoxChart data={boxData} height={500} />
                      ) : (
                        <Empty description="暂无参数分布数据" />
                      )}
                    </Card>
                  ),
                },
              ]}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default Results;

