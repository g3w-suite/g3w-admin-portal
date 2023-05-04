# G3W-ADMIN-PORTAL

G3W-ADMIN fronted portal for G3W-SUITE.

## Installation

**NB** whatever your final purpose is (deploying or contributing), make sure to download this repository outside of the [`g3w-admin`](https://github.com/g3w-suite/g3w-admin/tree/v.3.5.x/g3w-admin) applications folder (that's why here we are using the python [flat-layout](https://setuptools.pypa.io/en/latest/userguide/package_discovery.html#flat-layout) packaging structure). If in doubt the `/shared-volume/g3w-admin-portal` folder is a great place to start:

```sh
# Install module from bitbucket (v1.0.0)
pip3 install git+https://bitbucket.org/gis3w/g3w-admin-portal.git@v1.0.0

# Install module from bitbucket (master branch)
# pip3 install git+https://bitbucket.org/gis3w/g3w-admin-portal.git@master

# Install module from bitbucket (as wlorenzetti user)
# pip3 install git+https://wlorenzetti@bitbucket.org/gis3w/g3w-admin-portal.git

# Install module from bitbucket (with a private token)
# export BITBUCKET_TOKEN=<bitbucket_username>:<private_access_token>
# pip3 install git+https://$BITBUCKET_TOKEN@bitbucket.org/gis3w/g3w-admin-portal.git

# Install module from local folder (git development)
# pip3 install -e /shared-volume/g3w-admin-portal

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

Here are some reccomended local_settings.py (same site installation, alongside a [`g3w-admin`](https://github.com/g3w-suite/g3w-admin/tree/v.3.5.x/g3w-admin) instance):

```python
...

# TODO: fix ModuleNotFoundError when app is disabled (g3w-admin v3.5)
if ('portal' in G3WADMIN_LOCAL_MORE_APPS):
    FRONTEND_APP = 'portal'
    FRONTEND     = True

# CSS OVERRIDES based on Pico.css v1.5.6 (https://picocss.com)
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

```

### Cross domain authentication

Install [g3w-admin-authjwt](https://github.com/g3w-suite/g3w-admin-authjwt) module on your remote server.

And then update your CORS settings accordingly within local_settings.py file:

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

## Demo content

To load default portal pictures:

```
./manage.py loaddata_picture
```

## DEPRECATED SETTINGS (< v0.1.0)

```python
# Enable/disable menu sections
# PORTAL_SECTIONS = [
#    'maps',
#    'info',
#    # 'news',
#    # 'archives'
#]

# Activate Public Administration template
# PORTAL_IS_PA = True #(False, default)

# Activate Link to Admin 
# PORTAL_ADMIN_BTN = True #(False, default)

# Set default portal palette color (chose from 'yellow' 'violet' or 'blue')
# PORTAL_COLOR = 'yellow' #(violet, default) 
```

---

**Compatibile with:**
[![g3w-admin version](https://img.shields.io/badge/g3w--admin-3.5-1EB300.svg?style=flat)](https://github.com/g3w-suite/g3w-admin/tree/v.3.5.x)
[![g3w-suite-docker version](https://img.shields.io/badge/g3w--suite--docker-3.5-1EB300.svg?style=flat)](https://github.com/g3w-suite/g3w-suite-docker/tree/v3.5.x)

---

**License:** MPL-2