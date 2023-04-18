# coding=utf-8
"""Portal API views
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__    = 'lorenzetti@gis3w.it'
__date__      = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'
__license__   = 'MPL 2.0'

from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.contrib import auth
from django.conf import settings

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

import logging

from .serializers import *
from .filters import *

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
        PanoramicProjectFilter
    )


class GroupsApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for map groups
    """

    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    filter_backends = (
        UserGroupFilter,
        MacroGroupGroupFilter
    )


class MacroGroupsApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for map macrogroups
    """

    queryset = MacroGroup.objects.all()
    serializer_class = MacroGroupSerializer


class InfoDataApiView(generics.RetrieveAPIView):
    """
    API for Generic suite data
    """

    queryset = GeneralSuiteData.objects.all()
    serializer_class = GenericSuiteDataSerializer

    def get_object(self):
        return self.get_queryset()[0]

@method_decorator(xframe_options_exempt, name='dispatch')
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

        return Response(ret)
    
    def get_authenticated_user(self, request):
        """
        Try to authenticate user against a token found within a GET request
        
        Example usage:
            <iframe hidden src="http://remotehost:8000/it/portal/api/whoami/?__drftk=<drf_token>"></iframe>
        
        Default key:
            G3W_AUTHTOKEN_KEY = '__drftk'.
        """

        # get token key
        token_key  = getattr(settings, 'G3W_AUTHTOKEN_KEY', '__drftk')
        token_user = None

        # try to found into url
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


class PicuresApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for portal pictures
    """

    queryset = Picture.objects.order_by('id').all()
    serializer_class = PictureSerializer



