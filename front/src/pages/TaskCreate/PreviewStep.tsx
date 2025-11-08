/**
 * 预览和提交步骤
 */

import React from 'react';
import { Descriptions } from 'antd';
import type { FormInstance } from 'antd';

interface PreviewStepProps {
  form: FormInstance;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ form }) => {
  const values = form.getFieldsValue();

  return (
    <div>
      <h3>配置预览</h3>
      <Descriptions column={2} bordered>
        <Descriptions.Item label="任务名称">{values.name}</Descriptions.Item>
        <Descriptions.Item label="优化方法">{values.method}</Descriptions.Item>
        <Descriptions.Item label="配置空间" span={2}>
          {values.config_space}
        </Descriptions.Item>
        <Descriptions.Item label="任务描述" span={2}>
          {values.description || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="总迭代次数">
          {values.iter_num}
        </Descriptions.Item>
        <Descriptions.Item label="初始化数量">
          {values.init_num}
        </Descriptions.Item>
        <Descriptions.Item label="Warm Start 策略">
          {values.warm_start_strategy}
        </Descriptions.Item>
        <Descriptions.Item label="Transfer Learning 策略">
          {values.transfer_learning_strategy}
        </Descriptions.Item>
        <Descriptions.Item label="压缩策略" span={2}>
          {values.compression_strategy}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default PreviewStep;

