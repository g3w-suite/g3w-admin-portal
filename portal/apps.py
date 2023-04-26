# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.apps import AppConfig
from django.conf import settings

class PortalConfig(AppConfig):
    name = 'portal'

    # TODO: uninstall "django-samesite-none" in Django >= v3.1
    settings.MIDDLEWARE = [
        'django_samesite_none.middleware.SameSiteNoneMiddleware',
        'corsheaders.middleware.CorsMiddleware'
    ] + settings.MIDDLEWARE

    # Activate `corsheaders` package
    if hasattr(settings, 'THIRD_PARTY_APPS'):
        settings.THIRD_PARTY_APPS += ['corsheaders'] # when we are running a G3W-ADMIN instance 
    else:
        settings.INSTALLED_APPS   += ['corsheaders'] # when we are running a plain DJANGO instance