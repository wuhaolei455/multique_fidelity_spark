/**
 * 基本信息步骤
 */

import React from 'react';
import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';

interface BasicInfoStepProps {
  form: FormInstance;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ form }) => {
  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="name"
        label="任务名称"
        rules={[{ required: true, message: '请输入任务名称' }]}
      >
        <Input placeholder="请输入任务名称" />
      </Form.Item>

      <Form.Item name="description" label="任务描述">
        <Input.TextArea rows={4} placeholder="请输入任务描述" />
      </Form.Item>

      <Form.Item
        name="method"
        label="优化方法"
        rules={[{ required: true, message: '请选择优化方法' }]}
      >
        <Select placeholder="请选择优化方法">
          <Select.Option value="SMAC">SMAC</Select.Option>
          <Select.Option value="GP">GP</Select.Option>
          <Select.Option value="MFES_SMAC">MFES-SMAC</Select.Option>
          <Select.Option value="MFES_GP">MFES-GP</Select.Option>
          <Select.Option value="BOHB_GP">BOHB-GP</Select.Option>
          <Select.Option value="BOHB_SMAC">BOHB-SMAC</Select.Option>
        </Select>
      </Form.Item>
    </Form>
  );
};

export default BasicInfoStep;

