import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { CreateTaskDto, CreateTaskResponseDto, TaskStatusDto, LaunchFrameworkTaskDto } from './dto/task.dto';
import { Task, TaskProcess } from './interfaces/task.interface';
import { TaskGateway } from './task.gateway';
import * as readline from 'readline';
import { FrameworkResolvedPaths } from './types/task.types';
import * as yaml from 'js-yaml';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @Inject(forwardRef(() => TaskGateway))
    private readonly taskGateway: TaskGateway,
  ) {
    this.projectRoot = path.resolve(__dirname, '..', '..', '..');
    this.logger.log(`TaskService initialized.`);
    this.logger.log(`__dirname: ${__dirname}`);
    this.logger.log(`projectRoot resolved to: ${this.projectRoot}`);
    
    this.frameworkRoot = path.join(this.projectRoot, 'libs', 'framework');
    this.logger.log(`frameworkRoot: ${this.frameworkRoot}`);
    
    this.configSpaceDir = path.join(this.projectRoot, 'configs', 'space');
    this.evaluatorDir = path.join(this.projectRoot, 'configs', 'evaluator');
    this.tasksDir = path.join(this.projectRoot, 'results', 'tasks');
    this.hollyRoot = path.join(this.projectRoot, 'holly');
    
    this.rootConfigDir = path.join(this.hollyRoot, 'config');
    this.rootHistoryDir = path.join(this.hollyRoot, 'history');
    this.rootDataDir = path.join(this.hollyRoot, 'data');
    this.rootResultDir = path.join(this.hollyRoot, 'result');

    // 确保目录存在
    this.ensureDirectories();
  }
  private readonly projectRoot: string;
  private readonly frameworkRoot: string;
  private readonly configSpaceDir: string;
  private readonly evaluatorDir: string;
  private readonly tasksDir: string;
  private readonly hollyRoot: string;
  private readonly rootConfigDir: string;
  private readonly rootHistoryDir: string;
  private readonly rootDataDir: string;
  private readonly rootResultDir: string;
  private readonly runningTasks: Map<string, TaskProcess> = new Map();

  private ensureDirectories() {
    [
      this.configSpaceDir,
      this.evaluatorDir,
      this.tasksDir,
      this.hollyRoot,
      this.rootConfigDir,
      this.rootHistoryDir,
      this.rootDataDir,
      this.rootResultDir,
      path.join(this.rootResultDir, 'log'),
    ].forEach((dir) => this.ensureDir(dir));
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Created directory: ${dir}`);
    }
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
        this.logger.error(`Invalid JSON for configSpace. Type: ${typeof createTaskDto.configSpace}, Content Preview: ${createTaskDto.configSpace?.slice(0, 100)}`);
        // 尝试再次修复，因为可能前端的修复在传输过程中失效（虽然不应该）
        // 或者是一个已经是 Object 的情况
        if (typeof createTaskDto.configSpace === 'object') {
           createTaskDto.configSpace = JSON.stringify(createTaskDto.configSpace);
        } else {
             // 再次尝试处理 Python 特有的非标准 JSON 值
            try {
                const fixed = createTaskDto.configSpace.replace(
                    /"(?:\\.|[^"\\])*"|(-?Infinity)|(NaN)/g,
                    (match) => {
                        if (match.startsWith('"')) return match;
                        return `"${match}"`;
                    }
                );
                JSON.parse(fixed);
                // 如果修复成功，更新它
                createTaskDto.configSpace = fixed;
            } catch (e) {
                 throw new BadRequestException('配置空间必须是有效的 JSON 格式');
            }
        }
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

      // 推送任务启动状态
      this.taskGateway.emitTaskStatus({
        taskId,
        status: 'running',
        message: '任务已启动',
        timestamp: new Date().toISOString(),
      });

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

  async launchFrameworkTask(launchDto: LaunchFrameworkTaskDto): Promise<CreateTaskResponseDto> {
    if (!launchDto.historyFileContent) {
      throw new BadRequestException('history_json 文件不能为空');
    }

    const taskId = this.generateTaskId(launchDto.name);
    const timestamp = new Date().toISOString();
    const taskMetaPath = path.join(this.tasksDir, `${taskId}_meta.json`);

    try {
      const resolvedPaths = this.resolveFrameworkPaths(launchDto);

      const historyFilePath =
        this.writeUploadedFile({
          baseDir: resolvedPaths.historyDir,
          defaultName: `${taskId}_history.json`,
          fileName: launchDto.historyFileName,
          content: launchDto.historyFileContent,
          validateJson: true,
        }) || path.join(resolvedPaths.historyDir, `${taskId}_history.json`);

      const dataFilePath = this.writeUploadedFile({
        baseDir: resolvedPaths.dataDir,
        defaultName: `${taskId}_data.json`,
        fileName: launchDto.dataFileName,
        content: launchDto.dataFileContent,
      });

      // Handle huge_space.json upload if provided
      let hugeSpacePath: string | undefined;
      if (launchDto.hugeSpaceFileContent) {
        // According to requirement: overwrite holly/config/space/huge_space.json
        const hollyConfigSpaceDir = path.join(this.rootConfigDir, 'space');
        hugeSpacePath = this.writeUploadedFile({
          baseDir: hollyConfigSpaceDir,
          defaultName: 'huge_space.json', // Fixed name as requested
          fileName: 'huge_space.json',    // Overwrite existing
          content: launchDto.hugeSpaceFileContent,
          validateJson: true,
        });
      }

      const configFilePath = this.generateFrameworkConfig(taskId, launchDto, resolvedPaths, hugeSpacePath);

      const task: Task = {
        id: taskId,
        name: launchDto.name,
        description: launchDto.description,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        configFilePath,
        historyFilePath,
        dataFilePath,
      };

      fs.writeFileSync(taskMetaPath, JSON.stringify(task, null, 2), 'utf-8');

      const envOverrides = this.buildFrameworkEnv(
        launchDto,
        configFilePath,
        resolvedPaths,
        historyFilePath,
        dataFilePath,
      );
      const processId = await this.startTask(taskId, {
        taskName: launchDto.name,
        env: envOverrides,
      });

      task.status = 'running';
      task.processId = processId;
      task.updatedAt = new Date();
      fs.writeFileSync(taskMetaPath, JSON.stringify(task, null, 2), 'utf-8');

      this.taskGateway.emitTaskStatus({
        taskId,
        status: 'running',
        message: '框架任务已启动',
        timestamp: new Date().toISOString(),
      });

      return {
        taskId,
        createdAt: timestamp,
        status: 'running',
        configSpacePath: configFilePath,
        scriptPath: configFilePath,
        processId,
        configFilePath,
        historyFilePath,
        dataFilePath,
      };
    } catch (error) {
      this.logger.error(`Failed to launch framework task: ${error.message}`, error.stack);
      if (fs.existsSync(taskMetaPath)) {
        fs.unlinkSync(taskMetaPath);
      }
      throw error;
    }
  }

  async startTask(
    taskId: string,
    options?: {
      taskName?: string;
      env?: Record<string, string>;
    },
  ): Promise<number> {
    const startScriptPath = path.join(this.projectRoot, 'start_framework.sh');

    if (!fs.existsSync(startScriptPath)) {
      throw new NotFoundException(`启动脚本不存在: ${startScriptPath}`);
    }

    // 从任务元数据中获取任务名称
    const taskMetaPath = path.join(this.tasksDir, `${taskId}_meta.json`);
    let taskName = options?.taskName || taskId; // 默认使用 taskId
    if (!options?.taskName && fs.existsSync(taskMetaPath)) {
      try {
        const taskMeta = JSON.parse(fs.readFileSync(taskMetaPath, 'utf-8'));
        taskName = taskMeta.name || taskId;
      } catch (error) {
        this.logger.warn(`Failed to read task name from metadata: ${error.message}`);
      }
    }

    return new Promise((resolve, reject) => {
      try {
        // 启动 start.sh，传递任务名称参数
        const env = {
          ...process.env,
          ...(options?.env ?? {}),
        };

        const child = spawn('bash', [startScriptPath, taskName], {
          cwd: this.frameworkRoot,
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          env,
        });

        const pid = child.pid;
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

        // 实时读取并推送 stdout
        const stdoutReader = readline.createInterface({
          input: child.stdout, // 读取子进程的 stdout
          terminal: false,
        });

        stdoutReader.on('line', (line) => {
          const content = line + '\n';
          stdoutStream.write(content);
          
          // 如果有客户端订阅，推送日志
          if (this.taskGateway.hasSubscribers(taskId)) {
            this.logger.debug(`推送 stdout 日志: ${content.substring(0, 50)}`);
            this.taskGateway.emitTaskLog({
              taskId,
              type: 'stdout',
              content,
              timestamp: new Date().toISOString(),
            });
          }
        });

        // 实时读取并推送 stderr
        const stderrReader = readline.createInterface({
          input: child.stderr, // 读取子进程的 stderr
          terminal: false,
        });

        stderrReader.on('line', (line) => {
          const content = line + '\n';
          stderrStream.write(content);
          
          // 如果有客户端订阅，推送日志
          if (this.taskGateway.hasSubscribers(taskId)) {
            this.logger.debug(`推送 stderr 日志: ${content.substring(0, 50)}`);
            this.taskGateway.emitTaskLog({
              taskId,
              type: 'stderr',
              content,
              timestamp: new Date().toISOString(),
            });
          }
        });

        // 监听进程退出
        child.on('exit', (code, signal) => {
          this.logger.log(`Task ${taskId} exited with code ${code}, signal ${signal}`);
          this.runningTasks.delete(taskId);
          
          const status = code === 0 ? 'completed' : 'failed';
          const errorMessage = code !== 0 ? `Exit code: ${code}` : undefined;
          
          this.updateTaskStatus(taskId, status, errorMessage);
          
          // 推送任务状态更新
          this.taskGateway.emitTaskStatus({
            taskId,
            status,
            message: errorMessage || '任务执行完成',
            timestamp: new Date().toISOString(),
          });
          
          stdoutStream.end();
          stderrStream.end();
        });

        child.on('error', (error) => {
          this.logger.error(`Task ${taskId} error: ${error.message}`);
          this.runningTasks.delete(taskId);
          this.updateTaskStatus(taskId, 'failed', error.message);
          
          // 推送任务错误状态
          this.taskGateway.emitTaskStatus({
            taskId,
            status: 'failed',
            message: error.message,
            timestamp: new Date().toISOString(),
          });
          
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

  private resolveFrameworkPaths(dto: LaunchFrameworkTaskDto): FrameworkResolvedPaths {
    const logSubDir = dto.logDir || 'log';
    const saveDir = this.appendSubDir(this.rootResultDir, dto.saveDir);
    const logDir = this.appendSubDir(this.rootResultDir, logSubDir);
    const dataDir = this.appendSubDir(this.rootDataDir, dto.dataDir);
    const historyDir = this.appendSubDir(this.rootHistoryDir, dto.historyDir);
    return {
      logDir,
      dataDir,
      historyDir,
      saveDir,
    };
  }

  private appendSubDir(baseDir: string, override?: string): string {
    if (!override) {
      this.ensureDir(baseDir);
      return baseDir;
    }
    const sanitized = override.replace(/^[./\\]+/, '');
    const absolute = path.join(baseDir, sanitized);
    this.ensureDir(absolute);
    return absolute;
  }

  private writeUploadedFile(options: {
    baseDir: string;
    defaultName: string;
    fileName?: string;
    content?: string;
    validateJson?: boolean;
  }): string | undefined {
    const { baseDir, defaultName, fileName, content, validateJson } = options;
    if (!content) {
      return undefined;
    }
    
    // 如果需要验证 JSON，先处理内容
    let finalContent = content;

    if (validateJson) {
      try {
        JSON.parse(finalContent);
      } catch (error) {
        this.logger.warn(`JSON validation failed for ${fileName || defaultName}. Attempting to fix non-standard values (Infinity/NaN)...`);
        
        // 尝试修复非标准 JSON
        try {
           // 处理可能已经是 Object 的情况 (虽然后端 DTO 说是 string，但防御性编程)
           if (typeof finalContent === 'object') {
             finalContent = JSON.stringify(finalContent);
           } else {
             const fixed = finalContent.replace(
                /"(?:\\.|[^"\\])*"|(-?Infinity)|(NaN)/g,
                (match) => {
                    if (match.startsWith('"')) return match;
                    return `"${match}"`;
                }
             );
             JSON.parse(fixed); // 再次验证
             finalContent = fixed; // 修复成功，更新要写入的内容
           }
        } catch (fixError) {
           this.logger.error(`Failed to fix JSON for ${fileName || defaultName}: ${fixError.message}`);
           throw new BadRequestException(`${fileName || 'File'} 必须是合法的 JSON 格式`);
        }
      }
    }

    this.ensureDir(baseDir);
    const targetName = (fileName && fileName.trim()) || defaultName;
    const filePath = path.join(baseDir, targetName);

    try {
      fs.writeFileSync(filePath, finalContent, 'utf-8');
      this.logger.log(`Uploaded file saved to: ${filePath}`);
      if (!fs.existsSync(filePath)) {
         this.logger.error(`Failed to verify uploaded file creation: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to write uploaded file to ${filePath}: ${error.message}`);
      throw error;
    }
    return filePath;
  }

  private generateFrameworkConfig(
    taskId: string,
    dto: LaunchFrameworkTaskDto,
    paths: FrameworkResolvedPaths,
    hugeSpacePath?: string,
  ): string {
    const templatePath = path.join(this.frameworkRoot, 'configs', 'base.yaml');
    if (!fs.existsSync(templatePath)) {
      throw new NotFoundException(`未找到基础配置文件: ${templatePath}`);
    }

    const baseConfig = yaml.load(fs.readFileSync(templatePath, 'utf-8')) as Record<string, any>;

    // 1. Database and Threshold
    baseConfig.database = dto.database ?? baseConfig.database;
    baseConfig.similarity_threshold = dto.similarityThreshold ?? baseConfig.similarity_threshold;

    // 2. Paths
    baseConfig.paths = baseConfig.paths || {};
    // Use absolute paths to avoid resolution ambiguity in ConfigManager
    baseConfig.paths.log_dir = paths.logDir;
    baseConfig.paths.data_dir = paths.dataDir;
    baseConfig.paths.history_dir = paths.historyDir;
    baseConfig.paths.save_dir = paths.saveDir;
    baseConfig.paths.target = dto.target ?? baseConfig.paths.target;

    // 3. Method Args
    baseConfig.method_args = baseConfig.method_args || {};
    
    // Random Kwargs
    const randomArgs = baseConfig.method_args.random_kwargs || {};
    baseConfig.method_args.random_kwargs = {
      ...randomArgs,
      seed: dto.seed ?? randomArgs.seed ?? 42,
      rand_prob: dto.randProb ?? randomArgs.rand_prob ?? 0.15,
      rand_mode: dto.randMode ?? randomArgs.rand_mode ?? 'ran',
    };

    // WS Args
    const wsArgs = baseConfig.method_args.ws_args || {};
    baseConfig.method_args.ws_args = {
      ...wsArgs,
      init_num: dto.wsInitNum ?? wsArgs.init_num ?? 4,
      topk: dto.wsTopk ?? wsArgs.topk ?? 4,
      inner_surrogate_model: dto.wsInnerSurrogateModel ?? wsArgs.inner_surrogate_model ?? 'prf',
    };

    // TL Args
    const tlArgs = baseConfig.method_args.tl_args || {};
    baseConfig.method_args.tl_args = {
      ...tlArgs,
      topk: dto.tlTopk ?? tlArgs.topk ?? 3,
    };

    // CP Args
    const cpArgs = baseConfig.method_args.cp_args || {};
    baseConfig.method_args.cp_args = {
      ...cpArgs,
      strategy: dto.cpStrategy ?? cpArgs.strategy ?? 'none',
      topk: dto.cpTopk ?? cpArgs.topk ?? 40,
      sigma: dto.cpSigma ?? cpArgs.sigma ?? 2.0,
      top_ratio: dto.cpTopRatio ?? cpArgs.top_ratio ?? 0.8,
    };

    // Scheduler Args
    const schedulerArgs = baseConfig.method_args.scheduler_kwargs || {};
    baseConfig.method_args.scheduler_kwargs = {
      ...schedulerArgs,
      R: dto.schedulerR ?? schedulerArgs.R ?? 27,
      eta: dto.schedulerEta ?? schedulerArgs.eta ?? 3,
    };

    // 4. Config Spaces
    baseConfig.config_spaces = baseConfig.config_spaces || {};
    
    if (hugeSpacePath) {
      // If huge_space.json was uploaded, use its absolute path
      baseConfig.config_spaces.config_space = hugeSpacePath;
    } else if (dto.configSpacePath) {
      // If user provides a path, ensure it's relative to framework root if it's within the project
      // Or just pass as is if it's absolute. But here we assume we might need to handle it.
      // For now, let's assume dto.configSpacePath is what they want.
      // But typically, we might want to use the standard config space dir.
      baseConfig.config_spaces.config_space = dto.configSpacePath; 
    }

    if (dto.expertSpacePath) {
      baseConfig.config_spaces.expert_space = dto.expertSpacePath;
    }

    const configFilePath = path.join(this.rootConfigDir, `${taskId}.yaml`);
    this.ensureDir(path.dirname(configFilePath));
    try {
      fs.writeFileSync(configFilePath, yaml.dump(baseConfig), 'utf-8');
      this.logger.log(`Generated framework config: ${configFilePath}`);
      if (!fs.existsSync(configFilePath)) {
        this.logger.error(`Failed to verify config file creation: ${configFilePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to write config file: ${error.message}`);
      throw error;
    }
    return configFilePath;
  }

  private buildFrameworkEnv(
    dto: LaunchFrameworkTaskDto,
    configFilePath: string,
    paths: FrameworkResolvedPaths,
    historyFilePath: string,
    dataFilePath?: string,
  ): Record<string, string> {
    const env: Record<string, string> = {
      CONFIG_PATH: configFilePath,
      ITER_NUM: String(dto.iterNum ?? 10),
      HISTORY_DIR: path.dirname(historyFilePath),
      SAVE_DIR: paths.saveDir,
      LOG_DIR: paths.logDir,
      DATA_DIR: paths.dataDir,
      COMPRESS: dto.compress ?? 'shap',
      CP_TOPK: String(dto.cpTopk ?? 40),
    };

    if (dataFilePath) {
      env.DATA_FILE = dataFilePath;
    }
    return env;
  }

  private relativeToFramework(targetPath: string): string {
    const relative = path.relative(this.frameworkRoot, targetPath);
    return relative || '.';
  }

  private generateTaskId(name: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    return `${safeName}_${timestamp}`;
  }
}

