# coding=utf-8
"""Protal API viewes
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'

from rest_framework import generics
from core.models import Group
from .serializers import *
from .filters import *


class GroupsApiView(generics.ListAPIView):
    """
    API list view for map groups
    """

    queryset = Group.objects.all()

    serializer_class = GroupSerializer

    filter_backends = (UserGroupFilter, )

