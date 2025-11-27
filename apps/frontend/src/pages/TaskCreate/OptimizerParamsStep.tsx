/**
 * 优化参数步骤
 */

import React from 'react';
import { Form, InputNumber, Select } from 'antd';
import type { FormInstance } from 'antd';

interface OptimizerParamsStepProps {
  form: FormInstance;
}

const OptimizerParamsStep: React.FC<OptimizerParamsStepProps> = ({ form }) => {
  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="iter_num"
        label="总迭代次数"
        rules={[{ required: true, message: '请输入总迭代次数' }]}
        initialValue={100}
      >
        <InputNumber min={1} max={1000} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="init_num"
        label="初始化数量"
        rules={[{ required: true, message: '请输入初始化数量' }]}
        initialValue={10}
      >
        <InputNumber min={1} max={100} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="warm_start_strategy"
        label="Warm Start 策略"
        initialValue="none"
      >
        <Select>
          <Select.Option value="none">无</Select.Option>
          <Select.Option value="best_rover">Best ROVER</Select.Option>
          <Select.Option value="best_all">Best All</Select.Option>
          <Select.Option value="top3_rover">Top3 ROVER</Select.Option>
          <Select.Option value="top3_all">Top3 All</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="transfer_learning_strategy"
        label="Transfer Learning 策略"
        initialValue="none"
      >
        <Select>
          <Select.Option value="none">无</Select.Option>
          <Select.Option value="mce">MCE</Select.Option>
          <Select.Option value="re">RE</Select.Option>
          <Select.Option value="topo">TOPO</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="compression_strategy"
        label="压缩策略"
        initialValue="none"
      >
        <Select>
          <Select.Option value="none">无</Select.Option>
          <Select.Option value="shap">SHAP</Select.Option>
          <Select.Option value="expert">Expert</Select.Option>
          <Select.Option value="range">Range</Select.Option>
        </Select>
      </Form.Item>
    </Form>
  );
};

export default OptimizerParamsStep;

