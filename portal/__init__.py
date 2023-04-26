from django import VERSION as django_version

# https://docs.djangoproject.com/en/3.2/releases/3.2/#automatic-appconfig-discovery

if django_version < (3, 2):
    default_app_config = 'portal.apps.PortalConfig'