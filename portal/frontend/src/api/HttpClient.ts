import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '@/config';

export interface IHttpClient {
  get: <T>(url: string, config?: AxiosRequestConfig)             => Promise<T>;
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
}

class HttpClient implements IHttpClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.api_base_url,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.http.interceptors.request.use(
      (config) => config,
      (error) => Promise.reject(error),
    );

  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse = await this.http.get(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse = await this.http.post(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse = await this.http.patch(url, data, config);
    return response.data;
  }
}

export const httpClient: IHttpClient = new HttpClient();
