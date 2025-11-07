import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ParameterValue,
  HyperparameterDistributionType,
} from '../../common/types/base.types';

export interface ParameterDefinition {
  type: 'integer' | 'float';
  min: number;
  max: number;
  default: number;
}

export interface HyperparameterDefinition {
  name: string;
  type: HyperparameterDistributionType;
  log: boolean;
  lower: number;
  upper: number;
  default: number;
  choices?: any[];
}

export type ConfigSpaceJson = Record<string, ParameterDefinition>;

export interface ConfigSpaceDefinition {
  original: {
    hyperparameters: HyperparameterDefinition[];
  };
}

export class CreateConfigSpaceDto {
  @ApiProperty({ description: '配置空间名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '配置空间描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '配置空间定义（JSON格式），如果不提供则使用默认配置空间',
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['integer', 'float'] },
        min: { type: 'number' },
        max: { type: 'number' },
        default: { type: 'number' },
      },
    },
  })
  @IsObject()
  @IsOptional()
  space?: ConfigSpaceJson;

  @ApiPropertyOptional({ description: '是否为预设配置空间' })
  @IsBoolean()
  @IsOptional()
  isPreset?: boolean;
}

export class UpdateConfigSpaceDto {
  @ApiPropertyOptional({ description: '配置空间名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '配置空间描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '配置空间定义（JSON格式）',
    type: 'object',
  })
  @IsObject()
  @IsOptional()
  space?: ConfigSpaceJson;
}

export class ConfigSpaceResponseDto {
  @ApiProperty({ description: '配置空间ID' })
  id: string;

  @ApiProperty({ description: '配置空间名称' })
  name: string;

  @ApiPropertyOptional({ description: '配置空间描述' })
  description?: string;

  @ApiProperty({
    description: '配置空间定义',
    type: 'object',
  })
  space: ConfigSpaceJson;

  @ApiProperty({ description: '是否为预设配置空间' })
  isPreset: boolean;

  @ApiProperty({ description: '参数数量' })
  parameterCount: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class QueryConfigSpaceDto {
  @ApiPropertyOptional({ description: '搜索关键词（名称或描述）' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: '是否只查询预设配置空间' })
  @IsBoolean()
  @IsOptional()
  isPreset?: boolean;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;
}

export class ValidateConfigDto {
  @ApiProperty({
    description: '配置参数对象',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  config: Record<string, ParameterValue>;

  @ApiPropertyOptional({ description: '配置空间ID，用于验证参数是否符合空间定义' })
  @IsString()
  @IsOptional()
  spaceId?: string;
}

export class ValidateConfigResponseDto {
  @ApiProperty({ description: '验证是否通过' })
  valid: boolean;

  @ApiPropertyOptional({ description: '验证错误信息' })
  errors?: string[];

  @ApiPropertyOptional({ description: '警告信息' })
  warnings?: string[];
}

