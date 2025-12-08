import React from 'react';
import { Form, Input, Alert, Divider, InputNumber, Row, Col, Select, Switch } from 'antd';
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

      <Divider orientation="left">运行配置</Divider>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            name="iterNum"
            label="迭代次数"
            rules={[{ required: true, message: '请输入迭代次数' }]}
          >
            <InputNumber min={1} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="database"
            label="数据库"
            rules={[{ required: true, message: '请输入数据库标识' }]}
          >
            <Input placeholder="tpcds_100g" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="similarityThreshold"
            label="相似度阈值"
            rules={[{ required: true, message: '请输入相似度阈值' }]}
          >
            <InputNumber min={0} max={1} step={0.05} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="target" label="目标标识">
            <Input placeholder="tpcds_100g" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="seed" label="随机种子">
            <InputNumber min={0} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="randProb" label="随机概率">
            <InputNumber min={0} max={1} step={0.01} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="randMode" label="随机模式">
            <Select
              options={[
                { label: 'ran', value: 'ran' },
                { label: 'rs', value: 'rs' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="testMode" label="测试模式" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="opt" label="优化器算法">
            <Select
              options={[
                { label: 'MFES_SMAC', value: 'MFES_SMAC' },
                { label: 'BOHB_GP', value: 'BOHB_GP' },
                { label: 'BOHB_SMAC', value: 'BOHB_SMAC' },
                { label: 'MFES_GP', value: 'MFES_GP' },
                { label: 'SMAC', value: 'SMAC' },
                { label: 'GP', value: 'GP' },
                { label: 'LLAMATUNE_SMAC', value: 'LLAMATUNE_SMAC' },
                { label: 'LLAMATUNE_GP', value: 'LLAMATUNE_GP' },
                { label: 'REMBO_SMAC', value: 'REMBO_SMAC' },
                { label: 'REMBO_GP', value: 'REMBO_GP' },
                { label: 'HESBO_SMAC', value: 'HESBO_SMAC' },
                { label: 'HESBO_GP', value: 'HESBO_GP' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="logLevel" label="日志级别">
            <Select
              options={[
                { label: 'INFO', value: 'info' },
                { label: 'DEBUG', value: 'debug' },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">迁移学习与热启动</Divider>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="tlStrategy" label="迁移学习策略">
            <Select
              placeholder="选择策略"
              options={[
                { label: '无', value: 'none' },
                { label: 'MCE', value: 'mce' },
                { label: 'RE', value: 're' },
                { label: 'TOPO', value: 'topo' },
              ]}
            />
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
          <Form.Item name="wsStrategy" label="WS 策略">
            <Select
              placeholder="选择策略"
              options={[
                { label: '无', value: 'none' },
                { label: 'Best ROVER', value: 'best_rover' },
                { label: 'Best All', value: 'best_all' },
                { label: 'Top3 ROVER', value: 'top3_rover' },
                { label: 'Top3 All', value: 'top3_all' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="wsInitNum" label="WS 初始样本">
            <InputNumber min={0} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="wsTopk" label="WS TopK">
            <InputNumber min={0} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="wsInnerSurrogateModel" label="WS 内部模型">
            <Input placeholder="prf" />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">压缩与 CP 配置</Divider>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="compress" label="压缩策略">
            <Select
              placeholder="选择压缩策略"
              options={[
                { label: 'none', value: 'none' },
                { label: 'shap', value: 'shap' },
                { label: 'expert', value: 'expert' },
                { label: 'llamatune', value: 'llamatune' },
              ]}
            />
          </Form.Item>
        </Col>
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
      </Row>

      <Divider orientation="left">调度器配置</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="schedulerR" label="Scheduler R">
            <InputNumber min={1} {...numberProps} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="schedulerEta" label="Scheduler η">
            <InputNumber min={1} {...numberProps} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default BasicInfoStep;

