# coding=utf-8
"""Protal API viewes
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'

from rest_framework import generics
from .serializers import *
from .filters import *


class ProjectsApiView(generics.ListAPIView):
    """
    API list view for map projects
    """

    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    #filter_backends = (UserGroupFilter, )


class GroupsApiView(generics.ListAPIView):
    """
    API list view for map groups
    """

    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    filter_backends = (UserGroupFilter, )


class MacroGroupsApiView(generics.ListAPIView):
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
