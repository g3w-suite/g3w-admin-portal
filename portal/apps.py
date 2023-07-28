# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.apps import AppConfig
from django.conf import settings
import logging

logger = logging.getLogger('g3wadmin.debug')

class PortalConfig(AppConfig):
    name = 'portal'

    settings.MIDDLEWARE = [ 'portal.middleware.PartitionedCookieMiddleware' ] + settings.MIDDLEWARE

    # OPTIONAL packages from "requirements_authjwt.txt"
    try:
        from corsheaders.middleware import CorsMiddleware
        from django_samesite_none.middleware import SameSiteNoneMiddleware
        logger.info('[PORTAL] setup optional packages: "corsheaders", "django_samesite_none"')

        # TODO: uninstall "django-samesite-none" in Django >= v3.1
        settings.MIDDLEWARE = [
            'django_samesite_none.middleware.SameSiteNoneMiddleware',
            'corsheaders.middleware.CorsMiddleware',
        ] + settings.MIDDLEWARE

        # Activate `corsheaders` package
        if hasattr(settings, 'THIRD_PARTY_APPS'):
            settings.THIRD_PARTY_APPS += ['corsheaders'] # when we are running a G3W-ADMIN instance 
        else:
            settings.INSTALLED_APPS   += ['corsheaders'] # when we are running a plain DJANGO instance

    except ImportError:
        logger.info('[PORTAL] optional "requirements_authjwt.txt" packages not installed')
        pass