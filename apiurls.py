# -*- coding: utf-8 -*-
from __future__ import unicode_literals
""" Portal API urls
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'

from django.conf.urls import url
from .api.views import *


urlpatterns = [

    # All Projects (filtered by user role)
    url(r'^api/project/$', ProjectsApiView.as_view(), name='portal-project-api-list'),

    # All Groups (filtered by user role)
    url(r'^api/group/$', GroupsApiView.as_view(), name='portal-group-api-list'),

    # All MacroGroupS
    url(r'^api/macrogroup/$', MacroGroupsApiView.as_view(), name='portal-macrogroup-api-list')
]