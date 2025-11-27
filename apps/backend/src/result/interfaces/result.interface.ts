import {
  TaskResult,
  BestConfigResponseDto,
  TaskResultResponseDto,
  ObservationResponseDto,
  QueryObservationsDto,
  TrendResponseDto,
  ParameterImportanceResponseDto,
  CompareTasksDto,
  CompareTasksResponseDto,
  Config,
} from '../dto/result.dto';
import { PaginatedResponse } from '../../common/types/base.types';

export interface IResultService {
  getTaskResult(taskId: string): Promise<TaskResultResponseDto>;
  getObservations(
    taskId: string,
    query: QueryObservationsDto,
  ): Promise<PaginatedResponse<ObservationResponseDto>>;
  getObservation(taskId: string, observationIndex: number): Promise<ObservationResponseDto>;
  getBestConfig(taskId: string): Promise<BestConfigResponseDto>;
  getTrend(taskId: string): Promise<TrendResponseDto>;
  getParameterImportance(taskId: string): Promise<ParameterImportanceResponseDto>;
  compareTasks(compareDto: CompareTasksDto): Promise<CompareTasksResponseDto>;
  loadFromFile(filePath: string): Promise<TaskResult>;
  getTaskSummary(taskId: string): Promise<{
    taskId: string;
    observationCount: number;
    bestObjective: number;
    averageObjective: number;
    totalElapsedTime: number;
    status: 'running' | 'completed' | 'failed';
  }>;
  validateConfigForTask(taskId: string, config: Config): Promise<boolean>;
}

