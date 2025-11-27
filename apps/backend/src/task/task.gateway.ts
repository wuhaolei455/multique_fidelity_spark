import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface TaskLogMessage {
  taskId: string;
  type: 'stdout' | 'stderr' | 'status';
  content: string;
  timestamp: string;
}

export interface TaskStatusMessage {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TaskGateway.name);
  private taskSubscriptions = new Map<string, Set<string>>(); // taskId -> Set of clientIds

  handleConnection(client: Socket) {
    this.logger.log(`客户端连接: ${client.id}`);
    
    client.emit('connection-success', {
      clientId: client.id,
      serverTime: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`客户端断开: ${client.id}`);
    
    // 清理订阅
    this.taskSubscriptions.forEach((clients, taskId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        this.logger.log(`客户端 ${client.id} 取消订阅任务 ${taskId}`);
        
        if (clients.size === 0) {
          this.taskSubscriptions.delete(taskId);
        }
      }
    });
  }

  @SubscribeMessage('subscribe-task')
  handleSubscribeTask(
    @MessageBody() data: { taskId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { taskId } = data;
    
    if (!this.taskSubscriptions.has(taskId)) {
      this.taskSubscriptions.set(taskId, new Set());
    }
    
    this.taskSubscriptions.get(taskId)!.add(client.id);
    this.logger.log(`客户端 ${client.id} 订阅任务 ${taskId}`);
    
    client.emit('subscribe-success', {
      taskId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('unsubscribe-task')
  handleUnsubscribeTask(
    @MessageBody() data: { taskId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { taskId } = data;
    
    if (this.taskSubscriptions.has(taskId)) {
      this.taskSubscriptions.get(taskId)!.delete(client.id);
      this.logger.log(`客户端 ${client.id} 取消订阅任务 ${taskId}`);
      
      if (this.taskSubscriptions.get(taskId)!.size === 0) {
        this.taskSubscriptions.delete(taskId);
      }
    }
    
    client.emit('unsubscribe-success', {
      taskId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 发送日志消息给订阅了该任务的所有客户端
   */
  emitTaskLog(message: TaskLogMessage): void {
    const { taskId } = message;
    
    if (this.taskSubscriptions.has(taskId)) {
      const clients = this.taskSubscriptions.get(taskId)!;
      this.logger.debug(`发送日志到 ${clients.size} 个客户端: ${message.content.substring(0, 50)}`);
      
      clients.forEach((clientId) => {
        this.server.to(clientId).emit('task-log', message);
      });
    }
  }

  /**
   * 发送任务状态更新给订阅了该任务的所有客户端
   */
  emitTaskStatus(message: TaskStatusMessage): void {
    const { taskId } = message;
    
    if (this.taskSubscriptions.has(taskId)) {
      const clients = this.taskSubscriptions.get(taskId)!;
      this.logger.log(`发送状态更新到 ${clients.size} 个客户端: ${taskId} - ${message.status}`);
      
      clients.forEach((clientId) => {
        this.server.to(clientId).emit('task-status', message);
      });
    }
    
    // 广播到所有连接的客户端（用于任务列表更新）
    this.server.emit('task-status-broadcast', message);
  }

  /**
   * 检查是否有客户端订阅了某个任务
   */
  hasSubscribers(taskId: string): boolean {
    return this.taskSubscriptions.has(taskId) && this.taskSubscriptions.get(taskId)!.size > 0;
  }

  /**
   * 获取订阅某个任务的客户端数量
   */
  getSubscriberCount(taskId: string): number {
    return this.taskSubscriptions.get(taskId)?.size || 0;
  }
}

