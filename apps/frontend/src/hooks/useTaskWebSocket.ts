import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

interface UseTaskWebSocketOptions {
  autoConnect?: boolean;
  onLog?: (message: TaskLogMessage) => void;
  onStatus?: (message: TaskStatusMessage) => void;
  onStatusBroadcast?: (message: TaskStatusMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export const useTaskWebSocket = (options: UseTaskWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    onLog,
    onStatus,
    onStatusBroadcast,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [subscribedTasks, setSubscribedTasks] = useState<Set<string>>(new Set());

  // 连接到 WebSocket 服务器
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('WebSocket 已连接');
      return;
    }

    const backendUrl = process.env.REACT_APP_API_URL || undefined;
    console.log('连接到 WebSocket 服务器:', backendUrl || 'current host');

    const socket = io(backendUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      forceNew: false,
    });

    socket.on('connect', () => {
      console.log('WebSocket 连接成功:', socket.id);
      setIsConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket 断开连接:', reason);
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connection-success', (data) => {
      console.log('连接确认:', data);
    });

    socket.on('task-log', (message: TaskLogMessage) => {
      console.log('收到任务日志:', message);
      onLog?.(message);
    });

    socket.on('task-status', (message: TaskStatusMessage) => {
      console.log('收到任务状态更新:', message);
      onStatus?.(message);
    });

    socket.on('task-status-broadcast', (message: TaskStatusMessage) => {
      console.log('收到任务状态广播:', message);
      onStatusBroadcast?.(message);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket 连接错误:', error);
      onError?.(error);
    });

    socket.on('error', (error) => {
      console.error('WebSocket 错误:', error);
      onError?.(error);
    });

    socketRef.current = socket;
  }, [onLog, onStatus, onStatusBroadcast, onConnect, onDisconnect, onError]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('断开 WebSocket 连接');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setSubscribedTasks(new Set());
    }
  }, []);

  // 订阅任务
  const subscribeTask = useCallback((taskId: string) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket 未连接，无法订阅任务:', taskId);
      return;
    }

    setSubscribedTasks((prev) => {
      if (prev.has(taskId)) {
        console.log('已订阅任务:', taskId);
        return prev;
      }

      console.log('订阅任务:', taskId);
      socketRef.current?.emit('subscribe-task', { taskId });
      
      socketRef.current?.once('subscribe-success', (data) => {
        console.log('订阅成功:', data);
      });

      return new Set(prev).add(taskId);
    });
  }, []);

  // 取消订阅任务
  const unsubscribeTask = useCallback((taskId: string) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket 未连接，无法取消订阅任务:', taskId);
      return;
    }

    setSubscribedTasks((prev) => {
      if (!prev.has(taskId)) {
        console.log('未订阅任务:', taskId);
        return prev;
      }

      console.log('取消订阅任务:', taskId);
      socketRef.current?.emit('unsubscribe-task', { taskId });
      
      socketRef.current?.once('unsubscribe-success', (data) => {
        console.log('取消订阅成功:', data);
      });

      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  }, []);

  // 自动连接
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]); // 只依赖 autoConnect，避免重复连接

  return {
    isConnected,
    subscribedTasks: Array.from(subscribedTasks),
    connect,
    disconnect,
    subscribeTask,
    unsubscribeTask,
  };
};

