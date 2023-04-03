import config from '@/config';
import appConfig from '@/config';
import store from '@/store';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface IHttpClient {
  get: <T>(url: string, config?: AxiosRequestConfig)             => Promise<T>;
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>;
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
        if (store.state.crossOrigin) {
          config.withCredentials = true;
        }
        // CORS JWT sessions
        if (store.state.crossOrigin && store.state.access_token) {
          config.headers.Authorization = `${appConfig.auth_header} ${store.state.access_token}`;
          config.timeout = 5000;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
      // if error response status is 401, it means the request was invalid due to expired access token
      if (error.response && 401 === error.response.status) {
        store.dispatch('refreshTokens') // attempt to obtain new access token by running 'refreshToken' action
          .then((access) => {
            // if successful re-send the request to get the data from server
            axios.request({
              baseURL: appConfig.api_base_url,
              method: 'get',
              headers: { Authorization: `${config.auth_header} ${access}` }, // the new access token is attached to the authorization header
              url: '/mods/',
            }).then((response) => {
              // if successfully received the data store it in store.state.APIData so that 'Downloads' component can grab the
              // data from it and display to the client.
              console.log('Success getting the Mods', response.data);
              // store.state.APIData = response.data
            }).catch((err) => {
              console.log('Got the new access token but error while trying to fetch data from the API using it');
              return Promise.reject(err);
            });
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
    });

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
