/**
 * 配置空间上传组件
 */

import React, { useState } from 'react';
import { Upload, Button, message, Modal, Card } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { uploadConfigSpace } from '@/services/api/configApi';

const { Dragger } = Upload;

interface ConfigSpaceUploadProps {
  onSuccess?: () => void;
}

const ConfigSpaceUpload: React.FC<ConfigSpaceUploadProps> = ({ onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleUpload = async (file: File) => {
    // 验证文件类型
    if (!file.name.endsWith('.json')) {
      message.error('只支持上传 JSON 格式的配置文件');
      return false;
    }

    setUploading(true);
    try {
      // 读取文件内容
      const fileContent = await file.text();
      const spaceDefinition = JSON.parse(fileContent);
      
      // 从文件名生成配置空间名称（去掉 .json 后缀）
      const spaceName = file.name.replace('.json', '');
      
      // 包装成后端期望的格式
      const configData = {
        name: spaceName,
        description: `从文件 ${file.name} 上传的配置空间`,
        space: spaceDefinition,
        isPreset: false,
      };
      
      // 调用创建配置空间接口
      const result = await uploadConfigSpace(configData);
      message.success(`配置空间上传成功！名称: ${spaceName}`);
      setVisible(false);
      onSuccess?.();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || '配置空间上传失败';
      message.error(errorMsg);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const uploadProps: UploadProps = {
    accept: '.json',
    beforeUpload: handleUpload,
    showUploadList: false,
  };

  return (
    <>
      <Button
        type="primary"
        icon={<UploadOutlined />}
        onClick={() => setVisible(true)}
      >
        上传配置空间
      </Button>

      <Modal
        title="上传配置空间"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={600}
      >
        <Card>
          <Dragger {...uploadProps} disabled={uploading}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 JSON 格式的配置空间文件
              <br />
              文件格式示例：
              <pre style={{ textAlign: 'left', fontSize: '12px', marginTop: '8px' }}>
{`{
  "parameter.name1": {
    "type": "integer",
    "min": 1,
    "max": 100,
    "default": 10
  },
  "parameter.name2": {
    "type": "float",
    "min": 0.1,
    "max": 1.0,
    "default": 0.5
  }
}`}
              </pre>
            </p>
          </Dragger>
        </Card>
      </Modal>
    </>
  );
};

export default ConfigSpaceUpload;

