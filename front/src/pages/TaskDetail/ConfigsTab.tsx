/**
 * 配置历史标签页
 */

import React from 'react';
import { Card, Table, Descriptions, Tag } from 'antd';
import { CrownOutlined } from '@ant-design/icons';
import { formatDateTime } from '@/utils/format';
import type { TaskResult, Observation } from '@/types';
import type { ColumnsType } from 'antd/es/table';

interface ConfigsTabProps {
  task: TaskResult | null;
}

const ConfigsTab: React.FC<ConfigsTabProps> = ({ task }) => {
  if (!task) return null;

  // 找出最佳配置的性能值，用于标识
  const bestObjective = task.bestConfig?.bestObjective;

  const columns: ColumnsType<Observation> = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_: unknown, record: Observation, index: number) => {
        // 判断是否为最佳配置
        const isBest = record.objectives?.[0] === bestObjective;
        return (
          <span>
            {index + 1}
            {isBest && (
              <CrownOutlined 
                style={{ 
                  marginLeft: 8, 
                  color: '#faad14',
                  fontSize: '16px'
                }} 
                title="最佳配置"
              />
            )}
          </span>
        );
      },
    },
    {
      title: '性能指标',
      dataIndex: 'objectives',
      key: 'objectives',
      width: 120,
      sorter: (a, b) => {
        const aVal = a.objectives && a.objectives.length > 0 ? a.objectives[0] : 0;
        const bVal = b.objectives && b.objectives.length > 0 ? b.objectives[0] : 0;
        return aVal - bVal;
      },
      render: (values: number[], record: Observation) => {
        // objectives 是数组，显示第一个目标值
        const value = values && values.length > 0 ? values[0] : null;
        if (value === null) return 'N/A';
        
        // 判断是否为最佳配置
        const isBest = value === bestObjective;
        
        // 根据值的大小设置颜色（假设目标是最小化）
        let color = value < 100 ? '#52c41a' : value < 200 ? '#faad14' : '#ff4d4f';
        
        // 最佳配置用特殊样式
        if (isBest) {
          return (
            <span 
              style={{ 
                color: '#52c41a', 
                fontWeight: 'bold',
                fontSize: '16px',
                background: '#f6ffed',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #b7eb8f'
              }}
            >
              {value.toFixed(2)} ★
            </span>
          );
        }
        
        return <span style={{ color, fontWeight: 'bold' }}>{value.toFixed(2)}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'trial_state',
      key: 'trial_state',
      width: 100,
      filters: [
        { text: '成功', value: 0 },
        { text: '失败', value: 1 },
        { text: '超时', value: 2 },
        { text: '其他', value: 3 },
      ],
      onFilter: (value, record) => record.trial_state === value,
      render: (state: number) => {
        const stateConfig: Record<number, { text: string; color: string }> = {
          0: { text: '成功', color: 'success' },
          1: { text: '失败', color: 'error' },
          2: { text: '超时', color: 'warning' },
          3: { text: '其他', color: 'default' },
        };
        const config = stateConfig[state] || { text: '未知', color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '耗时（秒）',
      dataIndex: 'elapsed_time',
      key: 'elapsed_time',
      width: 120,
      sorter: (a, b) => a.elapsed_time - b.elapsed_time,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 180,
      sorter: (a, b) => new Date(a.create_time).getTime() - new Date(b.create_time).getTime(),
      render: (text: string) => formatDateTime(text),
    },
    {
      title: '配置来源',
      key: 'origin',
      width: 120,
      filters: [
        { text: 'Random', value: 'Random' },
        { text: 'BO', value: 'BO' },
        { text: 'WarmStart', value: 'WarmStart' },
      ],
      onFilter: (value, record) => record.extra_info?.origin === value,
      render: (_: unknown, record: Observation) => {
        const origin = record.extra_info?.origin || 'N/A';
        const colorMap: Record<string, string> = {
          'Random': 'blue',
          'BO': 'green',
          'WarmStart': 'purple',
        };
        return <Tag color={colorMap[origin] || 'default'}>{origin}</Tag>;
      },
    },
  ];

  // 可展开行：显示配置参数详情
  const expandedRowRender = (record: Observation) => {
    if (!record.config || Object.keys(record.config).length === 0) {
      return <div style={{ padding: '16px', color: '#999' }}>无配置信息</div>;
    }

    // 将配置参数按名称排序
    const sortedConfig = Object.entries(record.config).sort(([a], [b]) => a.localeCompare(b));
    
    return (
      <div style={{ padding: '16px', background: '#fafafa' }}>
        {/* 基本信息 */}
        <Descriptions
          title="基本信息"
          bordered
          column={4}
          size="small"
          style={{ marginBottom: 16 }}
          labelStyle={{ fontWeight: 'bold', background: '#e6f7ff' }}
        >
          <Descriptions.Item label="性能指标">
            <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
              {record.objectives?.[0]?.toFixed(4) || 'N/A'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="执行时间">
            {record.elapsed_time.toFixed(2)} 秒
          </Descriptions.Item>
          <Descriptions.Item label="配置来源">
            <Tag color={
              record.extra_info?.origin === 'Random' ? 'blue' :
              record.extra_info?.origin === 'BO' ? 'green' :
              record.extra_info?.origin === 'WarmStart' ? 'purple' : 'default'
            }>
              {record.extra_info?.origin || 'N/A'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDateTime(record.create_time)}
          </Descriptions.Item>
          {record.constraints && record.constraints.length > 0 && (
            <Descriptions.Item label="约束值" span={4}>
              [{record.constraints.join(', ')}]
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* 配置参数 */}
        <Descriptions
          title="配置参数"
          bordered
          column={3}
          size="small"
          labelStyle={{ fontWeight: 'bold', background: '#f0f0f0' }}
        >
          {sortedConfig.map(([key, value]) => (
            <Descriptions.Item label={key} key={key}>
              {typeof value === 'number' ? value.toFixed(4) : String(value)}
            </Descriptions.Item>
          ))}
        </Descriptions>
        
        {/* 查询执行时间 */}
        {record.extra_info?.qt_time && Object.keys(record.extra_info.qt_time).length > 0 && (
          <Descriptions
            title="查询执行时间 (SQL)"
            bordered
            column={3}
            size="small"
            style={{ marginTop: 16 }}
            labelStyle={{ fontWeight: 'bold', background: '#f0f0f0' }}
          >
            {Object.entries(record.extra_info.qt_time).map(([query, time]) => (
              <Descriptions.Item label={query} key={query}>
                {(time as number).toFixed(2)} 秒
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}

        {/* 额外时间信息 */}
        {record.extra_info?.et_time && Object.keys(record.extra_info.et_time).length > 0 && (
          <Descriptions
            title="额外时间信息"
            bordered
            column={3}
            size="small"
            style={{ marginTop: 16 }}
            labelStyle={{ fontWeight: 'bold', background: '#f0f0f0' }}
          >
            {Object.entries(record.extra_info.et_time).map(([key, time]) => (
              <Descriptions.Item label={key} key={key}>
                {(time as number).toFixed(2)} 秒
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}

        {/* SQL计划信息 */}
        {record.extra_info?.plan_sqls && record.extra_info.plan_sqls.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>SQL 计划信息</h4>
            <div style={{ 
              background: '#fff', 
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              padding: '12px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {record.extra_info.plan_sqls.map((sql, index) => (
                <div key={index} style={{ 
                  marginBottom: index < record.extra_info!.plan_sqls!.length - 1 ? 8 : 0,
                  paddingBottom: index < record.extra_info!.plan_sqls!.length - 1 ? 8 : 0,
                  borderBottom: index < record.extra_info!.plan_sqls!.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <span style={{ color: '#999', fontSize: '12px' }}>SQL {index + 1}:</span>
                  <pre style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                  }}>
                    {sql}
                  </pre>
                </div>
              ))}
            </div>
            {record.extra_info.plan_timeout && (
              <div style={{ marginTop: 4, color: '#999', fontSize: '12px' }}>
                计划超时时间: {record.extra_info.plan_timeout} 秒
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Card title="配置评估历史" bordered={false}>
        <Table
          columns={columns}
          dataSource={task.observations || []}
          rowKey={(record, index) => `obs-${index}`}
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条配置记录`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default ConfigsTab;

