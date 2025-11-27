/**
 * 配置管理页面
 */

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, message } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { fetchConfigSpaces } from '@/store/slices/configSlice';
import { formatDateTime } from '@/utils/format';
import ConfigSpaceUpload from './ConfigSpaceUpload';
import ConfigSpaceCreateModal from './ConfigSpaceCreateModal';
import ConfigSpaceViewModal from './ConfigSpaceViewModal';
import ConfigSpaceEditModal from './ConfigSpaceEditModal';
import type { ConfigSpace } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const Config: React.FC = () => {
  const dispatch = useAppDispatch();
  const { configSpaces, loading } = useAppSelector((state) => state.config);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedConfigSpace, setSelectedConfigSpace] = useState<ConfigSpace | null>(null);

  useEffect(() => {
    dispatch(fetchConfigSpaces());
  }, [dispatch]);

  const handleUploadSuccess = () => {
    dispatch(fetchConfigSpaces());
  };

  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    dispatch(fetchConfigSpaces());
  };

  const handleView = (configSpace: ConfigSpace) => {
    setSelectedConfigSpace(configSpace);
    setViewModalVisible(true);
  };

  const handleEdit = (configSpace: ConfigSpace) => {
    setSelectedConfigSpace(configSpace);
    setViewModalVisible(false);
    setEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setSelectedConfigSpace(null);
    dispatch(fetchConfigSpaces());
    message.success('配置空间已更新');
  };

  // 确保 configSpaces 是数组
  const spaces = Array.isArray(configSpaces) ? configSpaces : [];

  const columns: ColumnsType<ConfigSpace> = [
    {
      title: '配置空间名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button type="link" onClick={() => handleView(record)} style={{ padding: 0 }}>
          {text}
        </Button>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '参数数量',
      key: 'parameters',
      width: 120,
      align: 'center',
      render: (_, record) => record.parameters.length,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => formatDateTime(text),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="配置空间管理"
        extra={
          <Space>
            <ConfigSpaceUpload onSuccess={handleUploadSuccess} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建配置空间
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={spaces}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <ConfigSpaceCreateModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      <ConfigSpaceViewModal
        visible={viewModalVisible}
        configSpace={selectedConfigSpace}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedConfigSpace(null);
        }}
        onEdit={handleEdit}
      />

      <ConfigSpaceEditModal
        visible={editModalVisible}
        configSpace={selectedConfigSpace}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedConfigSpace(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default Config;

