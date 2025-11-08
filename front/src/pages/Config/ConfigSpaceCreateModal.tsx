/**
 * 配置空间创建模态框
 */

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Card,
  InputNumber,
  Select,
  message,
  Divider,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { createConfigSpace } from '@/services/api/configApi';

const { TextArea } = Input;

interface ParameterFormItem {
  name: string;
  type: 'int' | 'float';
  min: number;
  max: number;
  default: number;
}

interface ConfigSpaceCreateModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const ConfigSpaceCreateModal: React.FC<ConfigSpaceCreateModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [parameters, setParameters] = useState<ParameterFormItem[]>([]);

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        name: '',
        type: 'int',
        min: 0,
        max: 100,
        default: 50,
      },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    const newParameters = parameters.filter((_, i) => i !== index);
    setParameters(newParameters);
  };

  const handleParameterChange = (
    index: number,
    field: keyof ParameterFormItem,
    value: any
  ) => {
    const newParameters = [...parameters];
    newParameters[index] = {
      ...newParameters[index],
      [field]: value,
    };
    setParameters(newParameters);
  };

  const handleSubmit = async () => {
    try {
      // 验证基本信息
      const values = await form.validateFields();

      // 验证参数
      if (parameters.length === 0) {
        message.warning('请至少添加一个参数，或者选择使用默认配置空间');
        return;
      }

      // 验证每个参数
      for (let i = 0; i < parameters.length; i++) {
        const param = parameters[i];
        if (!param.name) {
          message.error(`参数 ${i + 1}: 请填写参数名称`);
          return;
        }
        if (param.min >= param.max) {
          message.error(`参数 ${param.name}: 最小值必须小于最大值`);
          return;
        }
        if (param.default < param.min || param.default > param.max) {
          message.error(`参数 ${param.name}: 默认值必须在最小值和最大值之间`);
          return;
        }
      }

      setSubmitting(true);

      // 构造请求数据
      const requestData = {
        name: values.name,
        description: values.description,
        parameters: parameters.map((param) => ({
          name: param.name,
          type: param.type,
          range: [param.min, param.max] as [number, number],
          default: param.default,
        })),
      };

      await createConfigSpace(requestData);
      message.success('配置空间创建成功');
      
      // 重置表单
      form.resetFields();
      setParameters([]);
      onSuccess();
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message || error?.message || '配置空间创建失败';
      message.error(errorMsg);
      console.error('Create config space error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setParameters([]);
    onCancel();
  };

  return (
    <Modal
      title="创建配置空间"
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          创建
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="配置空间名称"
          rules={[
            { required: true, message: '请输入配置空间名称' },
            {
              pattern: /^[a-zA-Z0-9_-]+$/,
              message: '名称只能包含字母、数字、下划线和连字符',
            },
          ]}
        >
          <Input placeholder="例如: my-config-space" />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <TextArea
            rows={3}
            placeholder="请输入配置空间的描述信息（可选）"
          />
        </Form.Item>

        <Divider>参数配置</Divider>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="dashed"
            onClick={handleAddParameter}
            icon={<PlusOutlined />}
            block
          >
            添加参数
          </Button>
        </div>

        {parameters.map((param, index) => (
          <Card
            key={index}
            size="small"
            style={{ marginBottom: 16 }}
            title={`参数 ${index + 1}`}
            extra={
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveParameter(index)}
              >
                删除
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="参数名称（例如: spark.executor.memory）"
                value={param.name}
                onChange={(e) =>
                  handleParameterChange(index, 'name', e.target.value)
                }
              />
              <Space>
                <span>类型:</span>
                <Select
                  value={param.type}
                  onChange={(value) =>
                    handleParameterChange(index, 'type', value)
                  }
                  style={{ width: 120 }}
                >
                  <Select.Option value="int">整数</Select.Option>
                  <Select.Option value="float">浮点数</Select.Option>
                </Select>
              </Space>
              <Space>
                <span>最小值:</span>
                <InputNumber
                  value={param.min}
                  onChange={(value) =>
                    handleParameterChange(index, 'min', value || 0)
                  }
                  style={{ width: 120 }}
                />
                <span>最大值:</span>
                <InputNumber
                  value={param.max}
                  onChange={(value) =>
                    handleParameterChange(index, 'max', value || 100)
                  }
                  style={{ width: 120 }}
                />
              </Space>
              <Space>
                <span>默认值:</span>
                <InputNumber
                  value={param.default}
                  onChange={(value) =>
                    handleParameterChange(index, 'default', value || 0)
                  }
                  style={{ width: 120 }}
                />
              </Space>
            </Space>
          </Card>
        ))}

        {parameters.length === 0 && (
          <Card style={{ textAlign: 'center', color: '#999' }}>
            <p>暂无参数，点击上方"添加参数"按钮开始配置</p>
            <p style={{ fontSize: '12px' }}>
              如果不添加参数，将使用后端默认配置空间
            </p>
          </Card>
        )}
      </Form>
    </Modal>
  );
};

export default ConfigSpaceCreateModal;

