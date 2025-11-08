import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { CreateTaskDto, CreateTaskResponseDto, TaskStatusDto } from './dto/task.dto';
import { Task, TaskProcess } from './interfaces/task.interface';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private readonly projectRoot: string;
  private readonly configSpaceDir: string;
  private readonly evaluatorDir: string;
  private readonly tasksDir: string;
  private readonly runningTasks: Map<string, TaskProcess> = new Map();

  constructor() {
    // 项目根目录（backend 的上一级）
    this.projectRoot = path.resolve(__dirname, '..', '..', '..');
    this.configSpaceDir = path.join(this.projectRoot, 'configs', 'space');
    this.evaluatorDir = path.join(this.projectRoot, 'configs', 'evaluator');
    this.tasksDir = path.join(this.projectRoot, 'results', 'tasks');

    // 确保目录存在
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.configSpaceDir, this.evaluatorDir, this.tasksDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created directory: ${dir}`);
      }
    });
  }

  async createTask(createTaskDto: CreateTaskDto): Promise<CreateTaskResponseDto> {
    const taskId = this.generateTaskId(createTaskDto.name);
    const timestamp = new Date().toISOString();

    try {
      // 1. 保存配置空间文件
      const configSpaceFileName = createTaskDto.configSpaceFileName || `${taskId}_config_space.json`;
      const configSpacePath = path.join(this.configSpaceDir, configSpaceFileName);
      
      // 验证配置空间是否为有效的 JSON
      try {
        JSON.parse(createTaskDto.configSpace);
      } catch (error) {
        throw new BadRequestException('配置空间必须是有效的 JSON 格式');
      }
      
      fs.writeFileSync(configSpacePath, createTaskDto.configSpace, 'utf-8');
      this.logger.log(`Config space saved to: ${configSpacePath}`);

      // 2. 保存可执行脚本
      const scriptFileName = createTaskDto.scriptFileName || `${taskId}_evaluator.sh`;
      const scriptPath = path.join(this.evaluatorDir, scriptFileName);
      fs.writeFileSync(scriptPath, createTaskDto.evaluatorScript, 'utf-8');
      
      // 设置脚本为可执行
      fs.chmodSync(scriptPath, '755');
      this.logger.log(`Evaluator script saved to: ${scriptPath}`);

      // 3. 创建任务元数据
      const task: Task = {
        id: taskId,
        name: createTaskDto.name,
        description: createTaskDto.description,
        configSpacePath,
        scriptPath,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const taskMetaPath = path.join(this.tasksDir, `${taskId}_meta.json`);
      fs.writeFileSync(taskMetaPath, JSON.stringify(task, null, 2), 'utf-8');
      this.logger.log(`Task metadata saved to: ${taskMetaPath}`);

      // 4. 启动 start.sh
      const processId = await this.startTask(taskId);

      // 5. 更新任务状态
      task.status = 'running';
      task.processId = processId;
      task.updatedAt = new Date();
      fs.writeFileSync(taskMetaPath, JSON.stringify(task, null, 2), 'utf-8');

      return {
        taskId,
        createdAt: timestamp,
        status: 'running',
        configSpacePath,
        scriptPath,
        processId,
      };
    } catch (error) {
      this.logger.error(`Failed to create task: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async startTask(taskId: string): Promise<number> {
    const startScriptPath = path.join(this.projectRoot, 'start.sh');

    if (!fs.existsSync(startScriptPath)) {
      throw new NotFoundException(`启动脚本不存在: ${startScriptPath}`);
    }

    return new Promise((resolve, reject) => {
      try {
        // 启动 start.sh
        const process = spawn('bash', [startScriptPath], {
          cwd: this.projectRoot,
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        const pid = process.pid;
        this.logger.log(`Started task ${taskId} with PID: ${pid}`);

        // 保存进程信息
        this.runningTasks.set(taskId, {
          taskId,
          processId: pid,
          isRunning: true,
        });

        // 创建日志文件
        const logDir = path.join(this.tasksDir, taskId);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        const stdoutPath = path.join(logDir, 'stdout.log');
        const stderrPath = path.join(logDir, 'stderr.log');
        const stdoutStream = fs.createWriteStream(stdoutPath, { flags: 'a' });
        const stderrStream = fs.createWriteStream(stderrPath, { flags: 'a' });

        process.stdout.pipe(stdoutStream);
        process.stderr.pipe(stderrStream);

        // 监听进程退出
        process.on('exit', (code, signal) => {
          this.logger.log(`Task ${taskId} exited with code ${code}, signal ${signal}`);
          this.runningTasks.delete(taskId);
          this.updateTaskStatus(taskId, code === 0 ? 'completed' : 'failed', code !== 0 ? `Exit code: ${code}` : undefined);
          stdoutStream.end();
          stderrStream.end();
        });

        process.on('error', (error) => {
          this.logger.error(`Task ${taskId} error: ${error.message}`);
          this.runningTasks.delete(taskId);
          this.updateTaskStatus(taskId, 'failed', error.message);
          stdoutStream.end();
          stderrStream.end();
          reject(error);
        });

        // 等待进程启动
        setTimeout(() => {
          resolve(pid);
        }, 100);
      } catch (error) {
        this.logger.error(`Failed to start task ${taskId}: ${error.message}`);
        reject(error);
      }
    });
  }

  private updateTaskStatus(taskId: string, status: Task['status'], error?: string) {
    const taskMetaPath = path.join(this.tasksDir, `${taskId}_meta.json`);
    
    if (fs.existsSync(taskMetaPath)) {
      const task: Task = JSON.parse(fs.readFileSync(taskMetaPath, 'utf-8'));
      task.status = status;
      task.updatedAt = new Date();
      if (error) {
        task.error = error;
      }
      fs.writeFileSync(taskMetaPath, JSON.stringify(task, null, 2), 'utf-8');
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatusDto> {
    const taskMetaPath = path.join(this.tasksDir, `${taskId}_meta.json`);

    if (!fs.existsSync(taskMetaPath)) {
      throw new NotFoundException(`任务不存在: ${taskId}`);
    }

    const task: Task = JSON.parse(fs.readFileSync(taskMetaPath, 'utf-8'));
    const taskProcess = this.runningTasks.get(taskId);

    return {
      taskId: task.id,
      status: task.status,
      processId: task.processId,
      isRunning: taskProcess?.isRunning || false,
      error: task.error,
    };
  }

  async listTasks(): Promise<Task[]> {
    const tasks: Task[] = [];

    if (!fs.existsSync(this.tasksDir)) {
      return tasks;
    }

    const files = fs.readdirSync(this.tasksDir);
    
    for (const file of files) {
      if (file.endsWith('_meta.json')) {
        const filePath = path.join(this.tasksDir, file);
        try {
          const task: Task = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          tasks.push(task);
        } catch (error) {
          this.logger.error(`Failed to read task metadata: ${file}`, error);
        }
      }
    }

    // 按创建时间倒序排序
    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private generateTaskId(name: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${safeName}_${timestamp}`;
  }
}

