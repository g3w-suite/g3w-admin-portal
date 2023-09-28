# coding=utf-8
"""Portal API views
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__    = 'lorenzetti@gis3w.it'
__date__      = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'
__license__   = 'MPL 2.0'

from django.contrib import auth
from django.conf import settings

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

import logging

from .serializers import *
from .filters import *
from portal.utils import get_response_headers

import requests
import json

logger = logging.getLogger('g3wadmin.debug')


class PortalApiViewMixin(object):

    # to remove pagination for portal api
    pagination_class = None


class ProjectsApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for map projects
    """

    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    pagination_class = None



    filter_backends = (
        UserProjectFilter,
        GroupProjectFilter,
        PanoramicProjectFilter,
        ByMacroGroupFilter
    )


class GroupsApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for map groups
    """

    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    filter_backends = (
        UserGroupFilter,
        #MacroGroupGroupFilter,
        ByMacroGroupFilter
    )


class MacroGroupsApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for map macrogroups
    """

    queryset = MacroGroup.objects.all()
    serializer_class = MacroGroupSerializer

    filter_backends = (
        EmptyMacroGroupFilter,
    )


# class InfoDataApiView(generics.RetrieveAPIView):
#     """
#     API for Generic suite data
#     """
#
#     queryset = GeneralSuiteData.objects.all()
#     serializer_class = GenericSuiteDataSerializer
#
#     def get_object(self):
#         return self.get_queryset()[0]


class InfoDataApiView(APIView):
    """
    API for Generic suite data
    """

    def get(self, request):

        res = requests.get('https://sit.comune.altamura.ba.it/it/portal/api/infodata/', verify=False)

        return Response(
            json.loads(res.content)
        )


class WhoamiApiView(APIView):
    """
    API for current user logged
    """

    def get(self, request):

        user = self.get_authenticated_user(request)

        if user.is_authenticated:
            token, created = Token.objects.get_or_create(user=user)
            ret = {
                'is_authenticated': True,
                'username': user.username,
                'email': user.email,
                'drf_token': token.key,
                'data': {
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            }

        else:
            ret = {
                'is_authenticated': False,
            }

        headers = get_response_headers(self, request)
        status = 200

        # 302 redirect after login
        if (user.is_authenticated and 'redirect' in request.GET):
            headers['Location'] = request.GET['redirect'] # TODO: ALLOWED_ORIGINS
            status = 302

        return Response(
            ret,
            status  = status,
            headers = headers
        )
    
    def get_authenticated_user(self, request, token_key  = '__drftk'):
        """
        Try to authenticate user against a token found within a GET request
        
        Example request:
        ```html
            <iframe hidden src="http://remotehost:8080/en/portal/api/whoami/?__drftk=<drf_token>"></iframe>
        ```
        """
        token_user = None

        # try to found token key into url
        if (token_key in request.GET):
            token = request.GET[token_key]
            token_user = Token.objects.get(key=token).user
            logger.debug('[PORTAL] G3W Auth Token found, try to authenticate "{}" user'.format(token_user))
            auth.login(
                request,
                token_user,
                backend='django.contrib.auth.backends.ModelBackend'
            )
        
        if token_user:
            request.user = token_user

        return request.user

    def get_response_headers(self, request, token_key  = '__drftk'):
        """
        Set appropriate `"Content-Security-Policy"` header when a token is found within a GET request 

        Example request:
        ```html
            <iframe hidden src="http://remotehost:8080/en/portal/api/whoami/?__drftk=<drf_token>"></iframe>
        ```
    
        Expected response:
        ```
            'Content-Security-Policy': "frame-ancestors 'self' http://remotehost:8080"
        ```

        Sample config:
        ```
            CSP_FRAME_SRC        = [ 'http://remotehost:8080' ] # OPTIONAL: fallbacks to CORS_ALLOWED_ORIGINS
            CORS_ALLOWED_ORIGINS = [ 'http://remotehost:8080' ] 
        ```
        """

        ## TODO check this settings again in future django releases ("django-csp" will be included in "django-core")
        # --------------------------------------------
        # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#frame-src
        # https://django-csp.readthedocs.io/en/3.5/configuration.html
        # https://github.com/mozilla/django-csp/issues/186
        csp_frame_src = getattr(settings, 'CSP_FRAME_SRC', getattr(settings, 'CORS_ALLOWED_ORIGINS', [])) 

        # try to found token key into url
        if (token_key in request.GET):
            return {
                'Content-Security-Policy': "frame-ancestors 'self' " + " ".join(csp_frame_src)
            }
        return None 

# class PicuresApiView(PortalApiViewMixin, generics.ListAPIView):
#     """
#     API list view for portal pictures
#     """
#
#     queryset = Picture.objects.order_by('id').all()
#     serializer_class = PictureSerializer


class PicuresApiView(APIView):
    """
    API for Generic suite data
    """

    def get(self, request):

        res = requests.get('https://sit.comune.altamura.ba.it/it/portal/api/pictures/', verify=False)

        return Response(
            json.loads(res.content)
        )
