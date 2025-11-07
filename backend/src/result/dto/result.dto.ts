import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 导入完整的类型定义
export * from '../types/result.types';
import type {
  TaskResult,
  Observation,
  Config,
  Objectives,
  Constraints,
  TaskMetaInfo,
  ExtraInfo,
  TaskStatistics,
  TrendDataPoint,
  ParameterImportance,
  TaskComparison,
} from '../types/result.types';

export class BestConfigResponseDto {
  @ApiProperty({ description: '配置参数' })
  config: Config;

  @ApiProperty({ description: '最佳目标值' })
  bestObjective: number;

  @ApiProperty({ description: '对应的迭代ID' })
  iterId: number;

  @ApiProperty({ description: '观察记录索引' })
  observationIndex: number;

  @ApiPropertyOptional({ description: '创建时间' })
  createTime?: string;
}

export class ObservationResponseDto {
  @ApiProperty({ description: '观察记录索引' })
  index: number;

  @ApiProperty({ description: '配置参数' })
  config: Config;

  @ApiProperty({ description: '目标值数组' })
  objectives: Objectives;

  @ApiPropertyOptional({ description: '约束数组' })
  constraints?: Constraints;

  @ApiProperty({ description: '试验状态' })
  trialState: number;

  @ApiProperty({ description: '耗时（秒）' })
  elapsedTime: number;

  @ApiProperty({ description: '创建时间' })
  createTime: string;

  @ApiPropertyOptional({ description: '额外信息' })
  extraInfo?: ExtraInfo;
}

export class TaskResultResponseDto {
  @ApiProperty({ description: '任务ID' })
  taskId: string;

  @ApiProperty({ description: '目标数量' })
  numObjectives: number;

  @ApiProperty({ description: '约束数量' })
  numConstraints: number;

  @ApiPropertyOptional({ description: '参考点' })
  refPoint?: number[] | null;

  @ApiProperty({ description: '元信息' })
  metaInfo: TaskMetaInfo;

  @ApiProperty({ description: '全局开始时间' })
  globalStartTime: string;

  @ApiProperty({ description: '观察记录总数' })
  observationCount: number;

  @ApiPropertyOptional({ description: '最佳配置' })
  bestConfig?: BestConfigResponseDto;
}

export class QueryObservationsDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ description: '最小目标值过滤' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minObjective?: number;

  @ApiPropertyOptional({ description: '最大目标值过滤' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxObjective?: number;

  @ApiPropertyOptional({ description: '是否只返回最佳配置' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  bestOnly?: boolean;

  @ApiPropertyOptional({ description: '排序字段（objective/elapsedTime/createTime）' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: '排序方向（asc/desc）', enum: ['asc', 'desc'] })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class TrendDataPointDto {
  @ApiProperty({ description: '迭代次数' })
  iteration: number;

  @ApiProperty({ description: '目标值' })
  objective: number;

  @ApiProperty({ description: '累积最佳目标值' })
  bestObjective: number;

  @ApiProperty({ description: '观察记录索引' })
  observationIndex: number;
}

export class TrendResponseDto {
  @ApiProperty({ description: '趋势数据点', type: [TrendDataPointDto] })
  data: TrendDataPointDto[];

  @ApiProperty({ description: '总迭代次数' })
  totalIterations: number;

  @ApiProperty({ description: '最佳目标值' })
  bestObjective: number;

  @ApiProperty({ description: '平均目标值' })
  averageObjective: number;
}

export class ParameterImportanceDto {
  @ApiProperty({ description: '参数名称' })
  parameterName: string;

  @ApiProperty({ description: '重要性分数' })
  importance: number;

  @ApiProperty({ description: '参数类型' })
  parameterType: string;

  @ApiPropertyOptional({ description: '参数范围' })
  range?: {
    min: number;
    max: number;
    default: number;
  };
}

export class ParameterImportanceResponseDto {
  @ApiProperty({ description: '参数重要性列表', type: [ParameterImportanceDto] })
  parameters: ParameterImportanceDto[];

  @ApiProperty({ description: '分析方法' })
  method: string;
}

export class CompareTasksDto {
  @ApiProperty({
    description: '要对比的任务ID列表',
    type: [String],
    minItems: 2,
  })
  @IsArray()
  @IsString({ each: true })
  taskIds: string[];

  @ApiPropertyOptional({ description: '对比指标（objective/elapsedTime等）' })
  @IsString()
  @IsOptional()
  metric?: string;
}

export class TaskComparisonDto {
  @ApiProperty({ description: '任务ID' })
  taskId: string;

  @ApiProperty({ description: '最佳目标值' })
  bestObjective: number;

  @ApiProperty({ description: '平均目标值' })
  averageObjective: number;

  @ApiProperty({ description: '观察记录数量' })
  observationCount: number;

  @ApiProperty({ description: '总耗时（秒）' })
  totalElapsedTime: number;

  @ApiPropertyOptional({ description: '最佳配置' })
  bestConfig?: Config;
}

export class CompareTasksResponseDto {
  @ApiProperty({ description: '对比结果', type: [TaskComparisonDto] })
  comparisons: TaskComparisonDto[];

  @ApiProperty({ description: '对比指标' })
  metric: string;

  @ApiProperty({ description: '最佳任务ID' })
  bestTaskId: string;
}

