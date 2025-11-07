import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ResultService } from './result.service';
import {
  TaskResultResponseDto,
  ObservationResponseDto,
  QueryObservationsDto,
  BestConfigResponseDto,
  TrendResponseDto,
  ParameterImportanceResponseDto,
  CompareTasksDto,
  CompareTasksResponseDto,
} from './dto/result.dto';
import { PaginatedResponse } from '../common/types/base.types';

@ApiTags('results')
@Controller('api/results')
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '对比多个结果' })
  @ApiResponse({
    status: 200,
    description: '返回结果对比',
    type: CompareTasksResponseDto,
  })
  async compareResults(@Body() compareDto: CompareTasksDto): Promise<CompareTasksResponseDto> {
    return this.resultService.compareTasks(compareDto);
  }

       @Get('list')
       @ApiOperation({ summary: '获取所有结果列表' })
       @ApiResponse({
         status: 200,
         description: '返回所有结果的详细信息列表，包括完整的 meta_info 和 observations',
         schema: {
           type: 'array',
           items: {
             type: 'object',
             properties: {
               taskId: { type: 'string', description: '任务ID' },
               fileName: { type: 'string', description: '文件名' },
               filePath: { type: 'string', description: '文件路径' },
               observationCount: { type: 'number', description: '观察记录数' },
               bestObjective: { type: 'number', description: '最佳目标值' },
               averageObjective: { type: 'number', description: '平均目标值' },
               numObjectives: { type: 'number', description: '目标数量' },
               numConstraints: { type: 'number', description: '约束数量' },
               createdAt: { type: 'string', description: '创建时间' },
               updatedAt: { type: 'string', description: '更新时间' },
               meta_info: { 
                 type: 'object', 
                 description: '任务元信息，包含 meta_feature, random, space, warm_start 等' 
               },
               observations: { 
                 type: 'array', 
                 description: '完整的观察记录数组',
                 items: {
                   type: 'object',
                   properties: {
                     config: { type: 'object', description: '配置参数' },
                     objectives: { type: 'array', items: { type: 'number' }, description: '目标值' },
                     constraints: { type: 'array', items: { type: 'number' }, description: '约束值' },
                     trial_state: { type: 'number', description: '试验状态' },
                     elapsed_time: { type: 'number', description: '耗时' },
                     create_time: { type: 'string', description: '创建时间' },
                     extra_info: { type: 'object', description: '额外信息' },
                   },
                 },
               },
             },
           },
         },
       })
       async getAllResults(): Promise<any[]> {
         return this.resultService.getAllTasks();
       }

  @Get(':resultId/summary')
  @ApiOperation({ summary: '获取结果状态摘要' })
  @ApiParam({ name: 'resultId', description: '结果ID' })
  @ApiResponse({
    status: 200,
    description: '返回结果状态摘要',
  })
  async getResultSummary(@Param('resultId') resultId: string) {
    return this.resultService.getTaskSummary(resultId);
  }

  @Get(':resultId/observations')
  @ApiOperation({ summary: '获取观察记录列表' })
  @ApiParam({ name: 'resultId', description: '结果ID' })
  @ApiResponse({
    status: 200,
    description: '返回观察记录列表',
    type: ObservationResponseDto,
    isArray: true,
  })
  async getObservations(
    @Param('resultId') resultId: string,
    @Query() query: QueryObservationsDto,
  ): Promise<PaginatedResponse<ObservationResponseDto>> {
    return this.resultService.getObservations(resultId, query);
  }

  @Get(':resultId/observations/:index')
  @ApiOperation({ summary: '获取单个观察记录' })
  @ApiParam({ name: 'resultId', description: '结果ID' })
  @ApiParam({ name: 'index', description: '观察记录索引' })
  @ApiResponse({
    status: 200,
    description: '返回观察记录详情',
    type: ObservationResponseDto,
  })
  async getObservation(
    @Param('resultId') resultId: string,
    @Param('index') index: number,
  ): Promise<ObservationResponseDto> {
    return this.resultService.getObservation(resultId, Number(index));
  }

  @Get(':resultId/best-config')
  @ApiOperation({ summary: '获取最佳配置' })
  @ApiParam({ name: 'resultId', description: '结果ID' })
  @ApiResponse({
    status: 200,
    description: '返回最佳配置',
    type: BestConfigResponseDto,
  })
  async getBestConfig(@Param('resultId') resultId: string): Promise<BestConfigResponseDto> {
    return this.resultService.getBestConfig(resultId);
  }

  @Get(':resultId/trend')
  @ApiOperation({ summary: '获取性能趋势数据' })
  @ApiParam({ name: 'resultId', description: '结果ID' })
  @ApiResponse({
    status: 200,
    description: '返回性能趋势数据',
    type: TrendResponseDto,
  })
  async getTrend(@Param('resultId') resultId: string): Promise<TrendResponseDto> {
    return this.resultService.getTrend(resultId);
  }

  @Get(':resultId/parameter-importance')
  @ApiOperation({ summary: '获取参数重要性分析' })
  @ApiParam({ name: 'resultId', description: '结果ID' })
  @ApiResponse({
    status: 200,
    description: '返回参数重要性分析结果',
    type: ParameterImportanceResponseDto,
  })
  async getParameterImportance(
    @Param('resultId') resultId: string,
  ): Promise<ParameterImportanceResponseDto> {
    return this.resultService.getParameterImportance(resultId);
  }

  @Get(':resultId')
  @ApiOperation({ summary: '获取完整结果数据' })
  @ApiParam({ name: 'resultId', description: '结果ID' })
  @ApiResponse({
    status: 200,
    description: '返回完整结果',
    type: TaskResultResponseDto,
  })
  async getResult(@Param('resultId') resultId: string): Promise<TaskResultResponseDto> {
    return this.resultService.getTaskResult(resultId);
  }
}
