# G3W-ADMIN-PORTAL

G3W-ADMIN fronted portal for G3W-SUITE.

## Installation

Add like git submodule from main g3w-admin directory

```bash
git submodule add -f https://<user>@bitbucket.org/gis3w/g3w-admin-portal.git g3w-admin/portal
```

Add 'frontend' module to G3W_LOCAL_MORE_APPS config value inside local_settings.py:

```python
G3WADMIN_LOCAL_MORE_APPS = [
    ...
    'portal'
    ...
]
```

To activate 'frontend' module and to set the frontend app for G3W-SUITE set in to local_settings.py:

```python
...
FRONTEND = True
FRONTEND_APP = 'portal'
...
```
