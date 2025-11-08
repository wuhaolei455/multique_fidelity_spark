import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { message } from 'antd';

// 自定义请求接口，返回数据而不是完整的 AxiosResponse
interface CustomAxiosInstance extends AxiosInstance {
  <T = any>(config: AxiosRequestConfig): Promise<T>;
  <T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token 等
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    console.error('Response error:', error);
    
    // 检查是否是后端服务不可用
    const isBackendUnavailable = error.code === 'ERR_NETWORK' || 
                                  error.code === 'ECONNREFUSED' ||
                                  !error.response;
    
    // 如果后端不可用，只在控制台警告，不显示错误消息
    if (isBackendUnavailable) {
      console.warn('⚠️ 后端服务不可用，某些功能可能无法使用');
      return Promise.reject({ ...error, isBackendUnavailable: true });
    }
    
    // 错误处理
    let errorMessage = '请求失败';
    
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = (data as any)?.message || '请求参数错误';
          break;
        case 401:
          errorMessage = '未授权，请登录';
          break;
        case 403:
          errorMessage = '拒绝访问';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器错误';
          break;
        default:
          errorMessage = (data as any)?.message || `请求失败 (${status})`;
      }
      message.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// 导出为自定义类型
const request = axiosInstance as CustomAxiosInstance;

export default request;

