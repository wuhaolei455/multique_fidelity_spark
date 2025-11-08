/**
 * 配置空间步骤
 */

import React, { useEffect } from 'react';
import { Form, Select } from 'antd';
import type { FormInstance } from 'antd';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { fetchConfigSpaces } from '@/store/slices/configSlice';

interface ConfigSpaceStepProps {
  form: FormInstance;
}

const ConfigSpaceStep: React.FC<ConfigSpaceStepProps> = ({ form }) => {
  const dispatch = useAppDispatch();
  const { configSpaces, loading } = useAppSelector((state) => state.config);

  useEffect(() => {
    dispatch(fetchConfigSpaces());
  }, [dispatch]);

  // 确保 configSpaces 是数组
  const spaces = Array.isArray(configSpaces) ? configSpaces : [];

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="config_space"
        label="配置空间"
        rules={[{ required: true, message: '请选择配置空间' }]}
      >
        <Select placeholder="请选择配置空间" loading={loading}>
          {spaces.map((space) => (
            <Select.Option key={space.id} value={space.name}>
              {space.name} - {space.description}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );
};

export default ConfigSpaceStep;

