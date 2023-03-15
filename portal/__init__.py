from django.conf import settings

default_app_config = 'portal.apps.PortalConfig'

settings.MIDDLEWARE = [
    'django_samesite_none.middleware.SameSiteNoneMiddleware',
    'corsheaders.middleware.CorsMiddleware'
] + settings.MIDDLEWARE 
settings.THIRD_PARTY_APPS += ['corsheaders']