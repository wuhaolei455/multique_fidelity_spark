import {
  IsString,
  IsNotEmpty,
  IsOptional,
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

