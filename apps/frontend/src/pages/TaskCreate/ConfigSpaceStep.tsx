import React, { useEffect, useState } from 'react';
import { Alert, Card, Typography, Space, Button, Tag, message, Form, Input } from 'antd';
import type { FormInstance } from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';

interface ConfigSpaceStepProps {
  form: FormInstance;
}

interface FileSummary {
  name: string;
  size: number;
}

const MAX_PREVIEW_LENGTH = 4000;

const ConfigSpaceStep: React.FC<ConfigSpaceStepProps> = ({ form }) => {
  const [fileInfo, setFileInfo] = useState<FileSummary | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [paramKeys, setParamKeys] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const cachedContent = form.getFieldValue('configSpaceContent');
    const cachedName = form.getFieldValue('configSpaceFileName');
    if (cachedContent && cachedName) {
      setPreviewContent(cachedContent);
      try {
        const parsed = JSON.parse(cachedContent);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setParamKeys(Object.keys(parsed));
        }
      } catch (error) {
        // ignore cached parse errors
      }
      setFileInfo({
        name: cachedName,
        size: cachedContent.length,
      });
    }
  }, [form]);

  const resetConfigSpace = () => {
    setFileInfo(null);
    setPreviewContent('');
    setParamKeys([]);
    form.setFieldsValue({
      configSpaceContent: undefined,
      configSpaceFileName: undefined,
      hugeSpaceFileContent: undefined,
    });
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      message.error('只支持 JSON 格式的配置空间文件');
      return false;
    }
    setIsProcessing(true);
    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        // 尝试兼容处理 Infinity 和 NaN
        try {
          const fixedText = text.replace(
            /"(?:\\.|[^"\\])*"|(-?Infinity)|(NaN)/g,
            (match) => {
              if (match.startsWith('"')) return match;
              return `"${match}"`;
            }
          );
          parsed = JSON.parse(fixedText);
        } catch (fixError) {
          throw error;
        }
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('配置空间必须是一个 JSON 对象');
      }
      const formatted = JSON.stringify(parsed, null, 2);
      form.setFieldsValue({
        configSpaceContent: formatted,
        configSpaceFileName: file.name,
        hugeSpaceFileContent: formatted,
      });
      setFileInfo({ name: file.name, size: file.size });
      setPreviewContent(formatted);
      setParamKeys(Object.keys(parsed));
      message.success('配置空间上传成功');
    } catch (error) {
      resetConfigSpace();
      const errorMsg = error instanceof Error ? error.message : '解析配置空间失败';
      message.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
    return false;
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (isProcessing) return;
    if (event.dataTransfer.files.length > 0) {
      await handleFile(event.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      <Form.Item
        name="configSpaceContent"
        rules={[{ required: true, message: '请上传配置空间 JSON 文件' }]}
        style={{ display: 'none' }}
      >
        <Input.TextArea />
      </Form.Item>
      <Form.Item name="configSpaceFileName" style={{ display: 'none' }}>
        <Input />
      </Form.Item>
      <Form.Item name="hugeSpaceFileContent" style={{ display: 'none' }}>
        <Input.TextArea />
      </Form.Item>

      <Alert
        message="步骤二：上传配置空间"
        description="先上传 config_space.json，系统将解析并在任务执行前覆盖 holly/config/space/huge_space.json。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <label
        htmlFor="config-space-input"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '1px dashed #bbb',
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          display: 'block',
          background: '#fafafa',
          cursor: 'pointer',
        }}
      >
        <input
          id="config-space-input"
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await handleFile(file);
              event.target.value = '';
            }
          }}
        />
        <div style={{ fontSize: 42, marginBottom: 12 }}>
          <InboxOutlined />
        </div>
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          点击或拖拽 config_space.json
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          仅支持 JSON，文件内容需符合 OpenBox ConfigurationSpace 定义
        </Typography.Paragraph>
      </label>

      {fileInfo && (
        <>
          <Card
            title="已上传文件"
            size="small"
            style={{ marginTop: 24 }}
            extra={
              <Button type="link" onClick={resetConfigSpace}>
                重新选择
              </Button>
            }
          >
            <Space direction="vertical" size={8}>
              <Space>
                <FileTextOutlined />
                <span>{fileInfo.name}</span>
                <Tag color="blue">{(fileInfo.size / 1024).toFixed(2)} KB</Tag>
              </Space>
              <Typography.Text type="secondary">
                参数数量：{paramKeys.length > 0 ? paramKeys.length : '解析中'}
              </Typography.Text>
              {paramKeys.length > 0 && (
                <Space wrap style={{ marginTop: 8 }}>
                  {paramKeys.slice(0, 6).map((key) => (
                    <Tag key={key}>{key}</Tag>
                  ))}
                  {paramKeys.length > 6 && <Tag>+{paramKeys.length - 6}</Tag>}
                </Space>
              )}
            </Space>
          </Card>

          <Card
            title="配置空间预览"
            size="small"
            style={{ marginTop: 16 }}
            styles={{ body: { maxHeight: 260, overflow: 'auto' } }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {previewContent.length > MAX_PREVIEW_LENGTH
                ? `${previewContent.slice(0, MAX_PREVIEW_LENGTH)}\n...（预览已截断）`
                : previewContent}
            </pre>
          </Card>
        </>
      )}
    </div>
  );
};

export default ConfigSpaceStep;

