# coding=utf-8
"""Protal API viewes
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import *
from .filters import *


class PortalApiViewMixin(object):

    # to remove pagination for portal api
    pagination_class = None


class ProjectsApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for map projects
    """

    queryset = Project.objects.all()
    serializer_class = ProjectSerializer



    filter_backends = (
        UserProjectFilter,
        GroupProjectFilter
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


class WhoamiApiView(APIView):
    """
    API for current user logged
    """

    def get(self, request):

        user = self.request.user

        if user.is_authenticated:
            ret = {
                'is_authenticated': True,
                'username': user.username,
                'email': user.email,
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


class PicuresApiView(PortalApiViewMixin, generics.ListAPIView):
    """
    API list view for portal pictures
    """

    queryset = Picture.objects.order_by('id').all()
    serializer_class = PictureSerializer



