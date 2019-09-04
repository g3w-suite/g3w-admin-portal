# -*- coding: utf-8 -*-
from __future__ import unicode_literals

"""
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'


from rest_framework import serializers
from core.models import *


class GroupSerializer(serializers.ModelSerializer):
    """
    Map group serializer for portal
    """
    class Meta:
        model = Group
        fields = (
            'id',
            'name',
            'header_logo_img'
        )