# coding=utf-8
""""
.. note:: This program is free software; you can redistribute it and/or modify
    it under the terms of the Mozilla Public License 2.0.

"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2023-04-13'
__copyright__ = 'Copyright 2015 - 2023, Gis3w'
__license__ = 'MPL 2.0'


#########################################################
# CHIPS - Cookies Having Independent Partitioned State
#########################################################

from http import cookies

cookies.Morsel._reserved["partitioned"] = "Partitioned"
cookies.Morsel._flags.add("partitioned")

token_key = '__drftk'

class PartitionedCookieMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if token_key in request.GET:

            for name, value in response.cookies.items():
                value["partitioned"] = True
                print(name, value)

        return response


#########################################################
# UNUSUED: Auth by Django Rest Framework Token
#########################################################

from django.http import HttpResponsePermanentRedirect
from django.conf import settings
from django import http
from django.contrib import auth
from django.core import exceptions
from rest_framework.authtoken.models import Token
import logging

logger = logging.getLogger('g3wadmin.debug')


class AuthByDRFTokenMiddleware(object):
    """
    Middleware that authenticates against a token in the http authorization
    header.
    """
    get_response = None

    def __init__(self, get_response=None):
        self.get_response = get_response

    def __call__(self, request):
        if not self.get_response:
            return exceptions.ImproperlyConfigured(
                'Middleware called without proper initialization')

        self.token_key = getattr(settings, 'G3W_AUTHTOKEN_KEY', '__drftk')

        self.process_request(request)

        return self.process_response(request, self.get_response(request))

    def process_request(self, request):

        # try to found into url
        if self.token_key in request.GET:
            token = request.GET[self.token_key]
            logger.debug('TOKEN URL {}'.format(token))
        else:
            return None

        logger.debug('TOKEN KEYWORD INTO HEADERS')

        # If they specified an invalid token, let them know.
        if not token:
            return http.HttpResponseBadRequest("Improperly formatted token")

        logger.debug('G3WAUTHTOKEM TRY TO AUTHENTICATE')

        user = None
        try:
            t = Token.objects.get(key=token)
            user = t.user
        except Token.DoesNotExist:
            logger.debug('TOKEN DOESN\'T EXIST {}'.format(token))
            return None

        # try to render persistent
        auth.login(request, user, backend='django.contrib.auth.backends.ModelBackend')

        if user:
            request.user = user


    def process_response(self, request, response):
        if self.token_key in request.GET:
            return HttpResponsePermanentRedirect(request.path)
        else:
            return response



