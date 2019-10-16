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
from django.urls import reverse


class ProjectSerializer(serializers.ModelSerializer):
    """
    Map group serializer for portal
    """
    map_url = serializers.SerializerMethodField()

    def get_map_url(self, instance):
        """ Return map url"""
        return reverse('group-project-map', kwargs={
            'group_slug': instance.group.slug,
            'project_type': 'qdjango',
            'project_id': instance.pk
        })

    def to_representation(self, instance):

        feature = super(ProjectSerializer, self).to_representation(instance)

        # add editing url if user has grant
        if self._context['request'].user.has_perm('qdjango.change_project', instance):
            feature['edit_url'] = reverse('qdjango-project-update', kwargs={
            'group_slug': instance.group.slug,
            'slug': instance.slug
        })

        return feature

    class Meta:
        model = Project
        fields = (
            'id',
            'title',
            'description',
            'thumbnail',
            'map_url'
        )


class GroupSerializer(serializers.ModelSerializer):
    """
    Map group serializer for portal
    """

    def to_representation(self, instance):

        feature = super(GroupSerializer, self).to_representation(instance)

        # add editing url if user has grant
        if self._context['request'].user.has_perm('core.change_group', instance):
            feature['edit_url'] = reverse('group-update', kwargs={
            'slug': instance.slug
        })

        return feature

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

    def to_representation(self, instance):

        feature = super(MacroGroupSerializer, self).to_representation(instance)

        # add editing url if user has grant
        if self._context['request'].user.has_perm('core.change_macrogroup', instance):
            feature['edit_url'] = reverse('macrogroup-update', kwargs={
            'slug': instance.slug
        })

        return feature

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