export interface Task {
  id: string;
  name: string;
  description?: string;
  configSpacePath?: string;
  scriptPath?: string;
  configFilePath?: string;
  historyFilePath?: string;
  dataFilePath?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  processId?: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface TaskProcess {
  taskId: string;
  processId: number;
  isRunning: boolean;
}

