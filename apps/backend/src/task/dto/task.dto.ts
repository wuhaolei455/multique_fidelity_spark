import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: '任务名称' })
  @IsString({ message: '任务名称必须是字符串' })
  @IsNotEmpty({ message: '任务名称不能为空' })
  name: string;

  @ApiPropertyOptional({ description: '任务描述' })
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '配置空间JSON字符串' })
  @IsString({ message: '配置空间必须是字符串' })
  @IsNotEmpty({ message: '配置空间不能为空' })
  configSpace: string;

  @ApiProperty({ description: '可执行脚本内容' })
  @IsString({ message: '评估器脚本必须是字符串' })
  @IsNotEmpty({ message: '评估器脚本不能为空' })
  evaluatorScript: string;

  @ApiPropertyOptional({ description: '配置空间文件名' })
  @IsOptional()
  configSpaceFileName?: string;

  @ApiPropertyOptional({ description: '脚本文件名' })
  @IsOptional()
  scriptFileName?: string;
}

export class CreateTaskResponseDto {
  @ApiProperty({ description: '任务ID' })
  taskId: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: string;

  @ApiProperty({ description: '任务状态' })
  status: string;

  @ApiProperty({ description: '配置空间文件路径' })
  configSpacePath: string;

  @ApiProperty({ description: '脚本文件路径' })
  scriptPath: string;

  @ApiProperty({ description: '进程ID' })
  processId?: number;

  @ApiPropertyOptional({ description: '框架 YAML 配置路径' })
  configFilePath?: string;

  @ApiPropertyOptional({ description: '历史数据文件路径' })
  historyFilePath?: string;

  @ApiPropertyOptional({ description: '原始数据文件路径' })
  dataFilePath?: string;
}

export class TaskStatusDto {
  @ApiProperty({ description: '任务ID' })
  taskId: string;

  @ApiProperty({ description: '任务状态' })
  status: string;

  @ApiProperty({ description: '进程ID' })
  processId?: number;

  @ApiProperty({ description: '是否运行中' })
  isRunning: boolean;

  @ApiPropertyOptional({ description: '错误信息' })
  error?: string;
}

export class LaunchFrameworkTaskDto {
  @ApiProperty({ description: '任务名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '任务描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '迭代次数', default: 10 })
  @IsOptional()
  @IsNumber()
  iterNum?: number;

  @ApiPropertyOptional({ description: '数据库标识', default: 'tpcds_100g' })
  @IsOptional()
  @IsString()
  database?: string;

  @ApiPropertyOptional({ description: '相似度阈值', default: 0.5 })
  @IsOptional()
  @IsNumber()
  similarityThreshold?: number;

  @ApiPropertyOptional({ description: '日志目录（相对于仓库根目录 config/history 等）' })
  @IsOptional()
  @IsString()
  logDir?: string;

  @ApiPropertyOptional({ description: '数据目录' })
  @IsOptional()
  @IsString()
  dataDir?: string;

  @ApiPropertyOptional({ description: '历史目录' })
  @IsOptional()
  @IsString()
  historyDir?: string;

  @ApiPropertyOptional({ description: '结果目录' })
  @IsOptional()
  @IsString()
  saveDir?: string;

  @ApiPropertyOptional({ description: '目标名称', default: 'tpcds_100g' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({ description: '随机种子', default: 42 })
  @IsOptional()
  @IsNumber()
  seed?: number;

  @ApiPropertyOptional({ description: '随机探索概率', default: 0.15 })
  @IsOptional()
  @IsNumber()
  randProb?: number;

  @ApiPropertyOptional({ description: '随机模式', default: 'ran', enum: ['ran', 'rs'] })
  @IsOptional()
  @IsIn(['ran', 'rs'])
  randMode?: 'ran' | 'rs';

  @ApiPropertyOptional({ description: '优化器', default: 'MFES_SMAC' })
  @IsOptional()
  @IsString()
  opt?: string;

  @ApiPropertyOptional({ description: '日志级别', default: 'info', enum: ['info', 'debug'] })
  @IsOptional()
  @IsIn(['info', 'debug'])
  logLevel?: 'info' | 'debug';

  @ApiPropertyOptional({ description: '测试模式', default: false })
  @IsOptional()
  testMode?: boolean;

  @ApiPropertyOptional({ description: 'Warm Start 初始样本数量', default: 4 })
  @IsOptional()
  @IsNumber()
  wsInitNum?: number;

  @ApiPropertyOptional({ description: 'Warm Start TopK', default: 4 })
  @IsOptional()
  @IsNumber()
  wsTopk?: number;

  @ApiPropertyOptional({ description: 'Warm Start 内部模型', default: 'prf' })
  @IsOptional()
  @IsString()
  wsInnerSurrogateModel?: string;

  @ApiPropertyOptional({ description: 'Warm Start 策略', default: 'none' })
  @IsOptional()
  @IsString()
  wsStrategy?: string;

  @ApiPropertyOptional({ description: '迁移学习 TopK', default: 3 })
  @IsOptional()
  @IsNumber()
  tlTopk?: number;

  @ApiPropertyOptional({ description: '迁移学习策略', default: 'none' })
  @IsOptional()
  @IsString()
  tlStrategy?: string;

  @ApiPropertyOptional({ description: '压缩策略', default: 'shap' })
  @IsOptional()
  @IsString()
  compress?: string;

  @ApiPropertyOptional({ description: 'CP 策略', default: 'none' })
  @IsOptional()
  @IsString()
  cpStrategy?: string;

  @ApiPropertyOptional({ description: 'CP TopK', default: 40 })
  @IsOptional()
  @IsNumber()
  cpTopk?: number;

  @ApiPropertyOptional({ description: 'CP Sigma', default: 2.0 })
  @IsOptional()
  @IsNumber()
  cpSigma?: number;

  @ApiPropertyOptional({ description: 'CP Top Ratio', default: 0.8 })
  @IsOptional()
  @IsNumber()
  cpTopRatio?: number;

  @ApiPropertyOptional({ description: '调度器最大资源', default: 27 })
  @IsOptional()
  @IsNumber()
  schedulerR?: number;

  @ApiPropertyOptional({ description: '调度器缩减因子', default: 3 })
  @IsOptional()
  @IsNumber()
  schedulerEta?: number;

  @ApiPropertyOptional({ description: '配置空间路径覆盖' })
  @IsOptional()
  @IsString()
  configSpacePath?: string;

  @ApiPropertyOptional({ description: '专家空间路径覆盖' })
  @IsOptional()
  @IsString()
  expertSpacePath?: string;

  @ApiPropertyOptional({ description: '历史 JSON 文件内容（文本，可选）' })
  @IsOptional()
  @IsString()
  historyFileContent?: string;

  @ApiPropertyOptional({ description: '服务端历史文件路径（相对于 holly/history）' })
  @IsOptional()
  @IsString()
  serverHistoryFile?: string;

  @ApiPropertyOptional({ description: '服务端数据文件路径（相对于 holly/data）' })
  @IsOptional()
  @IsString()
  serverDataFile?: string;

  @ApiPropertyOptional({ description: '历史 JSON 文件名' })
  @IsOptional()
  @IsString()
  historyFileName?: string;

  @ApiPropertyOptional({ description: '数据文件内容（文本，可选）' })
  @IsOptional()
  @IsString()
  dataFileContent?: string;

  @ApiPropertyOptional({ description: '数据文件名（可选）' })
  @IsOptional()
  @IsString()
  dataFileName?: string;

  @ApiPropertyOptional({ description: 'huge_space.json 内容（文本，可选）' })
  @IsOptional()
  @IsString()
  hugeSpaceFileContent?: string;
}

