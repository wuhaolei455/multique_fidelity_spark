/**
 * 配置管理相关 API
 */

import request from '../request';
import type { ConfigSpace, Template } from '@/types';

// 后端分页响应类型
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 后端配置空间响应类型
interface BackendConfigSpaceResponse {
  id: string;
  name: string;
  description?: string;
  space: Record<string, {
    type: 'integer' | 'float';
    min: number;
    max: number;
    default: number;
  }>;
  isPreset: boolean;
  parameterCount: number;
  createdAt: string;
  updatedAt: string;
}

// 将后端格式转换为前端格式
const convertBackendToFrontend = (backend: BackendConfigSpaceResponse): ConfigSpace => {
  const parameters = Object.entries(backend.space).map(([name, def]) => ({
    name,
    type: def.type === 'integer' ? 'int' as const : 'float' as const,
    range: [def.min, def.max] as [number, number],
    default: def.default,
  }));

  return {
    id: backend.id,
    name: backend.name,
    description: backend.description,
    parameters,
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
  };
};

// 获取配置空间列表
export const getConfigSpaces = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  isPreset?: boolean;
}): Promise<ConfigSpace[]> => {
  const response = await request<PaginatedResponse<BackendConfigSpaceResponse>>({
    url: '/config-spaces',
    method: 'GET',
    params: params || { page: 1, pageSize: 100 }, // 默认获取所有
  });
  
  return response.items.map(convertBackendToFrontend);
};

// 获取配置空间详情
export const getConfigSpace = async (spaceId: string): Promise<ConfigSpace> => {
  const response = await request<BackendConfigSpaceResponse>({
    url: `/config-spaces/${spaceId}`,
    method: 'GET',
  });
  
  return convertBackendToFrontend(response);
};

// 创建配置空间 - 前端参数类型
interface CreateConfigSpaceParams {
  name: string;
  description?: string;
  parameters?: Array<{
    name: string;
    type: 'int' | 'float';
    range: [number, number];
    default: number;
  }>;
}

// 创建配置空间
export const createConfigSpace = async (data: CreateConfigSpaceParams): Promise<ConfigSpace> => {
  // 将前端格式转换为后端格式
  const backendData: any = {
    name: data.name,
    description: data.description,
  };

  // 如果提供了参数，转换为后端期望的space格式
  if (data.parameters && data.parameters.length > 0) {
    backendData.space = {};
    data.parameters.forEach(param => {
      backendData.space[param.name] = {
        type: param.type === 'int' ? 'integer' : 'float',
        min: param.range[0],
        max: param.range[1],
        default: param.default,
      };
    });
  }

  const response = await request<BackendConfigSpaceResponse>({
    url: '/config-spaces',
    method: 'POST',
    data: backendData,
  });
  
  return convertBackendToFrontend(response);
};

// 更新配置空间
export const updateConfigSpace = async (
  spaceId: string,
  data: ConfigSpace
): Promise<ConfigSpace> => {
  // 将前端格式转换为后端格式
  const backendData: any = {
    name: data.name,
    description: data.description,
  };

  // 如果提供了参数，转换为后端期望的space格式
  if (data.parameters && data.parameters.length > 0) {
    backendData.space = {};
    data.parameters.forEach(param => {
      backendData.space[param.name] = {
        type: param.type === 'int' ? 'integer' : 'float',
        min: param.range?.[0] ?? 0,
        max: param.range?.[1] ?? 100,
        default: param.default,
      };
    });
  }

  const response = await request<BackendConfigSpaceResponse>({
    url: `/config-spaces/${spaceId}`,
    method: 'PUT',
    data: backendData,
  });
  
  return convertBackendToFrontend(response);
};

// 获取参数模板
export const getTemplates = (): Promise<Template[]> => {
  return request({
    url: '/templates',
    method: 'GET',
  });
};

// 上传配置空间（读取 JSON 文件后创建配置空间）
export const uploadConfigSpace = async (configData: any): Promise<ConfigSpace> => {
  const response = await request<BackendConfigSpaceResponse>({
    url: '/config-spaces',
    method: 'POST',
    data: configData,
  });
  
  return convertBackendToFrontend(response);
};

