# G3W-ADMIN-PORTAL

G3W-ADMIN fronted portal for G3W-SUITE.

## Installation

Add module to g3w-admin directory

```bash
git clone https://wlorenzetti@bitbucket.org/gis3w/g3w-admin-portal.git
mv g3w-admin-portal /<path_to_g3wsuite>/g3w-admin/portal
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

#Enable/disable menu sections
PORTAL_SECTIONS = [
    'maps',
    'info',
    # 'news',
    # 'archives'
]


# Optional
# Activate Public Administration template
PORTAL_IS_PA = True #(False, default)
...

# Optional
# Activete Link to Admin 
PORTAL_ADMIN_BTN = True #(False, default)
...

# Optional
# Set default portal palette color (chose from 'yellow' 'violet' or 'blue')
PORTAL_COLOR = 'yellow' #(violet, default) 
...
```

To load default portal picture

```
./manage.py loaddata_picture
```
