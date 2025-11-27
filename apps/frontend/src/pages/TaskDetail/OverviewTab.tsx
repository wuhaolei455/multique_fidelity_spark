/**
 * 任务概览标签页
 */

import React from 'react';
import { Card, Descriptions, Row, Col, Progress, Tag } from 'antd';
import { formatDateTime } from '@/utils/format';
import { METHOD_TEXT } from '@/utils/constants';
import type { TaskResult, OptimizationMethod } from '@/types';

interface OverviewTabProps {
  task: TaskResult | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ task }) => {
  if (!task) return null;

  // 从 TaskResult 推断优化方法
  const inferOptimizationMethod = (taskResult: TaskResult): OptimizationMethod => {
    const taskId = taskResult.taskId.toLowerCase();
    if (taskId.includes('bohb_gp')) return 'BOHB_GP';
    if (taskId.includes('bohb_smac') || taskId.includes('bohb')) return 'BOHB_SMAC';
    if (taskId.includes('mfes_gp')) return 'MFES_GP';
    if (taskId.includes('mfes_smac') || taskId.includes('mfes')) return 'MFES_SMAC';
    if (taskId.includes('smac')) return 'SMAC';
    if (taskId.includes('gp')) return 'GP';
    return 'SMAC'; // 默认值
  };

  const method = inferOptimizationMethod(task);

  // 计算创建时间和更新时间
  const createdAt = task.observations && task.observations.length > 0
    ? task.observations[0].create_time
    : task.global_start_time;
  
  const updatedAt = task.observations && task.observations.length > 0
    ? task.observations[task.observations.length - 1].create_time
    : task.global_start_time;

  // 安全获取进度信息（从 TaskResult 计算）
  const progress = {
    currentIter: task.observationCount,
    totalIter: task.observationCount,
    bestObjective: task.bestConfig?.bestObjective || 0,
    numEvaluated: task.observationCount,
  };

  const config = {
    config_space: task.meta_info?.space?.original?.hyperparameters?.length || 0,
    iter_num: task.observationCount,
    init_num: task.meta_info?.random?.seed || 42,
    warm_start_strategy: task.meta_info?.warm_start ? 'best_all' : 'none',
    transfer_learning_strategy: task.meta_info?.tl_ws ? 'reacqk' : 'none',
    compression_strategy: task.meta_info?.compressor?.strategy || 'none',
  };

  const progressPercent = 100; // 已完成的任务

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 基本信息 */}
        <Col xs={24} lg={12}>
          <Card title="基本信息" bordered={false}>
            <Descriptions column={1}>
              <Descriptions.Item label="任务ID">{task.taskId}</Descriptions.Item>
              <Descriptions.Item label="任务名称">{task.taskId}</Descriptions.Item>
              <Descriptions.Item label="优化方法">
                {METHOD_TEXT[method as keyof typeof METHOD_TEXT]}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatDateTime(updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 进度信息 */}
        <Col xs={24} lg={12}>
          <Card title="进度信息" bordered={false}>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span>迭代进度</span>
                <span>
                  {progress.currentIter}/{progress.totalIter}
                </span>
              </div>
              <Progress percent={progressPercent} />
            </div>
            <Descriptions column={1}>
              <Descriptions.Item label="当前迭代">
                {progress.currentIter}
              </Descriptions.Item>
              <Descriptions.Item label="总迭代次数">
                {progress.totalIter}
              </Descriptions.Item>
              <Descriptions.Item label="已评估配置数">
                {progress.numEvaluated}
              </Descriptions.Item>
              <Descriptions.Item label="最佳性能">
                {progress.bestObjective.toFixed(2)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 配置信息 */}
        <Col xs={24} lg={12}>
          <Card title="配置信息" bordered={false}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="配置空间维度">
                {config.config_space} 个参数
              </Descriptions.Item>
              <Descriptions.Item label="总迭代次数">
                {config.iter_num}
              </Descriptions.Item>
              <Descriptions.Item label="随机种子">
                {task.meta_info?.random?.seed || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="随机采样概率">
                {task.meta_info?.random?.rand_prob 
                  ? (task.meta_info.random.rand_prob * 100).toFixed(1) + '%' 
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="随机模式">
                {task.meta_info?.random?.rand_mode || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 策略配置 */}
        <Col xs={24} lg={12}>
          <Card title="优化策略" bordered={false}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Warm Start策略">
                <Tag color={config.warm_start_strategy !== 'none' ? 'green' : 'default'}>
                  {config.warm_start_strategy}
                </Tag>
                {task.meta_info?.warm_start && (
                  <span style={{ marginLeft: 8, color: '#999' }}>
                    ({task.meta_info.warm_start.length} 个历史任务)
                  </span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Transfer Learning策略">
                <Tag color={config.transfer_learning_strategy !== 'none' ? 'blue' : 'default'}>
                  {config.transfer_learning_strategy}
                </Tag>
                {task.meta_info?.tl_ws && (
                  <span style={{ marginLeft: 8, color: '#999' }}>
                    ({task.meta_info.tl_ws.length} 个工作集)
                  </span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="压缩策略">
                <Tag color={config.compression_strategy !== 'none' ? 'orange' : 'default'}>
                  {config.compression_strategy}
                </Tag>
              </Descriptions.Item>
              {task.meta_info?.compressor && (
                <>
                  <Descriptions.Item label="原始参数数">
                    {task.meta_info.compressor.original_params?.length || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="压缩后参数数">
                    {task.meta_info.compressor.compressed_params?.length || 0}
                  </Descriptions.Item>
                  {task.meta_info.compressor.original_params && 
                   task.meta_info.compressor.compressed_params && (
                    <Descriptions.Item label="压缩率">
                      <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        {((1 - task.meta_info.compressor.compressed_params.length / 
                            task.meta_info.compressor.original_params.length) * 100).toFixed(1)}%
                      </span>
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* 性能统计 */}
          <Col xs={24}>
            <Card title="性能统计" bordered={false}>
              <Descriptions column={3} bordered>
                <Descriptions.Item label="观察记录总数">
                  {task.observationCount || 0}
                </Descriptions.Item>
                <Descriptions.Item label="最佳目标值">
                  <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '16px' }}>
                    {task.bestConfig?.bestObjective?.toFixed(4) || 'N/A'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="平均目标值">
                  <span style={{ fontWeight: 'bold' }}>
                    {task.averageObjective?.toFixed(4) || 'N/A'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="总执行时间">
                  {task.observations && task.observations.length > 0 
                    ? (task.observations.reduce((sum, obs) => sum + obs.elapsed_time, 0)).toFixed(2) + ' 秒'
                    : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="平均执行时间">
                  {task.observations && task.observations.length > 0 
                    ? (task.observations.reduce((sum, obs) => sum + obs.elapsed_time, 0) / task.observations.length).toFixed(2) + ' 秒'
                    : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="成功率">
                  {task.observations && task.observations.length > 0 
                    ? (
                      <span style={{ 
                        color: task.observations.filter(obs => obs.trial_state === 0).length / task.observations.length > 0.9 
                          ? '#52c41a' 
                          : '#faad14',
                        fontWeight: 'bold'
                      }}>
                        {((task.observations.filter(obs => obs.trial_state === 0).length / task.observations.length) * 100).toFixed(1)}%
                      </span>
                    )
                    : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="目标数量">
                  {task.num_objectives || 0}
                </Descriptions.Item>
                <Descriptions.Item label="约束数量">
                  {task.num_constraints || 0}
                </Descriptions.Item>
                <Descriptions.Item label="配置参数数量">
                  {task.meta_info?.space?.original?.hyperparameters?.length || 0}
                </Descriptions.Item>
                {task.ref_point && (
                  <Descriptions.Item label="参考点" span={3}>
                    [{task.ref_point.join(', ')}]
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>

        {/* 元特征信息 */}
        {task.meta_info?.meta_feature && task.meta_info.meta_feature.length > 0 && (
          <Col xs={24}>
            <Card title="元特征向量" bordered={false}>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '8px'
                }}>
                  {task.meta_info.meta_feature.map((value, index) => (
                    <div 
                      key={index}
                      style={{
                        background: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ color: '#999' }}>F{index + 1}</div>
                      <div style={{ fontWeight: 'bold' }}>{value.toFixed(4)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 8, color: '#999', fontSize: '12px' }}>
                共 {task.meta_info.meta_feature.length} 维元特征
              </div>
            </Card>
          </Col>
        )}

        {/* 最佳配置详情 */}
        <Col xs={24}>
          <Card title="最佳配置" bordered={false}>
            {task.bestConfig?.config && Object.keys(task.bestConfig.config).length > 0 ? (
              <>
                <div style={{ marginBottom: 16, padding: '12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                  <span style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '16px' }}>
                    最佳性能: {task.bestConfig.bestObjective?.toFixed(4) || 'N/A'}
                  </span>
                </div>
                <Descriptions column={3} bordered size="small">
                  {Object.entries(task.bestConfig.config)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => (
                      <Descriptions.Item label={key} key={key}>
                        <span style={{ fontWeight: 500 }}>
                          {typeof value === 'number' ? value.toFixed(4) : String(value)}
                        </span>
                      </Descriptions.Item>
                    ))}
                </Descriptions>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无最佳配置信息
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewTab;

