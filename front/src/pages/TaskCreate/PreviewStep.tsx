import React from 'react';
import { Descriptions, Card, Typography, Alert, Form, Input } from 'antd';
import type { FormInstance } from 'antd';

const { Paragraph } = Typography;

interface PreviewStepProps {
  form: FormInstance;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ form }) => {
  const values = form.getFieldsValue();
  console.log('PreviewStep - 渲染时的表单值:', values);
  
  const name = values.name;
  const description = values.description;
  const configSpaceContent = values.configSpaceContent;
  const configSpaceFileName = values.configSpaceFileName;
  const evaluatorScript = values.evaluatorScript;
  const scriptFileName = values.scriptFileName;
  
  return (
    <div>
      {/* 保留所有步骤的字段 */}
      <Form.Item name="name" hidden><Input /></Form.Item>
      <Form.Item name="description" hidden><Input /></Form.Item>
      <Form.Item name="configSpaceContent" hidden><Input /></Form.Item>
      <Form.Item name="configSpaceFileName" hidden><Input /></Form.Item>
      <Form.Item name="evaluatorScript" hidden><Input /></Form.Item>
      <Form.Item name="scriptFileName" hidden><Input /></Form.Item>

      <h3 style={{ marginBottom: 16 }}>配置预览</h3>
      
      <Alert
        message="提交前请仔细检查"
        description="确认所有信息无误后，点击【提交】按钮创建并启动任务。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Descriptions column={2} bordered style={{ marginBottom: 24 }}>
        <Descriptions.Item label="任务名称" span={2}>
          <strong>{name || '未设置'}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="任务描述" span={2}>
          {description || '无描述'}
        </Descriptions.Item>
        <Descriptions.Item label="配置空间文件名" span={2}>
          {configSpaceFileName || 'config_space.json'}
        </Descriptions.Item>
        <Descriptions.Item label="脚本文件名" span={2}>
          {scriptFileName || 'evaluator.sh'}
        </Descriptions.Item>
      </Descriptions>

      <Card 
        title="配置空间内容" 
        size="small" 
        style={{ marginBottom: 16 }}
        styles={{ body: { maxHeight: 300, overflow: 'auto' } }}
      >
        <Paragraph>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {(() => {
              if (!configSpaceContent) return '未提供配置空间内容';
              try {
                return JSON.stringify(JSON.parse(configSpaceContent), null, 2);
              } catch (e) {
                return configSpaceContent;
              }
            })()}
          </pre>
        </Paragraph>
      </Card>

      <Card 
        title="评估器脚本内容" 
        size="small"
        styles={{ body: { maxHeight: 300, overflow: 'auto' } }}
      >
        <Paragraph>
          <pre style={{ 
            margin: 0, 
            whiteSpace: 'pre-wrap', 
            wordWrap: 'break-word',
            fontFamily: 'monospace',
            fontSize: 12,
          }}>
            {evaluatorScript || '未提供脚本内容'}
          </pre>
        </Paragraph>
      </Card>
    </div>
  );
};

export default PreviewStep;

