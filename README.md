# G3W-ADMIN-PORTAL v4.1.4


[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/g3w-suite/g3w-admin-portal)

G3W-ADMIN fronted portal for G3W-SUITE.

## Installation

```sh
# Install module from github (@v4.1.0)
pip3 install git+https://github.com/g3w-suite/g3w-admin-portal.git@v4.1.0

# Install module from github (dev branch)
# pip3 install git+https://github.com/g3w-suite/g3w-admin-portal.git@dev

# Install module from local folder (git development)
# pip3 install -e /shared-volume/plugins/g3w-admin-portal

# Install module from PyPi (not yet available)
# pip3 install g3w-admin-portal
```

Enable `'portal'` module adding it to `G3W_LOCAL_MORE_APPS` list:

```py
# local_settings.py

G3WADMIN_LOCAL_MORE_APPS = [
    ...
    'portal'
    ...
]
```

Refer to [g3w-suite-docker](https://github.com/g3w-suite/g3w-suite-docker) repository for more info about running this on a docker instance.

**NB** On Ubuntu Jammy you could get an `UNKNOWN` package install instead of `g3w-admin-portal`, you can retry installing it as follows to fix it:

```sh
# Fix: https://github.com/pypa/setuptools/issues/3269#issuecomment-1254507377
export DEB_PYTHON_INSTALL_LAYOUT=deb_system

# And then install again the module
pip3 install ...
```

# Configuration

Here are some reccomended local_settings.py (same site installation, alongside a [`g3w-admin`](https://github.com/g3w-suite/g3w-admin/tree/v.3.11.x/g3w-admin) instance):

```python
...

# TODO: fix ModuleNotFoundError when app is disabled (g3w-admin v3.5)
if ('portal' in G3WADMIN_LOCAL_MORE_APPS):
    FRONTEND_APP = 'portal'
    FRONTEND     = True

# CSS OVERRIDES based on the self-hosted Pico.css v1.5.10 (https://picocss.com)
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

# Toggle TOP NAV MENU visibility
PORTAL_NAVBAR_TOP = False

# Customize TOP NAV MENU link
PORTAL_ORG_NAME   = 'Download'
PORTAL_ORG_URL    = 'https://github.com/g3w-suite'

# Custom favicon url
PORTAL_FAVICON  = '/static/img/favicon.ico'

# ☢️ DANGER ZONE ☢️
# -----------------

# List projects and groups that belong to specific "macrogroup_name"
# PORTAL_PROJECTS_FILTER = { 'macrogroups__name': 'ALTAMURA' }
# PORTAL_GROUPS_FILTER   = { 'macrogroups__name': 'ALTAMURA' }

# Hide macrogroups on frontend (returns empty list)
# PORTAL_MAGROGROUPS_FILTER = { 'pk': -9999 }
```

### Custom LOGIN/LOGOUT URLs

Use same G3W-ADMIN and G3W-PORTAL login/logout pages:

```python
LOGIN_URL = 'https://www.example.com/login'
LOGOUT_URL = 'https://www.example.com/logout'
```

Use a different G3W-PORTAL login/logut page:

```python
PORTAL_LOGIN_URL = '/login/?next=/'
PORTAL_LOGOUT_URL = '/logout/?next=/'
```

### Cross domain authentication

When developing locally with `PORTAL_API_BASE_URL` pointing to a remote server,
the portal transparently forwards its API calls on `localhost`/`127.0.0.1` to
the remote server (no dedicated route or frontend change is needed). This avoids
browser CORS restrictions without changing the remote server. The local backend must be able to reach the configured API;
the proxy is unavailable on non-local hosts.

Install [g3w-admin-authjwt](https://github.com/g3w-suite/g3w-admin-authjwt) module on your remote server:

```sh
pip install "portal[authjwt] @ git+https://github.com/g3w-suite/g3w-admin-portal.git@v4.1.0"
```

And then update your CORS settings accordingly within local_settings.py file:

```py
# TODO: improve documentation

PORTAL_AUTH_MODE    = # 'cookie' | 'Bearer' | 'JWT'
PORTAL_API_BASE_URL = # URI path to cross domain API
PORTAL_STATIC_URL   = # URI path to cross domain CDN
```

```py
## Django Rest Framework (restore default settings)
# ------------------------------------------------------
from django.conf import settings

settings.REST_FRAMEWORK.setdefault('DEFAULT_AUTHENTICATION_CLASSES', []).extend([
    'rest_framework.authentication.SessionAuthentication',
    'rest_framework.authentication.BasicAuthentication'
])

## Static URLs
# ------------------------------------------------------

STATIC_URL  = 'http://localhost:8000/static/' # CHANGE ME: 'http://yourdomain.com/static' in PRODUCTION!
STATIC_ROOT = '/shared-volume/static/'

## CORS Headers
# ------------------------------------------------------
# https://pypi.org/project/django-cors-headers/
# https://docs.djangoproject.com/en/2.2/ref/settings/
# https://docs.djangoproject.com/en/3.1/ref/settings/

CORS_ALLOW_ALL_ORIGINS  = False                  # NB: True = DEBUGGING ONLY!
CORS_ALLOWED_ORIGINS    = [                      # NB: DIFFERENT PORT == DIFFERENT SERVER
    'http://localhost:8080',
    'http://127.0.0.1:8080',
]

## Additional CORS settings (JWT only = reccomendend when using a third-party domain for authentication)
# ------------------------------------------------------
# https://django-rest-framework-simplejwt.readthedocs.io/en/latest/blacklist_app.html
# https://django-rest-framework-simplejwt.readthedocs.io/en/latest/stateless_user_authentication.html

# from datetime import timedelta
# JWT_AUTH = {
#    'JWT_ALLOW_REFRESH': True,
#    'JWT_EXPIRATION_DELTA': timedelta(hours=1),        
#    'JWT_REFRESH_EXPIRATION_DELTA': timedelta(days=7), 
#    # 'AUTH_HEADER_TYPES': ('Bearer', 'JWT', )
# }

## Additional CORS settings (cookie only = reccomendend when using a sub-domain for authentication)
# ------------------------------------------------------

# CORS_ALLOW_CREDENTIALS  = True                   # enable CORS Authentication
# CORS_ORIGIN_WHITELIST   = CORS_ALLOWED_ORIGINS
# CSRF_TRUSTED_ORIGINS    = CORS_ALLOWED_ORIGINS
# CSRF_COOKIE_DOMAIN      = 'localhost'            # CHANGE ME: '.yourdomain.com' in PRODUCTION!
# CSRF_COOKIE_SAMESITE    = None                   # TODO: uninstall "django-samesite-none" in Django >= v3.1
# CSRF_COOKIE_SECURE      = False                  # CHANGE ME: True in PRODUCTION!
# SESSION_COOKIE_DOMAIN   = CSRF_COOKIE_DOMAIN
# SESSION_COOKIE_SAMESITE = CSRF_COOKIE_SAMESITE
# SESSION_COOKIE_SECURE   = CSRF_COOKIE_SECURE
```

### Troubleshooting

Make use of cookie authentication when the host is behind multiple proxies:

```py
PORTAL_AUTH_MODE = 'cookie'

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

## Demo content

To load default portal pictures:

```sh
./manage.py loaddata_picture
```
## Running tests

Tests use Behave / Gherkin: [features](./portal/tests/features) and [steps](./portal/tests/steps).

Browser tests, from the repository root:

```sh
python -m pip install -r requirements-test.txt
python -m playwright install chromium
python -m behave --tags=browser
```

Browser tests start their own Django test server with mocked APIs.
Backend tests require the configured G3W-ADMIN/QGIS environment and create a
test database. Run from the G3W-ADMIN directory:

```sh
DJANGO_SETTINGS_MODULE=base.settings python3 -m behave portal/tests/features --tags=backend
```

## Frontend development

Develop through G3W-ADMIN in Docker or with `pip install -e .`.
Edit [portal/static/frontend](./portal/static/frontend) directly: native JS/CSS,
no Node/npm or build step. Configuration uses Django's `PORTAL_*` settings.
Deploy static assets using Django's `collectstatic`.

## Release a new version

```sh
make install           # init makefiles (once)
make version v=X.Y.Z   # add new git version
make push-tags         # update remote git tags (local --> remote)
```

---

**Compatibile with:**
[![g3w-admin version](https://img.shields.io/badge/g3w--admin-3.11-1EB300.svg?style=flat)](https://github.com/g3w-suite/g3w-admin/tree/v.3.11.x)
[![g3w-suite-docker version](https://img.shields.io/badge/g3w--suite--docker-3.11-1EB300.svg?style=flat)](https://github.com/g3w-suite/g3w-suite-docker/tree/v3.11.x)

---

**License:** MPL-2
