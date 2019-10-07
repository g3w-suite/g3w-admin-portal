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
from qdjango.models import Project


class ProjectSerializer(serializers.ModelSerializer):
    """
    Map group serializer for portal
    """
    class Meta:
        model = Project
        fields = (
            'id',
            'title',
            'description',
            'thumbnail'
        )


class GroupSerializer(serializers.ModelSerializer):
    """
    Map group serializer for portal
    """
    class Meta:
        model = Group
        fields = (
            'id',
            'name',
            'title',
            'srid',
            'header_logo_link',
            'header_logo_img'
        )


class MacroGroupSerializer(serializers.ModelSerializer):
    """
    Map macrogroup serializer for portal
    """
    class Meta:
        model = MacroGroup
        fields = (
            'id',
            'title',
            'description',
            'logo_img',
            'logo_link'
        )


class GenericSuiteDataSerializer(serializers.ModelSerializer):
    """
    Generic suite data
    """
    class Meta:
        model = GeneralSuiteData
        fields = '__all__'