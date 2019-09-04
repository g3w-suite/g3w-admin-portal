# -*- coding: utf-8 -*-
from __future__ import unicode_literals, absolute_import
""""Portal module filters

.. note:: This program is free software; you can redistribute it and/or modify
    it under the terms of the Mozilla Public License 2.0.

"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-08-04'
__copyright__ = 'Copyright 2019, Gis3w'


from django.contrib.auth.models import AnonymousUser
from rest_framework.filters import BaseFilterBackend
from core.models import *


class UserGroupFilter(BaseFilterBackend):
    """A filter backend for portal module"""

    def filter_queryset(self, request, queryset, view):
        """
        Return a filtered queryset by guardian grant
        """
        queryset = get_objects_for_user(request.user, 'core.view_group', Group).order_by('order') \
                 | get_objects_for_user(AnonymousUser(), 'core.view_group', Group).order_by('order')

        return queryset
