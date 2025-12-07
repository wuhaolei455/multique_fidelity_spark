import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Form, Input, Space, Tag, Typography, Upload, message } from 'antd';
import type { FormInstance } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

interface HistoryUploadStepProps {
  form: FormInstance;
}

interface HistoryFileSummary {
  name: string;
  size: number;
}

const MAX_HISTORY_PREVIEW = 4000;

const EvaluatorScriptStep: React.FC<HistoryUploadStepProps> = ({ form }) => {
  const [historyFiles, setHistoryFiles] = useState<HistoryFileSummary[]>([]);
  const [historyPreview, setHistoryPreview] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [parsingHistory, setParsingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const cachedContent = form.getFieldValue('historyFileContent');
    const cachedNames = form.getFieldValue('historyFileName');
    if (cachedContent && cachedNames) {
      setHistoryPreview(cachedContent);
      const names = cachedNames.split(',').map((name: string) => name.trim()).filter(Boolean);
      setHistoryFiles(names.map((name: string) => ({ name, size: cachedContent.length })));
    }
  }, [form]);

  const parseHistoryFiles = async (files: File[]) => {
    if (!files.length) {
      message.warning('请选择至少一个历史 JSON');
      return;
    }
    setParsingHistory(true);
    try {
      const merged: any[] = [];
      for (const file of files) {
        if (!file.name.endsWith('.json')) {
          throw new Error(`文件 ${file.name} 不是 JSON 格式`);
        }
        const text = await file.text();
        let json;
        try {
          json = JSON.parse(text);
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
            json = JSON.parse(fixedText);
          } catch (fixError) {
            throw new Error(`解析 ${file.name} 失败：${error instanceof Error ? error.message : '格式错误'}`);
          }
        }
        if (Array.isArray(json)) {
          merged.push(...json);
        } else {
          merged.push(json);
        }
      }
      if (merged.length === 0) {
        throw new Error('历史 JSON 不能为空');
      }
      const formatted = JSON.stringify(merged, null, 2);
      form.setFieldsValue({
        historyFileContent: formatted,
        historyFileName: files.map((f) => f.name).join(', '),
      });
      setHistoryPreview(formatted);
      setHistoryFiles(files.map((f) => ({ name: f.name, size: f.size })));
      message.success(`成功导入 ${files.length} 个历史文件`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取历史文件失败');
      setHistoryFiles([]);
      setHistoryPreview('');
      form.setFieldsValue({
        historyFileContent: undefined,
        historyFileName: undefined,
      });
    } finally {
      setParsingHistory(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (parsingHistory) return;
    const files = Array.from(event.dataTransfer.files).filter((file) => file.name.endsWith('.json'));
    if (!files.length) {
      message.warning('请拖拽 JSON 文件');
      return;
    }
    parseHistoryFiles(files);
  };

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      parseHistoryFiles(Array.from(files));
      event.target.value = '';
    }
  };

  const clearHistory = () => {
    setHistoryFiles([]);
    setHistoryPreview('');
    form.setFieldsValue({
      historyFileContent: undefined,
      historyFileName: undefined,
    });
  };

  const handleDataUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      form.setFieldsValue({
        dataFileContent: content,
        dataFileName: file.name,
      });
      message.success('数据文件上传成功');
    };
    reader.readAsText(file);
    return false;
  };

  return (
    <div>
      <Form.Item
        name="historyFileContent"
        rules={[{ required: true, message: '请上传历史 JSON 文件' }]}
        style={{ display: 'none' }}
      >
        <Input.TextArea />
      </Form.Item>
      <Form.Item name="historyFileName" style={{ display: 'none' }}>
        <Input />
      </Form.Item>

      <Alert
        message="步骤三：上传历史数据"
        description="历史 JSON 为必填项，内容会写入 holly/history。支持上传多个 JSON 文件，系统会自动合并。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? '#1677ff' : '#bbb'}`,
          borderRadius: 8,
          padding: 32,
          textAlign: 'center',
          background: dragActive ? '#f0f7ff' : '#fafafa',
          transition: 'all 0.15s ease',
        }}
        role="button"
      >
        <input
          type="file"
          accept=".json"
          multiple
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleSelect}
        />
        <div style={{ fontSize: 42, marginBottom: 12 }}>
          <InboxOutlined />
        </div>
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          拖拽或点击上传 history_json
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          可一次选择多个 JSON 文件，系统将自动解析并合并
        </Typography.Paragraph>
        <Button
          type="primary"
          onClick={() => fileInputRef.current?.click()}
          loading={parsingHistory}
        >
          选择文件
        </Button>
      </div>

      {historyFiles.length > 0 && (
        <>
          <Card
            title="已选择的历史文件"
            size="small"
            style={{ marginTop: 24 }}
            extra={
              <Button type="link" onClick={clearHistory}>
                清空
              </Button>
            }
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {historyFiles.map((file) => (
                <Space key={file.name}>
                  <span>{file.name}</span>
                  <Tag>{(file.size / 1024).toFixed(2)} KB</Tag>
                </Space>
              ))}
            </Space>
          </Card>

          <Card
            title="历史内容预览"
            size="small"
            style={{ marginTop: 16 }}
            styles={{ body: { maxHeight: 260, overflow: 'auto' } }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {historyPreview.length > MAX_HISTORY_PREVIEW
                ? `${historyPreview.slice(0, MAX_HISTORY_PREVIEW)}\n...（预览已截断）`
                : historyPreview}
            </pre>
          </Card>
        </>
      )}

      <Alert
        showIcon
        type="success"
        message="数据文件（可选）"
        description="用于覆盖 mock/data，可上传 SQL、JSON 或压缩包等文本内容。"
        style={{ marginTop: 24, marginBottom: 16 }}
      />

      <Form.Item label="数据文件（可选）" style={{ marginBottom: 12 }}>
        <Upload.Dragger
          name="data"
          beforeUpload={handleDataUpload}
          showUploadList={false}
          accept=".json,.txt,.sql,.csv,.yaml,.yml"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">拖拽或点击上传数据文件</p>
          <p className="ant-upload-hint">内容将以文本形式存储，可用于 mock/data</p>
        </Upload.Dragger>
      </Form.Item>

      <Form.Item name="dataFileContent" label="数据文件内容">
        <Input.TextArea
          rows={6}
          placeholder="可选：直接在此粘贴数据文件内容"
          style={{ fontFamily: 'monospace' }}
        />
      </Form.Item>

      <Form.Item name="dataFileName" hidden>
        <Input />
      </Form.Item>
    </div>
  );
};

export default EvaluatorScriptStep;

