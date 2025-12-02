import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TaskService } from './task.service';
import {
  CreateTaskDto,
  CreateTaskResponseDto,
  TaskStatusDto,
  LaunchFrameworkTaskDto,
} from './dto/task.dto';
import { Task } from './interfaces/task.interface';

@ApiTags('tasks')
@Controller('api/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建任务 (包含文件上传, 但不自动启动)' })
  @ApiResponse({
    status: 201,
    description: '任务创建成功',
    type: CreateTaskResponseDto,
  })
  async create(@Body() launchDto: LaunchFrameworkTaskDto): Promise<CreateTaskResponseDto> {
    return this.taskService.launchFrameworkTask(launchDto);
  }

  @Post(':taskId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '启动已创建的任务' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({
    status: 200,
    description: '任务启动成功',
  })
  async startTask(@Param('taskId') taskId: string): Promise<void> {
    await this.taskService.startTask(taskId);
  }

  @Get('list')
  @ApiOperation({ summary: '获取所有任务列表' })
  @ApiResponse({
    status: 200,
    description: '返回所有任务列表',
    type: [Object],
  })
  async listTasks(): Promise<Task[]> {
    return this.taskService.listTasks();
  }

  @Get(':taskId/status')
  @ApiOperation({ summary: '获取任务状态' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({
    status: 200,
    description: '返回任务状态',
    type: TaskStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: '任务不存在',
  })
  async getTaskStatus(@Param('taskId') taskId: string): Promise<TaskStatusDto> {
    return this.taskService.getTaskStatus(taskId);
  }
}

