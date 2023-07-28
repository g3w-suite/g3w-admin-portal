import appConfig from '@/config';
import { useAuthStore } from '@/stores';

class HttpClient {

  public async get<T>(url: string, data?: any): Promise<T> {
    return this.fetch<T>(url, { method: 'GET', data });
  }

  public async post<T>(url: string, data?: any, headers?: any, customConfig?: any): Promise<T> {
    return this.fetch<T>(url, { method: 'POST', data, headers, customConfig });
  }

  public async fetch<T>(endpoint: string, { data, method, headers: customHeaders, ...customConfig }: any): Promise<T> {
    const url = new URL(endpoint, appConfig.api_base_url).toString();
    const config = this.auth_request({
      method: method ?? 'GET',
      body: (customHeaders && 'application/json' !== customHeaders['Content-Type'] ? data : JSON.stringify(data)),
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders
      },
      ...customConfig
    });
    return window
      .fetch(url, config)
      .then(async response => {
        const error = await this.auth_error(response, endpoint, config);
        if (-1 !== error) {
          return error;
        }
        if (response.ok) {
          return await response.json()
        }
        return Promise.reject(await response.json());
      }).catch(e => {
        console.warn('HTTP Error', e);
        throw e;
      });
  }

  private auth_request(config: any): any {
    const auth = useAuthStore();
    // CORS sessions (ie. with cookies)
    if (auth.crossOrigin) {
      config.withCredentials = true;
    }
    // CORS JWT sessions
    if (!auth.useCookies && auth.access_token) {
      config.headers.Authorization = `${appConfig.auth_mode} ${auth.access_token}`;
      config.timeout = 5000;
    }
    return config;
  }

  private auth_error(response: any, url: any, config: any): any {
    const auth = useAuthStore();
    // CORS JWT sessions (expired access_token)
    if (!auth.useCookies && auth.refresh_token) {
      if ([401, 403].includes(response.status)) {
        return useAuthStore().refresh().then(() => this.fetch(url, config));
      }
    }
    return -1;
  }

}

export const HTTPCLIENT = new HttpClient();
