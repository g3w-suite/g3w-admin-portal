# G3W-ADMIN-PORTAL v5.0.0

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/g3w-suite/g3w-admin-portal)

A public home page (portal) for [G3W-SUITE](https://github.com/g3w-suite): it lists the maps, groups and macrogroups published with [G3W-ADMIN](https://github.com/g3w-suite/g3w-admin).

---

**Contents**

1. [Quick start](#1-quick-start)
2. [Configuration](#2-configuration)
3. [Using a remote G3W-ADMIN server](#3-using-a-remote-g3w-admin-server)
4. [Troubleshooting](#4-troubleshooting)
5. [Development](#5-development)

---

**Preview** 👉 [dev.g3wsuite.it](https://dev.g3wsuite.it)

[![preview](https://github.com/user-attachments/assets/08a67c6c-3a39-41e3-a231-c586a3b8ec68)](https://dev.g3wsuite.it)

---

## 1. Quick start

**Step 1 — Install the module**

```sh
pip3 install git+https://github.com/g3w-suite/g3w-admin-portal.git@v4.1.0
```

<details>
<summary>Other install options</summary>

```sh
# Latest development version
pip3 install git+https://github.com/g3w-suite/g3w-admin-portal.git@dev

# Local folder (editable, for development)
pip3 install -e /shared-volume/plugins/g3w-admin-portal
```

</details>

**Step 2 — Enable it** in G3W-ADMIN's `local_settings.py`:

```py
G3WADMIN_LOCAL_MORE_APPS = [
    ...
    'portal',
]

# Show the portal as the site home page
if 'portal' in G3WADMIN_LOCAL_MORE_APPS:
    FRONTEND_APP = 'portal'
    FRONTEND     = True
```

**Step 3 — (Optional) Load the demo pictures**

```sh
./manage.py loaddata_picture
```

Running on Docker? See [g3w-suite-docker](https://github.com/g3w-suite/g3w-suite-docker).

---

## 2. Configuration

All options are optional and go in `local_settings.py`.

### Look & feel

| Setting | What it does | Example |
|---|---|---|
| `PORTAL_NAVBAR_TOP` | Show/hide the top navigation bar | `False` |
| `PORTAL_ORG_NAME` | Text of the organization link in the top bar | `'Download'` |
| `PORTAL_ORG_URL` | Target of the organization link | `'https://github.com/g3w-suite'` |
| `PORTAL_FAVICON` | Custom favicon URL | `'/static/img/favicon.ico'` |
| `PORTAL_THEME` | Color theme (default: `'light'`) | `'light'` |
| `PORTAL_MAX_HOME_ARTICLES` | Max items shown on the home page (default: `9`) | `6` |
| `PORTAL_CUSTOM_CSS` | Extra CSS injected in every page | see below |
| `PORTAL_CUSTOM_JS` | Extra JavaScript injected in every page | see [Troubleshooting](#4-troubleshooting) |

The portal is styled with [Pico.css v1.5.10](https://picocss.com), so most changes are just a matter of overriding its CSS variables.

<details>
<summary>Example: <code>PORTAL_CUSTOM_CSS</code> with a red theme</summary>

```python
PORTAL_CUSTOM_CSS = """
/* Navigation Menu colors */
nav#top-menu  { --nav-background-color: #c30c26; }
nav#main-menu { --nav-background-color: #af0b22; }

nav#top-menu,
nav#main-menu {
  --nav-color: #fff;
  --background-color: var(--nav-background-color, --background-color);
  --nav-border-color: rgba(255, 255, 255, 0.2);
  --primary: var(--nav-color, --secondary);
  --secondary: var(--nav-color, --secondary);
  --h1-color: var(--nav-color, --h1-color);
  --color: var(--nav-color, --color);
  --contrast-hover: var(--nav-color, --contrast-hover);
  --secondary-hover: var(--nav-color, --secondary-hover);
  --contrast: var(--nav-color, --contrast-hover);
  --icon-chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgb(255, 255, 255)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  --primary-hover: #1ab3e6;
}

/* Card item: change default aspect ratio for images (16:9) */
main#content article figure > img {
  aspect-ratio: 16/9;
  object-fit: contain;
}

/* Card item: move figcaption before image (heading) */
main#content article figure > figcaption {
  grid-row-start: 1;
  background-color: var(--primary);
}

/* Card item: fixed header "top position" independently of other card items heights */
main#content article > a {
  display: flex;
}

/* Card item: fixed header height of 3.5rem */
main#content article > a > figure > figcaption {
  display: grid;
  grid-template-rows: 3.5rem;
  align-items: center;
}

/* Typography colors */
:root[data-theme="light"] {
  --primary: #af0b22;
  --primary-hover: #c30c26;
}
"""
```

</details>

### Login / logout pages

By default the portal uses the G3W-ADMIN login and logout pages (`LOGIN_URL` / `LOGOUT_URL`).
To send portal users to different pages:

```python
PORTAL_LOGIN_URL  = '/login/?next=/'
PORTAL_LOGOUT_URL = '/logout/?next=/'
```

### Filtering what is listed ⚠️

Use with care: these settings hide content from the portal.

```python
# Only show projects / groups belonging to a given macrogroup
PORTAL_PROJECTS_FILTER = { 'macrogroups__name': 'ALTAMURA' }
PORTAL_GROUPS_FILTER   = { 'macrogroups__name': 'ALTAMURA' }

# Hide all macrogroups (returns an empty list)
PORTAL_MACROGROUPS_FILTER = { 'pk': -9999 }
```

---

## 3. Using a remote G3W-ADMIN server

Use this when the portal and the G3W-ADMIN API live on **different domains**.

**Step 1 — On the remote server**, install the portal with JWT support ([g3w-admin-authjwt](https://github.com/g3w-suite/g3w-admin-authjwt)):

```sh
pip install "portal[authjwt] @ git+https://github.com/g3w-suite/g3w-admin-portal.git@v4.1.0"
```

**Step 2 — On the portal**, point it to the remote server:

| Setting | What to put in it | Default (if not set) |
|---|---|---|
| `PORTAL_AUTH_MODE` | How the portal logs users in: `'cookie'`, `'Bearer'` or `'JWT'` (see Step 3) | `'cookie'` |
| `PORTAL_API_BASE_URL` | Root URL of the remote G3W-ADMIN server, **not** the API path (the portal adds `it/portal/api/...` by itself) | the portal's own site root |
| `PORTAL_STATIC_URL` | URL of the folder that contains `frontend/` (usually the remote `STATIC_URL`). **Must end with `/`** | the portal's own static files |

For example, with G3W-ADMIN running on `https://g3w.example.com`:

```python
PORTAL_AUTH_MODE    = 'JWT'
PORTAL_API_BASE_URL = 'https://g3w.example.com/'
PORTAL_STATIC_URL   = 'https://g3w.example.com/static/'  # loads .../static/frontend/index.js
```

> **Tip for local development:** when the portal runs on `localhost` / `127.0.0.1`,
> its API calls are automatically forwarded to `PORTAL_API_BASE_URL`, so you don't hit
> browser CORS errors and don't need to change the remote server.
> Your machine must be able to reach the remote API. This proxy is disabled on non-local hosts.

**Step 3 — On the remote server**, allow requests from the portal (CORS) in `local_settings.py`:

```py
## Django Rest Framework (restore default settings)
from django.conf import settings

settings.REST_FRAMEWORK.setdefault('DEFAULT_AUTHENTICATION_CLASSES', []).extend([
    'rest_framework.authentication.SessionAuthentication',
    'rest_framework.authentication.BasicAuthentication'
])

## Static URLs
STATIC_URL  = 'http://localhost:8000/static/' # CHANGE ME: 'http://yourdomain.com/static' in PRODUCTION!
STATIC_ROOT = '/shared-volume/static/'

## CORS Headers (https://pypi.org/project/django-cors-headers/)
CORS_ALLOW_ALL_ORIGINS = False                  # NB: True = DEBUGGING ONLY!
CORS_ALLOWED_ORIGINS   = [                      # NB: DIFFERENT PORT == DIFFERENT SERVER
    'http://localhost:8080',
    'http://127.0.0.1:8080',
]
```

Then add **one** of the following, depending on `PORTAL_AUTH_MODE`:

<details>
<summary><b>JWT</b> — recommended when authentication is on a third-party domain</summary>

See: [simplejwt docs](https://django-rest-framework-simplejwt.readthedocs.io/en/latest/stateless_user_authentication.html)

```py
from datetime import timedelta

JWT_AUTH = {
    'JWT_ALLOW_REFRESH': True,
    'JWT_EXPIRATION_DELTA': timedelta(hours=1),
    'JWT_REFRESH_EXPIRATION_DELTA': timedelta(days=7),
    # 'AUTH_HEADER_TYPES': ('Bearer', 'JWT', )
}
```

</details>

<details>
<summary><b>Cookie</b> — recommended when authentication is on a sub-domain</summary>

```py
CORS_ALLOW_CREDENTIALS  = True                   # enable CORS Authentication
CORS_ORIGIN_WHITELIST   = CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS    = CORS_ALLOWED_ORIGINS
CSRF_COOKIE_DOMAIN      = 'localhost'            # CHANGE ME: '.yourdomain.com' in PRODUCTION!
CSRF_COOKIE_SAMESITE    = None                   # TODO: uninstall "django-samesite-none" in Django >= v3.1
CSRF_COOKIE_SECURE      = False                  # CHANGE ME: True in PRODUCTION!
SESSION_COOKIE_DOMAIN   = CSRF_COOKIE_DOMAIN
SESSION_COOKIE_SAMESITE = CSRF_COOKIE_SAMESITE
SESSION_COOKIE_SECURE   = CSRF_COOKIE_SECURE
```

</details>

---

## 4. Troubleshooting

### Package installed as `UNKNOWN` (Ubuntu Jammy)

Set this variable and run `pip3 install ...` again ([details](https://github.com/pypa/setuptools/issues/3269#issuecomment-1254507377)):

```sh
export DEB_PYTHON_INSTALL_LAYOUT=deb_system
```

### Login doesn't work behind multiple proxies

Use cookie authentication with a relative API URL, and turn it into an absolute one in the browser:

```py
PORTAL_AUTH_MODE    = 'cookie'
PORTAL_API_BASE_URL = '/'

PORTAL_CUSTOM_JS = """
// convert relative base URLs to absolute (eg. '/' → 'http://localhost:8080/')
if (window.API_BASE_URL) {
  try {
    new URL(window.API_BASE_URL);
  } catch (error) {
    window.API_BASE_URL = (new URL(window.API_BASE_URL, window.location)).toString();
  }
}
"""
```

See also: [MultipleProxyMiddleware](https://docs.djangoproject.com/en/3.2/ref/request-response/#django.http.HttpRequest.get_host)

---

## 5. Development

### Frontend

The frontend is plain JS/CSS in [portal/static/frontend](./portal/static/frontend): **no Node/npm, no build step**.
Edit the files directly, then deploy them with Django's `collectstatic`.
Develop through G3W-ADMIN in Docker or with `pip install -e .`.

### Tests

Tests use Behave / Gherkin: [features](./portal/tests/features) and [steps](./portal/tests/steps).

**Browser tests** — self-contained (own Django test server, mocked APIs). From the repository root:

```sh
python -m pip install -r requirements-test.txt
python -m playwright install chromium
python -m behave --tags=browser
```

**Backend tests** — need a configured G3W-ADMIN/QGIS environment and create a test database. From the G3W-ADMIN directory:

```sh
DJANGO_SETTINGS_MODULE=base.settings python3 -m behave portal/tests/features --tags=backend
```

### Release a new version

```sh
make install           # init makefiles (once)
make version v=X.Y.Z   # add new git version
make push-tags         # update remote git tags (local --> remote)
```

---

**Compatible with:**
[![g3w-admin version](https://img.shields.io/badge/g3w--admin-3.11-1EB300.svg?style=flat)](https://github.com/g3w-suite/g3w-admin/tree/v.3.11.x)
[![g3w-suite-docker version](https://img.shields.io/badge/g3w--suite--docker-3.11-1EB300.svg?style=flat)](https://github.com/g3w-suite/g3w-suite-docker/tree/v3.11.x)

**License:** MPL-2
