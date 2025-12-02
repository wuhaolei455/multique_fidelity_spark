import React from 'react';
import { Form, Input, Alert, Divider, InputNumber, Row, Col, Select } from 'antd';
import type { FormInstance } from 'antd';

interface BasicInfoStepProps {
  form: FormInstance;
}

const numberProps = {
  style: { width: '100%' },
};

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ form }) => {
  return (
    <div>
      <Alert
        message="欢迎创建优化任务"
        description="请填写任务基本信息以及需要覆盖的 base.yaml 参数，所有字段都会在服务端自动生成 YAML 并用于启动框架。"
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
            message: '任务名称只能包含字母、数字、下划线和短横线',
          },
        ]}
        tooltip="任务名称将用于标识和查找任务，建议使用有意义的名称"
      >
        <Input placeholder="例如: spark_optimization_task_001" maxLength={50} />
      </Form.Item>

      <Form.Item
        name="description"
        label="任务描述"
        tooltip="简要描述任务的目的和优化目标"
      >
        <Input.TextArea
          rows={3}
          placeholder="例如: 优化 Spark 执行引擎参数，提升 TPC-DS 查询性能"
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Divider orientation="left">运行参数</Divider>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="iterNum"
            label="迭代次数"
            rules={[{ required: true, message: '请输入迭代次数' }]}
          >
            <InputNumber min={1} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="database"
            label="数据库"
            rules={[{ required: true, message: '请输入数据库标识' }]}
          >
            <Input placeholder="tpcds_100g" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="similarityThreshold"
            label="相似度阈值"
            rules={[{ required: true, message: '请输入相似度阈值' }]}
          >
            <InputNumber min={0} max={1} step={0.05} {...numberProps} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="target" label="目标标识">
            <Input placeholder="tpcds_100g" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="seed" label="随机种子">
            <InputNumber min={0} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="randProb" label="随机概率">
            <InputNumber min={0} max={1} step={0.01} {...numberProps} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="randMode" label="随机模式">
            <Select
              options={[
                { label: 'ran', value: 'ran' },
                { label: 'rs', value: 'rs' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="compress" label="压缩策略">
            <Input placeholder="shap / none / expert" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="cpStrategy" label="CP 策略">
            <Input placeholder="none/shap/llamatune" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="cpTopk" label="CP TopK">
            <InputNumber min={1} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="cpSigma" label="CP Sigma">
            <InputNumber min={0} step={0.1} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="cpTopRatio" label="CP Top Ratio">
            <InputNumber min={0} max={1} step={0.05} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="tlTopk" label="迁移学习 TopK">
            <InputNumber min={0} {...numberProps} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="wsInitNum" label="Warm Start 初始样本">
            <InputNumber min={0} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="wsTopk" label="Warm Start TopK">
            <InputNumber min={0} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="wsInnerSurrogateModel" label="Warm Start 模型">
            <Input placeholder="prf" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="schedulerR" label="Scheduler R">
            <InputNumber min={1} {...numberProps} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="schedulerEta" label="Scheduler η">
            <InputNumber min={1} {...numberProps} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default BasicInfoStep;

