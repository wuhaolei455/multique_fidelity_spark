import React from 'react';
import { Descriptions, Card, Typography, Alert } from 'antd';
import type { FormInstance } from 'antd';

const { Paragraph } = Typography;

interface PreviewStepProps {
  form: FormInstance;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ form }) => {
  const values = form.getFieldsValue(true);

  const toSubPath = (value?: string) => {
    if (!value) return '';
    return value.trim().replace(/^[/\\]+/, '');
  };

  const buildFullPath = (base: string, value?: string, fallback?: string) => {
    const sub = toSubPath(value) || fallback || '';
    return sub ? `holly/${base}/${sub}` : `holly/${base}/`;
  };

  const basicItems = [
    { label: '任务名称', value: values.name || '未设置', span: 2 },
    { label: '任务描述', value: values.description || '无描述', span: 2 },
    { label: '迭代次数', value: values.iterNum },
    { label: '数据库', value: values.database },
    { label: '相似度阈值', value: values.similarityThreshold },
    { label: '目标', value: values.target || '默认' },
    { label: '随机概率', value: values.randProb },
    { label: '随机模式', value: values.randMode },
    { label: '压缩策略', value: values.compress },
    { label: 'CP 策略', value: values.cpStrategy },
    { label: 'CP TopK', value: values.cpTopk },
    { label: 'Scheduler (R/η)', value: `${values.schedulerR}/${values.schedulerEta}` },
  ];

  const pathItems = [
    { label: '历史目录', value: buildFullPath('history') },
    { label: '数据目录', value: buildFullPath('data') },
    { label: '结果目录', value: buildFullPath('result') },
    { label: '日志目录', value: buildFullPath('result', 'log', 'log') },
  ];

  return (
    <div>
      <Alert
        message="提交前请仔细检查"
        description="确认所有信息、目录及 history/data 文件无误后再提交。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
        {basicItems.map((item) => (
          <Descriptions.Item key={item.label} label={item.label} span={item.span || 1}>
            {item.value ?? '未设置'}
          </Descriptions.Item>
        ))}
        {pathItems.map((item) => (
          <Descriptions.Item key={item.label} label={item.label}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>

      <Card
        title={`配置空间 (${values.configSpaceFileName || '未上传'})`}
        size="small"
        style={{ marginBottom: 16 }}
        styles={{ body: { maxHeight: 220, overflow: 'auto' } }}
      >
        <Paragraph>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {values.configSpaceContent || '未上传配置空间'}
          </pre>
        </Paragraph>
      </Card>

      <Card
        title={`历史 JSON (${values.historyFileName || '未命名'})`}
        size="small"
        style={{ marginBottom: 16 }}
        styles={{ body: { maxHeight: 260, overflow: 'auto' } }}
      >
        <Paragraph>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {values.historyFileContent || '未上传历史 JSON'}
          </pre>
        </Paragraph>
      </Card>

      <Card
        title={`数据文件 (${values.dataFileName || '可选'})`}
        size="small"
        styles={{ body: { maxHeight: 220, overflow: 'auto' } }}
      >
        <Paragraph>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {values.dataFileContent || '未提供数据文件，将沿用默认 mock/data'}
          </pre>
        </Paragraph>
      </Card>
    </div>
  );
};

export default PreviewStep;

