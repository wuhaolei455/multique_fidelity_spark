import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IResultService } from './interfaces/result.interface';
import {
  TaskResult,
  TaskResultResponseDto,
  ObservationResponseDto,
  QueryObservationsDto,
  BestConfigResponseDto,
  TrendResponseDto,
  ParameterImportanceResponseDto,
  CompareTasksDto,
  CompareTasksResponseDto,
  Config,
} from './dto/result.dto';
import { PaginatedResponse } from '../common/types/base.types';

@Injectable()
export class ResultService implements IResultService {
  private readonly resultsDir: string;

  constructor() {
    // 使用项目根目录的 results 目录
    const backendDir = process.cwd();
    this.resultsDir = path.resolve(backendDir, '..', 'results');
    
    // 确保目录存在
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async getTaskResult(taskId: string): Promise<TaskResultResponseDto> {
    const taskResult = await this.loadTaskResult(taskId);
    
    return {
      taskId: taskResult.task_id,
      numObjectives: taskResult.num_objectives,
      numConstraints: taskResult.num_constraints,
      refPoint: taskResult.ref_point,
      metaInfo: taskResult.meta_info,
      globalStartTime: taskResult.global_start_time || this.getTaskCreatedAt(taskResult).toISOString(),
      observationCount: taskResult.observations.length,
      bestObjective: this.calculateBestObjective(taskResult.observations),
      averageObjective: this.calculateAverageObjective(taskResult.observations),
    };
  }

  async getObservations(
    taskId: string,
    query: QueryObservationsDto,
  ): Promise<PaginatedResponse<ObservationResponseDto>> {
    const taskResult = await this.loadTaskResult(taskId);
    let observations = taskResult.observations || [];

    // 过滤
    if (query.minObjective !== undefined) {
      observations = observations.filter((obs) => obs.objectives[0] >= query.minObjective!);
    }
    if (query.maxObjective !== undefined) {
      observations = observations.filter((obs) => obs.objectives[0] <= query.maxObjective!);
    }

    // 排序
    if (query.sortBy === 'objective') {
      observations.sort((a, b) => {
        const diff = a.objectives[0] - b.objectives[0];
        return query.sortOrder === 'desc' ? -diff : diff;
      });
    } else if (query.sortBy === 'elapsed_time') {
      observations.sort((a, b) => {
        const diff = a.elapsed_time - b.elapsed_time;
        return query.sortOrder === 'desc' ? -diff : diff;
      });
    }

    // 分页
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const total = observations.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const paginatedObservations = observations.slice(start, end).map((obs, index) => ({
      index: start + index,
      config: obs.config,
      objectives: obs.objectives,
      constraints: obs.constraints,
      trialState: obs.trial_state,
      elapsedTime: obs.elapsed_time,
      createTime: obs.create_time,
      extraInfo: obs.extra_info,
    }));

    return {
      items: paginatedObservations,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getObservation(taskId: string, observationIndex: number): Promise<ObservationResponseDto> {
    const taskResult = await this.loadTaskResult(taskId);
    
    if (observationIndex < 0 || observationIndex >= taskResult.observations.length) {
      throw new NotFoundException(
        `Observation index ${observationIndex} not found for task ${taskId}`,
      );
    }

    const obs = taskResult.observations[observationIndex];
    return {
      index: observationIndex,
      config: obs.config,
      objectives: obs.objectives,
      constraints: obs.constraints,
      trialState: obs.trial_state,
      elapsedTime: obs.elapsed_time,
      createTime: obs.create_time,
      extraInfo: obs.extra_info,
    };
  }

  async getBestConfig(taskId: string): Promise<BestConfigResponseDto> {
    const taskResult = await this.loadTaskResult(taskId);
    
    if (!taskResult.observations || taskResult.observations.length === 0) {
      throw new NotFoundException(`No observations found for task ${taskId}`);
    }

    // 找到最佳配置（假设目标是最小化）
    let bestIndex = 0;
    let bestObjective = taskResult.observations[0].objectives[0];

    taskResult.observations.forEach((obs, index) => {
      if (obs.objectives[0] < bestObjective) {
        bestObjective = obs.objectives[0];
        bestIndex = index;
      }
    });

    const bestObs = taskResult.observations[bestIndex];
    
    return {
      config: bestObs.config,
      bestObjective: bestObjective,
      iterId: bestIndex,
      observationIndex: bestIndex,
      createTime: bestObs.create_time,
    };
  }

  async getTrend(taskId: string): Promise<TrendResponseDto> {
    const taskResult = await this.loadTaskResult(taskId);
    
    const data: any[] = [];
    let currentBest = Infinity;

    taskResult.observations.forEach((obs, index) => {
      currentBest = Math.min(currentBest, obs.objectives[0]);
      data.push({
        iteration: index,
        objective: obs.objectives[0],
        bestObjective: currentBest,
        elapsedTime: obs.elapsed_time,
      });
    });

    return {
      data,
      totalIterations: taskResult.observations.length,
      bestObjective: currentBest,
      averageObjective: this.calculateAverageObjective(taskResult.observations),
    };
  }

  async getParameterImportance(taskId: string): Promise<ParameterImportanceResponseDto> {
    const taskResult = await this.loadTaskResult(taskId);
    
    // 简单的参数重要性分析：计算每个参数值变化对目标函数的影响
    const parameterImportance: Record<string, number> = {};
    const parameterStats: Record<string, { values: number[]; objectives: number[] }> = {};

    // 收集数据
    taskResult.observations.forEach((obs) => {
      Object.entries(obs.config).forEach(([param, value]) => {
        if (!parameterStats[param]) {
          parameterStats[param] = { values: [], objectives: [] };
        }
        parameterStats[param].values.push(value as number);
        parameterStats[param].objectives.push(obs.objectives[0]);
      });
    });

    // 计算相关系数作为重要性度量
    Object.entries(parameterStats).forEach(([param, stats]) => {
      const correlation = this.calculateCorrelation(stats.values, stats.objectives);
      parameterImportance[param] = Math.abs(correlation);
    });

    // 排序
    const sortedParams = Object.entries(parameterImportance)
      .sort((a, b) => b[1] - a[1])
      .map(([name, importance]) => ({ 
        parameterName: name, 
        importance,
        parameterType: 'numeric',  // 简化处理
      }));

    return {
      parameters: sortedParams,
      method: 'correlation',
    };
  }

  async compareTasks(compareDto: CompareTasksDto): Promise<CompareTasksResponseDto> {
    const taskResults = await Promise.all(
      compareDto.taskIds.map((id) => this.loadTaskResult(id)),
    );

    const comparisons = taskResults.map((result) => {
      const bestObjective = this.calculateBestObjective(result.observations);
      const averageObjective = this.calculateAverageObjective(result.observations);
      const totalElapsedTime = result.observations.reduce(
        (sum, obs) => sum + obs.elapsed_time,
        0,
      );

      return {
        taskId: result.task_id,
        observationCount: result.observations.length,
        bestObjective,
        averageObjective,
        totalElapsedTime,
        status: 'completed' as const,
      };
    });

    // 找到最佳任务
    const bestTaskId = comparisons.reduce((best, current) => 
      current.bestObjective < best.bestObjective ? current : best
    ).taskId;

    return {
      comparisons,
      metric: compareDto.metric || 'objective',
      bestTaskId,
    };
  }

  async loadFromFile(filePath: string): Promise<TaskResult> {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const taskResult = JSON.parse(content) as TaskResult;
    return taskResult;
  }

  async getTaskSummary(taskId: string): Promise<{
    taskId: string;
    observationCount: number;
    bestObjective: number;
    averageObjective: number;
    totalElapsedTime: number;
    status: 'running' | 'completed' | 'failed';
  }> {
    const taskResult = await this.loadTaskResult(taskId);
    
    return {
      taskId: taskResult.task_id,
      observationCount: taskResult.observations.length,
      bestObjective: this.calculateBestObjective(taskResult.observations),
      averageObjective: this.calculateAverageObjective(taskResult.observations),
      totalElapsedTime: taskResult.observations.reduce((sum, obs) => sum + obs.elapsed_time, 0),
      status: 'completed', // 可以根据实际情况判断
    };
  }

  async validateConfigForTask(taskId: string, config: Config): Promise<boolean> {
    const taskResult = await this.loadTaskResult(taskId);
    
    if (!taskResult.meta_info || !taskResult.meta_info.space) {
      return false;
    }

    const spaceHyperparams = taskResult.meta_info.space.original.hyperparameters;
    
    // 验证所有配置参数是否在空间定义范围内
    for (const [paramName, paramValue] of Object.entries(config)) {
      const hyperparam = spaceHyperparams.find((h) => h.name === paramName);
      
      if (!hyperparam) {
        return false;
      }

      if (typeof paramValue === 'number') {
        if (paramValue < hyperparam.lower || paramValue > hyperparam.upper) {
          return false;
        }
      }
    }

    return true;
  }

  async getAllTasks(): Promise<any[]> {
    const results: any[] = [];

    const scanDirectory = (dir: string, relativePath: string = '') => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath, path.join(relativePath, item));
        } else if (item.endsWith('.json')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const data = JSON.parse(content) as TaskResult;
            
            if (data.task_id) {
              const bestObjective = this.calculateBestObjective(data.observations || []);
              const averageObjective = this.calculateAverageObjective(data.observations || []);
              
              // 找到最佳配置
              let bestConfig = null;
              if (data.observations && data.observations.length > 0) {
                let bestIndex = 0;
                let minObjective = data.observations[0].objectives[0];
                
                data.observations.forEach((obs, index) => {
                  if (obs.objectives[0] < minObjective) {
                    minObjective = obs.objectives[0];
                    bestIndex = index;
                  }
                });
                
                bestConfig = {
                  config: data.observations[bestIndex].config,
                  bestObjective: minObjective,
                };
              }
              
                 results.push({
                   taskId: data.task_id,
                   fileName: item,
                   filePath: path.join(relativePath, item),
                   observationCount: data.observations ? data.observations.length : 0,
                   bestObjective,
                   averageObjective,
                   numObjectives: data.num_objectives,
                   numConstraints: data.num_constraints,
                   createdAt: data.observations && data.observations.length > 0 
                     ? data.observations[0].create_time 
                     : stat.birthtime.toISOString(),
                   updatedAt: data.observations && data.observations.length > 0
                     ? data.observations[data.observations.length - 1].create_time
                     : stat.mtime.toISOString(),
                   meta_info: data.meta_info,
                   observations: data.observations || [],
                   bestConfig,  // 添加最佳配置
                 });
            }
          } catch (error) {
            console.error(`Failed to parse ${fullPath}:`, error);
          }
        }
      }
    };

    scanDirectory(this.resultsDir);
    
    // 按创建时间倒序排序
    return results.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // 私有辅助方法

  private async loadTaskResult(taskId: string): Promise<TaskResult> {
    const filePath = await this.findTaskFile(taskId);
    
    if (!filePath) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    return await this.loadFromFile(filePath);
  }

  private async findTaskFile(taskId: string): Promise<string | null> {
    const findFile = (dir: string): string | null => {
      if (!fs.existsSync(dir)) {
        return null;
      }

      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const found = findFile(fullPath);
          if (found) return found;
        } else if (item.endsWith('.json')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const data = JSON.parse(content);
          if (data.task_id === taskId) {
            return fullPath;
          }
        }
      }

      return null;
    };

    return findFile(this.resultsDir);
  }

  private calculateBestObjective(observations: any[]): number {
    if (!observations || observations.length === 0) {
      return Infinity;
    }
    return Math.min(...observations.map((obs) => obs.objectives[0]));
  }

  private calculateAverageObjective(observations: any[]): number {
    if (!observations || observations.length === 0) {
      return 0;
    }
    const sum = observations.reduce((acc, obs) => acc + obs.objectives[0], 0);
    return sum / observations.length;
  }

  private getTaskCreatedAt(taskResult: TaskResult): Date {
    if (taskResult.observations && taskResult.observations.length > 0) {
      return new Date(taskResult.observations[0].create_time);
    }
    return new Date();
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }
}
