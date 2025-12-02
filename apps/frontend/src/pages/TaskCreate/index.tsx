/**
 * 任务创建页面
 */

import React, { useEffect, useState } from 'react';
import { Card, Steps, Button, message, Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import { launchFrameworkTask, createFrameworkTask, startTask, LaunchFrameworkPayload } from '@/services/api/taskApi';
import BasicInfoStep from './BasicInfoStep';
import EvaluatorScriptStep from './EvaluatorScriptStep';
import ConfigSpaceStep from './ConfigSpaceStep';
import PreviewStep from './PreviewStep';
import './index.less';

const DEFAULT_FORM_VALUES = {
  iterNum: 10,
  database: 'tpcds_100g',
  similarityThreshold: 0.5,
  target: 'tpcds_100g',
  seed: 42,
  randProb: 0.15,
  randMode: 'ran',
  compress: 'shap',
  cpStrategy: 'none',
  cpTopk: 40,
  cpSigma: 2.0,
  cpTopRatio: 0.8,
  wsInitNum: 4,
  wsTopk: 4,
  wsInnerSurrogateModel: 'prf',
  tlTopk: 3,
  schedulerR: 27,
  schedulerEta: 3,
};

const TaskCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    form.setFieldsValue(DEFAULT_FORM_VALUES);
  }, [form]);

  const stepTitles = [
    { title: '基本信息' },
    { title: '配置空间' },
    { title: '历史与数据' },
    { title: '预览与提交' },
  ];

  const stepFieldGroups: Record<number, string[]> = {
    0: [
      'name',
      'iterNum',
      'database',
      'similarityThreshold',
      'target',
      'compress',
      'cpStrategy',
      'cpTopk',
      'cpSigma',
      'cpTopRatio',
      'wsInitNum',
      'wsTopk',
      'wsInnerSurrogateModel',
      'schedulerR',
      'schedulerEta',
    ],
    1: ['configSpaceContent'],
    2: ['historyFileContent'],
  };

  // 使用 display: none 来控制显示隐藏，以保留表单状态
  const renderStepContent = () => {
    return (
      <>
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <BasicInfoStep form={form} />
        </div>
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <ConfigSpaceStep form={form} />
        </div>
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <EvaluatorScriptStep form={form} />
        </div>
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          <PreviewStep key={refreshKey} form={form} />
        </div>
      </>
    );
  };

  const handleNext = async () => {
    try {
      const fields = stepFieldGroups[currentStep];
      if (fields) {
        await form.validateFields(fields);
      }
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      if (nextStep === 3) {
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
      await form.validateFields();
      const values = form.getFieldsValue();

      if (!values.configSpaceContent) {
        message.error('请上传配置空间 JSON');
        return;
      }

      if (!values.historyFileContent) {
        message.error('请上传历史 JSON');
        return;
      }

      const payload: LaunchFrameworkPayload = {
        name: values.name,
        description: values.description || '',
        iterNum: values.iterNum,
        database: values.database,
        similarityThreshold: values.similarityThreshold,
        target: values.target,
        seed: values.seed,
        randProb: values.randProb,
        randMode: values.randMode,
        compress: values.compress,
        cpStrategy: values.cpStrategy,
        cpTopk: values.cpTopk,
        cpSigma: values.cpSigma,
        cpTopRatio: values.cpTopRatio,
        wsInitNum: values.wsInitNum,
        wsTopk: values.wsTopk,
        wsInnerSurrogateModel: values.wsInnerSurrogateModel,
        tlTopk: values.tlTopk,
        schedulerR: values.schedulerR,
        schedulerEta: values.schedulerEta,
        historyFileName: values.historyFileName || undefined,
        historyFileContent: values.historyFileContent,
        dataFileName: values.dataFileName || undefined,
        dataFileContent: values.dataFileContent || undefined,
        configSpacePath: undefined,
        hugeSpaceFileContent: values.configSpaceContent,
      };
      
      // 使用新的创建接口
      const createResult = await createFrameworkTask(payload);
      console.log('任务创建成功:', createResult);

      // 自动启动任务
      await startTask(createResult.taskId);
      message.success('任务创建成功并已启动！');
      
      // 跳转到任务监控页面
      navigate(`/tasks/${createResult.taskId}/monitor`);
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
        <Form form={form} layout="vertical" initialValues={DEFAULT_FORM_VALUES}>
          <Steps current={currentStep} items={stepTitles} />
          <div className="steps-content">{renderStepContent()}</div>
          <div className="steps-action">
            {currentStep > 0 && (
              <Button onClick={handlePrev} style={{ marginRight: 8 }}>
                上一步
              </Button>
            )}
            {currentStep < 3 && (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            )}
            {currentStep === 3 && (
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

