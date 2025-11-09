/**
 * 任务创建页面
 */

import React, { useState } from 'react';
import { Card, Steps, Button, message, Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createTaskWithScript } from '@/services/api/taskApi';
import BasicInfoStep from './BasicInfoStep';
import EvaluatorScriptStep from './EvaluatorScriptStep';
import PreviewStep from './PreviewStep';
import './index.less';

const TaskCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const stepTitles = [
    { title: '基本信息' },
    { title: '配置空间和脚本' },
    { title: '预览和提交' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep form={form} />;
      case 1:
        return <EvaluatorScriptStep form={form} />;
      case 2:
        return <PreviewStep key={refreshKey} form={form} />;
      default:
        return null;
    }
  };

  const handleNext = async () => {
    try {
      const values = form.getFieldsValue();
      console.log('点击下一步时的表单值:', values);
      
      await form.validateFields();
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      if (nextStep === 2) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请完整填写表单');
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();
      
      // 验证必填字段
      if (!values.name) {
        message.error('请输入任务名称');
        return;
      }
      if (!values.configSpaceContent) {
        message.error('请上传配置空间或使用默认模板');
        return;
      }
      if (!values.evaluatorScript) {
        message.error('请上传评估器脚本或使用默认模板');
        return;
      }

      console.log('表单所有值:', values);
      console.log('提交的数据:', {
        name: values.name,
        description: values.description,
        configSpace: values.configSpaceContent,
        evaluatorScript: values.evaluatorScript,
        configSpaceFileName: values.configSpaceFileName || 'config_space.json',
        scriptFileName: values.scriptFileName || 'evaluator.sh',
      });
      
      // 使用新的创建任务API
      const result = await createTaskWithScript({
        name: values.name,
        description: values.description || '',
        configSpace: values.configSpaceContent,
        evaluatorScript: values.evaluatorScript,
        configSpaceFileName: values.configSpaceFileName || 'config_space.json',
        scriptFileName: values.scriptFileName || 'evaluator.sh',
      });

      message.success('任务创建成功并已启动！');
      console.log('任务创建结果:', result);
      
      // 跳转到任务监控页面
      navigate(`/tasks/${result.taskId}/monitor`);
    } catch (error: any) {
      console.error('任务创建失败详情:', error);
      
      // 尝试从错误响应中获取详细信息
      const errorMsg = error.response?.data?.message || 
                       error.message || 
                       '任务创建失败';
      
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-create-page">
      <Card>
        <Form form={form} layout="vertical">
          <Steps current={currentStep} items={stepTitles} />
          <div className="steps-content">{renderStepContent()}</div>
          <div className="steps-action">
            {currentStep > 0 && (
              <Button onClick={handlePrev} style={{ marginRight: 8 }}>
                上一步
              </Button>
            )}
            {currentStep < 2 && (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            )}
            {currentStep === 2 && (
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                提交
              </Button>
            )}
            <Button onClick={() => navigate('/tasks')} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default TaskCreate;

