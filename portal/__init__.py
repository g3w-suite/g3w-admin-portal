from django.conf import settings

default_app_config = 'portal.apps.PortalConfig'

# TODO: uninstall "django-samesite-none" in Django >= v3.1
settings.MIDDLEWARE = [
    'django_samesite_none.middleware.SameSiteNoneMiddleware',
    'corsheaders.middleware.CorsMiddleware'
] + settings.MIDDLEWARE

# Activate `corsheaders` package
if hasattr(settings, 'THIRD_PARTY_APPS'):
    settings.THIRD_PARTY_APPS += ['corsheaders'] # when running a G3W-ADMIN instance 
else:
    settings.INSTALLED_APPS   += ['corsheaders'] # when running a plain DJANGO instance