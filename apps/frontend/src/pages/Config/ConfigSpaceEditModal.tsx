/**
 * 配置空间编辑模态框
 */

import React, { useState, useEffect } from 'react';
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
import { updateConfigSpace } from '@/services/api/configApi';
import type { ConfigSpace, Parameter } from '@/types';

const { TextArea } = Input;

interface ConfigSpaceEditModalProps {
  visible: boolean;
  configSpace: ConfigSpace | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ConfigSpaceEditModal: React.FC<ConfigSpaceEditModalProps> = ({
  visible,
  configSpace,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [parameters, setParameters] = useState<Parameter[]>([]);

  useEffect(() => {
    if (visible && configSpace) {
      // 设置表单初始值
      form.setFieldsValue({
        name: configSpace.name,
        description: configSpace.description,
      });
      // 设置参数列表
      setParameters([...configSpace.parameters]);
    } else {
      form.resetFields();
      setParameters([]);
    }
  }, [visible, configSpace, form]);

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        name: '',
        type: 'int',
        range: [0, 100],
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
    field: keyof Parameter,
    value: any
  ) => {
    const newParameters = [...parameters];
    if (field === 'range') {
      // 确保 range 是数组
      newParameters[index] = {
        ...newParameters[index],
        range: value,
      };
    } else {
      newParameters[index] = {
        ...newParameters[index],
        [field]: value,
      };
    }
    setParameters(newParameters);
  };

  const handleSubmit = async () => {
    try {
      // 验证表单
      const values = await form.validateFields();
      
      // 验证参数
      if (parameters.length === 0) {
        message.warning('请至少添加一个参数');
        return;
      }

      // 检查参数名称是否重复
      const paramNames = parameters.map(p => p.name);
      const uniqueNames = new Set(paramNames);
      if (paramNames.length !== uniqueNames.size) {
        message.error('参数名称不能重复');
        return;
      }

      // 检查参数名称是否为空
      if (parameters.some(p => !p.name || p.name.trim() === '')) {
        message.error('参数名称不能为空');
        return;
      }

      // 检查范围是否合法
      for (const param of parameters) {
        if (param.range && param.range[0] >= param.range[1]) {
          message.error(`参数 ${param.name} 的范围不合法：最小值必须小于最大值`);
          return;
        }
        // 确保 default 是数字类型再比较
        const defaultValue = typeof param.default === 'number' ? param.default : parseFloat(String(param.default));
        if (param.range && !isNaN(defaultValue) && (defaultValue < param.range[0] || defaultValue > param.range[1])) {
          message.error(`参数 ${param.name} 的默认值必须在范围内`);
          return;
        }
      }

      setSubmitting(true);

      if (!configSpace) {
        message.error('配置空间不存在');
        return;
      }

      // 构建更新数据
      const updateData: ConfigSpace = {
        ...configSpace,
        name: values.name,
        description: values.description,
        parameters: parameters.map(p => ({
          name: p.name,
          type: p.type,
          range: p.range,
          default: typeof p.default === 'number' ? p.default : parseFloat(String(p.default)) || 0,
          description: p.description,
        })),
      };

      const result = await updateConfigSpace(configSpace.id, updateData);
      console.log('更新配置空间成功:', result);
      
      message.success('配置空间更新成功');
      onSuccess();
    } catch (error: any) {
      console.error('更新配置空间失败:', error);
      message.error(error.message || '更新配置空间失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setParameters([]);
    onCancel();
  };

  if (!configSpace) return null;

  return (
    <Modal
      title={`编辑配置空间 - ${configSpace.name}`}
      open={visible}
      onCancel={handleCancel}
      width={900}
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
          保存
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

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveParameter(index)}
                >
                  删除
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder="参数名称（如: spark.executor.memory）"
                  value={param.name}
                  onChange={(e) =>
                    handleParameterChange(index, 'name', e.target.value)
                  }
                />
                
                <Space style={{ width: '100%' }}>
                  <Select
                    style={{ width: 120 }}
                    value={param.type}
                    onChange={(value) =>
                      handleParameterChange(index, 'type', value)
                    }
                  >
                    <Select.Option value="int">整数 (int)</Select.Option>
                    <Select.Option value="float">浮点 (float)</Select.Option>
                  </Select>

                  <Space>
                    <span>范围:</span>
                    <InputNumber
                      placeholder="最小值"
                      value={param.range?.[0]}
                      onChange={(value) => {
                        const newRange: [number, number] = [
                          value ?? 0,
                          param.range?.[1] ?? 100,
                        ];
                        handleParameterChange(index, 'range', newRange);
                      }}
                      style={{ width: 100 }}
                    />
                    <span>-</span>
                    <InputNumber
                      placeholder="最大值"
                      value={param.range?.[1]}
                      onChange={(value) => {
                        const newRange: [number, number] = [
                          param.range?.[0] ?? 0,
                          value ?? 100,
                        ];
                        handleParameterChange(index, 'range', newRange);
                      }}
                      style={{ width: 100 }}
                    />
                  </Space>

                  <Space>
                    <span>默认值:</span>
                    <InputNumber
                      value={typeof param.default === 'number' ? param.default : parseFloat(String(param.default)) || 0}
                      onChange={(value) =>
                        handleParameterChange(index, 'default', value ?? 0)
                      }
                      style={{ width: 100 }}
                    />
                  </Space>
                </Space>

                <Input
                  placeholder="参数描述（可选）"
                  value={param.description}
                  onChange={(e) =>
                    handleParameterChange(index, 'description', e.target.value)
                  }
                />
              </Space>
            </Card>
          ))}
        </div>

        {parameters.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无参数，请点击上方按钮添加
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default ConfigSpaceEditModal;

