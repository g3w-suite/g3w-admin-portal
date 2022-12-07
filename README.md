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

/* 16:9 images */
main#content article figure > img {
  aspect-ratio: 16/9;
  object-fit: contain;
}

/* Typography colors */
:root[data-theme="light"] {
  --primary: #af0b22;
  --primary-hover: #c30c26;
}
"""

# Customize TOP NAV MENU link
PORTAL_ORG_NAME = 'Regione Puglia'
PORTAL_ORG_URL  = 'http://www.regione.puglia.it/'
PORTAL_FAVICON  = 'https://www.comune.altamura.ba.it/templates/shaper_helixultimate/favicon.ico'

```


## DEPRECATED SETTINGS

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

To load default portal picture

```
./manage.py loaddata_picture
```
