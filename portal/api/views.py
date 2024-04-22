# coding=utf-8
"""Portal API views
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__    = 'lorenzetti@gis3w.it'
__date__      = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'
__license__   = 'MPL 2.0'

from django.contrib                  import auth
from django.conf                     import settings

from rest_framework                  import generics
from rest_framework.views            import APIView
from rest_framework.response         import Response
from rest_framework.authtoken.models import Token

import logging

from portal.api.serializers          import *
from portal.api.filters              import *
from portal.utils                    import get_response_headers

logger = logging.getLogger('g3wadmin.debug')


class PortalApiViewMixin(object):

    # remove pagination for portal api
    pagination_class = None


class ProjectsApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for map projects
    """

    queryset = Project.objects.all().order_by('order')
    serializer_class = ProjectSerializer
    pagination_class = None

    filter_backends = (
        ProjectsAPIFilter,
    )

    def get_serializer(self, *args, **kwargs):

        # Add request instance
        kwargs.update({
            'request': self.request
        })
        return super().get_serializer(*args, **kwargs)


class GroupsApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for map groups
    """

    queryset = Group.objects.all().order_by('order')
    serializer_class = GroupSerializer

    filter_backends = (
        GroupsAPIFilter,
    )


class MacroGroupsApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for map macrogroups
    """

    queryset = MacroGroup.objects.all().order_by('order')
    serializer_class = MacroGroupSerializer

    filter_backends = (
        MacroGroupsAPIFilter,
    )


class InfoDataApiView(generics.RetrieveAPIView):
    """
    API for Generic suite data
    """

    queryset = GeneralSuiteData.objects.all()
    serializer_class = GenericSuiteDataSerializer

    def get_object(self):
        return self.get_queryset()[0]

class WhoamiApiView(APIView):
    """
    API for current user logged
    """

    def get(self, request):

        user = self.get_authenticated_user(request)

        if user.is_authenticated:
            token, created = Token.objects.get_or_create(user=user)
            data = {
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
            data = {
                'is_authenticated': False,
            }

        headers = get_response_headers(self, request)
        status = 200

        # 302 redirect after login
        if (user.is_authenticated and 'redirect' in request.GET):
            headers['Location'] = request.GET['redirect'] # TODO: ALLOWED_ORIGINS
            status = 302

        return Response(
            data,
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

class PicuresApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for portal pictures
    """

    queryset = Picture.objects.order_by('id').all()
    serializer_class = PictureSerializer



