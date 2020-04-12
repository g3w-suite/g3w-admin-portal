export enum ELoginStatus {
    'OK' = 'ok',
    'ERROR' = 'error',
}

export interface ILoginResponse {
    status: ELoginStatus;
    error_form?: object;
    message?: string;
}

export interface ILogoutResponse {
    status: ELoginStatus;
    message?: string;
}
