import React from 'react';
import { Form, Input, Alert } from 'antd';
import type { FormInstance } from 'antd';

interface BasicInfoStepProps {
  form: FormInstance;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ form }) => {
  return (
    <div>
      <Alert
        message="欢迎创建优化任务"
        description="请填写任务的基本信息。在下一步中，您将上传配置空间和评估器脚本。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Form.Item
        name="name"
        label="任务名称"
        rules={[
          { required: true, message: '请输入任务名称' },
          { 
            pattern: /^[a-zA-Z0-9_-]+$/, 
            message: '任务名称只能包含字母、数字、下划线和短横线' 
          }
        ]}
        tooltip="任务名称将用于标识和查找任务，建议使用有意义的名称"
      >
        <Input 
          placeholder="例如: spark_optimization_task_001" 
          maxLength={50}
          onChange={(e) => form.setFieldValue('name', e.target.value)}
        />
      </Form.Item>

      <Form.Item 
        name="description" 
        label="任务描述"
        tooltip="简要描述任务的目的和优化目标"
      >
        <Input.TextArea 
          rows={4} 
          placeholder="例如: 优化 Spark 执行引擎参数，提升 TPC-DS 查询性能" 
          maxLength={500}
          showCount
          onChange={(e) => form.setFieldValue('description', e.target.value)}
        />
      </Form.Item>

      {/* 保留其他步骤的字段 */}
      <Form.Item name="configSpaceContent" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="configSpaceFileName" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="evaluatorScript" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="scriptFileName" hidden>
        <Input />
      </Form.Item>
    </div>
  );
};

export default BasicInfoStep;

