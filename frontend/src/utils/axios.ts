import appConfig from '@/config';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useRootStore, useAuthStore } from '@/stores';

export interface IHttpClient {
  get: <T>(url: string, config?: AxiosRequestConfig)               => Promise<T>;
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig)  => Promise<T>;
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
}

// Make Axios play nice with Django CSRF
// axios.defaults.xsrfCookieName = "csrftoken";
// axios.defaults.xsrfHeaderName = "X-CSRFToken"

class HttpClient implements IHttpClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: appConfig.api_base_url,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.http.interceptors.request.use(
      (config) => {
        // CORS sessions (ie. with cookies)
        if (useRootStore().crossOrigin) {
          config.withCredentials = true;
        }
        // CORS JWT sessions
        if (!useRootStore().useCookies && useRootStore().access_token) {
          config.headers.Authorization = `${appConfig.auth_mode} ${useRootStore().access_token}`;
          config.timeout = 5000;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    const ejectResponse = this.http.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // CORS JWT sessions (expired access_token)
        if (!useRootStore().useCookies && useRootStore().refresh_token) {
          if (error.response && [401, 403].includes(error.response.status)) {
          // prevent infinite loops for any subsequent failed intercepted response
          this.http.interceptors.response.eject(ejectResponse);
          return useAuthStore().refresh().then(() => this.http.request(error.config));
          }
        }
        return Promise.reject(error);
    });

  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.get(url, config) as AxiosResponse).data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.post(url, data, config) as AxiosResponse).data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return (await this.http.patch(url, data, config) as AxiosResponse).data;
  }
}

export const HTTPCLIENT: IHttpClient = new HttpClient();
