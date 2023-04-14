# coding=utf-8
""""
.. note:: This program is free software; you can redistribute it and/or modify
    it under the terms of the Mozilla Public License 2.0.

"""

__author__    = 'lorenzetti@gis3w.it'
__date__      = '2023-04-13'
__copyright__ = 'Copyright 2015 - 2023, Gis3w'
__license__   = 'MPL 2.0'


from django.conf import settings
from django import http
from django.contrib import auth
from django.core import exceptions
from rest_framework.authtoken.models import Token
import logging

logger = logging.getLogger('g3wadmin.debug')


class AuthByDRFTokenMiddleware(object):
    """
    Authenticate user against a token found in HTTP Authorization header
    Default: G3W_AUTHTOKEN_KEY = '__drftk'.
    """
    get_response = None

    def __init__(self, get_response=None):
        self.get_response = get_response

    def __call__(self, request):
        if not self.get_response:
            return exceptions.ImproperlyConfigured(
                'Middleware called without proper initialization'
            )

        self.process_request(request)

        return self.get_response(request)

    def process_request(self, request):

        # get token key
        token_key = getattr(settings, 'G3W_AUTHTOKEN_KEY', '__drftk')

        # try to found into url
        if token_key in request.GET:
            token = request.GET[token_key]
            logger.debug('[PORTAL] G3W AUTHTOKEN QUERY URL: {}'.format(token))
        else:
            return None

        logger.debug('[PORTAL] G3W AUTHTOKEN FOUND INTO HEADERS')

        # If they specified an invalid token, let them know.
        if not token:
            return http.HttpResponseBadRequest("Improperly formatted token")

        logger.debug('[PORTAL] G3W AUTHTOKEN TRY TO AUTHENTICATE')

        user = None
        try:
            user = Token.objects.get(key=token).user
        except Token.DoesNotExist:
            logger.debug('[PORTAL] G3W AUTHTOKEN TOKEN DOESN\'T EXISTS: {}'.format(token))
            return None

        # try to render persistent
        auth.login(
            request,
            user,
            backend='django.contrib.auth.backends.ModelBackend'
        )

        if user:
            request.user = user

