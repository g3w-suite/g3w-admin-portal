export const config = {
  base: new URL(window.API_BASE_URL || '/', location.href),
  languages: window.LANGUAGES || ['en', 'it'],
  auth: window.PORTAL_AUTH_MODE || 'cookie',
  mode: window.PORTAL_HISTORY_MODE || 'hash',
};

const tokenAuth = ['JWT', 'Bearer'].includes(config.auth);
let refreshRequest;

export function adminURL(path = '') {
  return new URL(path, config.base).href;
}

export function tokens(access = '', refresh = '') {
  for (const [key, value] of Object.entries({ access_token: access, refresh_token: refresh })) {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }
}

export async function request(path, { method = 'GET', body, retry = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = body instanceof URLSearchParams
    ? 'application/x-www-form-urlencoded' : 'application/json';
  const access = tokenAuth && localStorage.getItem('access_token');
  if (access) headers.Authorization = `${config.auth} ${access}`;
  if (method !== 'GET' && new URL(path, config.base).origin === location.origin) {
    const cookie = document.cookie.split('; ').find(item => item.startsWith('csrftoken='));
    if (cookie) headers['X-CSRFToken'] = decodeURIComponent(cookie.slice('csrftoken='.length));
  }
  const response = await fetch(adminURL(path), {
    method, headers, credentials: tokenAuth ? 'same-origin' : 'include',
    body: body === undefined ? undefined : body instanceof URLSearchParams ? body.toString() : JSON.stringify(body),
  });
  if (tokenAuth && retry && [401, 403].includes(response.status)
      && !path.includes('/authjwt/') && localStorage.getItem('refresh_token')) {
    if (access === localStorage.getItem('access_token')) {
      refreshRequest ??= request('/authjwt/api/token/refresh/', {
        method: 'POST', body: { refresh: localStorage.getItem('refresh_token') }, retry: false,
      }).then(data => {
        if (typeof data.access !== 'string' || !data.access) throw new Error('Invalid token refresh response');
        tokens(data.access, data.refresh || localStorage.getItem('refresh_token'));
      }).catch(error => {
        tokens();
        throw error;
      }).finally(() => { refreshRequest = undefined; });
      await refreshRequest;
    }
    return request(path, { method, body, retry: false });
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${path}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export function portal(locale, path) {
  return request(`${locale}/portal${path}`);
}

export async function login(locale, username, password) {
  if (tokenAuth) {
    const data = await request('/authjwt/api/token/', { method: 'POST', body: { username, password }, retry: false });
    if (typeof data.access !== 'string' || !data.access || typeof data.refresh !== 'string' || !data.refresh) throw new Error('Invalid authentication response');
    tokens(data.access, data.refresh);
  } else {
    const data = await request(`${locale}/portal/jx/login/`, {
      method: 'POST', body: new URLSearchParams({ username, password }),
    });
    if (data.status !== 'ok') throw new Error(Object.values(data.errors_form || data.error_form || {}).flat().join(' ') || 'Login failed');
  }
}

export async function logout(locale, user) {
  if (tokenAuth) {
    await request('/authjwt/api/token/blacklist/', {
      method: 'POST', body: { refresh: localStorage.getItem('refresh_token') }, retry: false,
    });
    tokens();
    if (user?.drf_token) {
      const url = new URL(`${locale}/portal/jx/logout/`, config.base);
      url.search = new URLSearchParams({ __drftk: user.drf_token, redirect: location.href });
      location.assign(url.href);
      return;
    }
  } else {
    const data = await request(`${locale}/portal/jx/logout/`);
    if (data.status !== 'ok') throw new Error(data.message || 'Logout failed');
  }
}
