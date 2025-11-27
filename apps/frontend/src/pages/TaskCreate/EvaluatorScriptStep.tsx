import React from 'react';
import { Form, Upload, Button, message, Input, Space, Alert } from 'antd';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';

interface EvaluatorScriptStepProps {
  form: FormInstance;
}

const EvaluatorScriptStep: React.FC<EvaluatorScriptStepProps> = ({ form }) => {
  console.log('EvaluatorScriptStep - 渲染时的表单值:', form.getFieldsValue());
  
  const handleConfigSpaceUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        JSON.parse(content);
        form.setFieldsValue({
          configSpaceContent: content,
          configSpaceFileName: file.name,
        });
        message.success('配置空间文件上传成功');
      } catch (error) {
        message.error('配置空间文件格式错误，必须是有效的 JSON 文件');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleScriptUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      form.setFieldsValue({
        evaluatorScript: content,
        scriptFileName: file.name,
      });
      message.success('脚本文件上传成功');
    };
    reader.readAsText(file);
    return false;
  };

  const useDefaultConfigSpace = () => {
    const defaultConfig = {
      hyperparameters: [
        {
          name: 'spark.executor.memory',
          type: 'int',
          log: false,
          lower: 1,
          upper: 128,
          default: 4,
        },
        {
          name: 'spark.executor.cores',
          type: 'int',
          log: false,
          lower: 1,
          upper: 32,
          default: 2,
        },
        {
          name: 'spark.sql.shuffle.partitions',
          type: 'int',
          log: false,
          lower: 100,
          upper: 3000,
          default: 200,
        },
      ],
    };
    const content = JSON.stringify(defaultConfig, null, 2);
    form.setFieldsValue({
      configSpaceContent: content,
      configSpaceFileName: 'default_config_space.json',
    });
    message.success('已加载默认配置空间模板');
  };

  const useDefaultScript = () => {
    const defaultScript = `#!/bin/bash

echo "=========================================="
echo "🚀 启动优化任务"
echo "=========================================="
echo ""
echo "📦 配置空间: $1"
echo "🎯 调优目标: 优化性能"
echo ""
echo "=========================================="

python main.py --config configs/waterfall.yaml

echo ""
echo "=========================================="
echo "✅ 任务完成！"
echo "=========================================="
`;
    form.setFieldsValue({
      evaluatorScript: defaultScript,
      scriptFileName: 'default_evaluator.sh',
    });
    message.success('已加载默认脚本模板');
  };

  return (
    <div>
      <Alert
        message="提示"
        description="请上传配置空间（JSON格式）和评估器脚本（Shell脚本）。这些文件将用于执行优化任务。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 保留第一步的字段 */}
      <Form.Item name="name" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="description" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label="配置空间文件"
        required
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload
            accept=".json"
            beforeUpload={handleConfigSpaceUpload}
            maxCount={1}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>选择配置空间文件 (.json)</Button>
          </Upload>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={useDefaultConfigSpace}
          >
            使用默认模板
          </Button>
        </Space>
      </Form.Item>

      <Form.Item
        name="configSpaceContent"
        label="配置空间内容"
        rules={[{ required: true, message: '请上传配置空间文件或使用默认模板' }]}
      >
        <Input.TextArea
          rows={10}
          placeholder="配置空间 JSON 内容将在这里显示..."
          onChange={(e) => form.setFieldValue('configSpaceContent', e.target.value)}
        />
      </Form.Item>

      <Form.Item name="configSpaceFileName" hidden>
        <Input />
      </Form.Item>

      <Form.Item
        label="评估器脚本"
        required
        style={{ marginBottom: 16, marginTop: 32 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload
            accept=".sh,.bash"
            beforeUpload={handleScriptUpload}
            maxCount={1}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>选择脚本文件 (.sh)</Button>
          </Upload>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={useDefaultScript}
          >
            使用默认模板
          </Button>
        </Space>
      </Form.Item>

      <Form.Item
        name="evaluatorScript"
        label="脚本内容"
        rules={[{ required: true, message: '请上传评估器脚本或使用默认模板' }]}
      >
        <Input.TextArea
          rows={12}
          placeholder="脚本内容将在这里显示..."
          onChange={(e) => form.setFieldValue('evaluatorScript', e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Form.Item>

      <Form.Item name="scriptFileName" hidden>
        <Input />
      </Form.Item>
    </div>
  );
};

export default EvaluatorScriptStep;

