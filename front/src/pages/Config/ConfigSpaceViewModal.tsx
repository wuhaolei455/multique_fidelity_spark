/**
 * 配置空间查看/编辑模态框
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Descriptions,
  Table,
  Button,
  Space,
  Tag,
  message,
  Tabs,
} from 'antd';
import { EditOutlined, CopyOutlined } from '@ant-design/icons';
import type { ConfigSpace, Parameter } from '@/types';
import type { ColumnsType } from 'antd/es/table';

interface ConfigSpaceViewModalProps {
  visible: boolean;
  configSpace: ConfigSpace | null;
  onCancel: () => void;
  onEdit?: (configSpace: ConfigSpace) => void;
}

const ConfigSpaceViewModal: React.FC<ConfigSpaceViewModalProps> = ({
  visible,
  configSpace,
  onCancel,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (visible) {
      setActiveTab('info');
    }
  }, [visible]);

  if (!configSpace) return null;

  const handleCopyJson = () => {
    const jsonData = {
      name: configSpace.name,
      description: configSpace.description,
      parameters: configSpace.parameters.reduce((acc, param) => {
        acc[param.name] = {
          type: param.type,
          range: param.range,
          default: param.default,
        };
        return acc;
      }, {} as Record<string, any>),
    };

    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    message.success('配置空间 JSON 已复制到剪贴板');
  };

  const columns: ColumnsType<Parameter> = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text) => <code>{text}</code>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          int: 'blue',
          float: 'green',
          categorical: 'orange',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: '范围',
      key: 'range',
      width: 150,
      render: (_, record) => {
        if (record.range) {
          return `[${record.range[0]}, ${record.range[1]}]`;
        }
        return '-';
      },
    },
    {
      title: '默认值',
      dataIndex: 'default',
      key: 'default',
      width: 120,
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  return (
    <Modal
      title={`配置空间详情 - ${configSpace.name}`}
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyJson}>
          复制 JSON
        </Button>,
        onEdit && (
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(configSpace)}
          >
            编辑
          </Button>
        ),
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'info',
            label: '基本信息',
            children: (
              <Descriptions bordered column={2}>
                <Descriptions.Item label="配置空间名称" span={2}>
                  {configSpace.name}
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>
                  {configSpace.description || '无'}
                </Descriptions.Item>
                <Descriptions.Item label="参数数量">
                  {configSpace.parameters.length}
                </Descriptions.Item>
                <Descriptions.Item label="配置空间 ID">
                  <code>{configSpace.id}</code>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>
                  {new Date(configSpace.createdAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间" span={2}>
                  {new Date(configSpace.updatedAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'parameters',
            label: `参数列表 (${configSpace.parameters.length})`,
            children: (
              <Table
                columns={columns}
                dataSource={configSpace.parameters}
                rowKey="name"
                pagination={false}
                scroll={{ y: 400 }}
                size="small"
              />
            ),
          },
          {
            key: 'json',
            label: 'JSON 格式',
            children: (
              <div>
                <Space style={{ marginBottom: 16 }}>
                  <Button icon={<CopyOutlined />} onClick={handleCopyJson}>
                    复制
                  </Button>
                </Space>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: '16px',
                    borderRadius: '4px',
                    maxHeight: '500px',
                    overflow: 'auto',
                    fontSize: '12px',
                  }}
                >
                  {JSON.stringify(
                    {
                      name: configSpace.name,
                      description: configSpace.description,
                      parameters: configSpace.parameters.map((param) => ({
                        name: param.name,
                        type: param.type,
                        range: param.range,
                        default: param.default,
                        description: param.description,
                      })),
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default ConfigSpaceViewModal;

