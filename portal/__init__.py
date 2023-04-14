from django.conf import settings

default_app_config = 'portal.apps.PortalConfig'

# TODO: uninstall "django-samesite-none" in Django >= v3.1
settings.MIDDLEWARE = [
    'django_samesite_none.middleware.SameSiteNoneMiddleware',
    'corsheaders.middleware.CorsMiddleware'
] + settings.MIDDLEWARE

# Conditionally enable `AuthByDRFTokenMiddleware`
if 'rest_framework.authtoken' in settings.INSTALLED_APPS and \
   'authjwt' in settings.INSTALLED_APPS :
    settings.MIDDLEWARE += ['portal.middleware.AuthByDRFTokenMiddleware']

# Activate `corsheaders` package through:
# - THIRD_PARTY_APPS if we are running a G3W-ADMIN instance
# - INSTALLED_APPS if we are running a plain DJANGO instance
if hasattr(settings, 'THIRD_PARTY_APPS'):
    settings.THIRD_PARTY_APPS += ['corsheaders'] 
else:
    settings.INSTALLED_APPS   += ['corsheaders']
    