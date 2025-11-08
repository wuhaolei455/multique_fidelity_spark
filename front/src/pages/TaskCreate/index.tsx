/**
 * 任务创建页面
 */

import React, { useState } from 'react';
import { Card, Steps, Button, message, Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { createTask } from '@/store/slices/taskSlice';
import BasicInfoStep from './BasicInfoStep';
import ConfigSpaceStep from './ConfigSpaceStep';
import OptimizerParamsStep from './OptimizerParamsStep';
import PreviewStep from './PreviewStep';
import type { TaskConfig } from '@/types';
import './index.less';

const TaskCreate: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: '基本信息', content: <BasicInfoStep form={form} /> },
    { title: '配置空间', content: <ConfigSpaceStep form={form} /> },
    { title: '优化参数', content: <OptimizerParamsStep form={form} /> },
    { title: '预览和提交', content: <PreviewStep form={form} /> },
  ];

  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {
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
      const config: TaskConfig = {
        name: values.name,
        description: values.description,
        method: values.method,
        config_space: values.config_space,
        iter_num: values.iter_num,
        init_num: values.init_num,
        warm_start_strategy: values.warm_start_strategy,
        transfer_learning_strategy: values.transfer_learning_strategy,
        compression_strategy: values.compression_strategy,
        scheduler_params: values.scheduler_params,
        environment: values.environment,
      };

      const result = await dispatch(createTask({ config })).unwrap();
      message.success('任务创建成功');
      navigate(`/tasks/${result.taskId}`);
    } catch (error) {
      message.error('任务创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-create-page">
      <Card>
        <Steps current={currentStep} items={steps.map((s) => ({ title: s.title }))} />
        <div className="steps-content">{steps[currentStep].content}</div>
        <div className="steps-action">
          {currentStep > 0 && (
            <Button onClick={handlePrev} style={{ marginRight: 8 }}>
              上一步
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={handleNext}>
              下一步
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              提交
            </Button>
          )}
          <Button onClick={() => navigate('/tasks')} style={{ marginLeft: 8 }}>
            取消
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TaskCreate;

