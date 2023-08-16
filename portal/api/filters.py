# -*- coding: utf-8 -*-
from __future__ import unicode_literals, absolute_import
""""Portal module filters

.. note:: This program is free software; you can redistribute it and/or modify
    it under the terms of the Mozilla Public License 2.0.

"""

__author__    = 'lorenzetti@gis3w.it'
__date__      = '2019-08-04'
__copyright__ = 'Copyright 2019, Gis3w'
__license__   = "MPL 2.0"


from django.contrib.auth.models import AnonymousUser
from django.urls                import resolve
from django.db.models           import Q
from rest_framework.filters     import BaseFilterBackend

from core.models                import *
from qdjango.models             import Project

class ProjectsAPIFilter(BaseFilterBackend):
    """A filter backend for portal module"""

    def filter_queryset(self, request, queryset, view):

        url_name        = resolve(request.path_info).url_name

        user_projects   = get_objects_for_user(request.user, 'qdjango.view_project', Project)
        public_projects = get_objects_for_user(AnonymousUser(), 'qdjango.view_project', Project)

        # filter by user role
        queryset = (user_projects | public_projects).order_by('title')

        # filter by "group_id"
        if 'group_id' in view.kwargs:
            queryset = queryset.filter(group_id=view.kwargs['group_id']).order_by('order')

        # filter by not panoramic (skipped when number of projects == 1)
        if len(queryset) > 1:
            queryset = queryset.filter(~Q(pk__in=[g.project_id for g in GroupProjectPanoramic.objects.all()]))

        ##
        # Example:
        # 
        # filter projects by specific "macrogroup_name"
        #
        # PORTAL_PROJECTS_FILTER = { 'macrogroups__name': 'ALTAMURA' }
        ##
        if (
            hasattr(settings, 'PORTAL_PROJECTS_FILTER') and
            url_name == 'portal-project-api-list'
        ):
            groups   = Group.objects.filter(**getattr(settings, 'PORTAL_PROJECTS_FILTER'))
            queryset = queryset.filter(group__pk__in=[g.pk for g in groups])

        # filter by active projects
        return queryset.filter(is_active=True)


class GroupsAPIFilter(BaseFilterBackend):
    """A filter backend for portal module"""

    def filter_queryset(self, request, queryset, view):

        url_name      = resolve(request.path_info).url_name

        user_groups   = get_objects_for_user(request.user, 'core.view_group', Group)
        public_groups = get_objects_for_user(AnonymousUser(), 'core.view_group', Group)

        # filter by user role
        queryset = (user_groups | public_groups).order_by('order')

        # filter by "macrogroup_id"
        if 'macrogroup_id' in view.kwargs:
            queryset = queryset.filter(macrogroups__pk=view.kwargs['macrogroup_id'])

        ##
        # Example:
        # 
        # filter groups by specific "macrogroup_name"
        #
        # PORTAL_GROUPS_FILTER = { 'macrogroups__name': 'ALTAMURA' }
        ##
        if (
            hasattr(settings, 'PORTAL_DEFAULT_GROUPS_FILTER') and
            url_name in ('portal-group-api-list', 'portal-group-without-macrogroup-api-list')
        ):
            groups = Group.objects.filter(**getattr(settings, 'PORTAL_GROUPS_FILTER'))
            queryset = queryset.filter(pk__in=[g.pk for g in groups])

        # check for group without macrogroup
        elif (url_name == 'portal-group-without-macrogroup-api-list'):
             queryset = queryset.filter(macrogroups__pk=None)

        # filter by active groups
        return queryset.filter(is_active=True)

class MacroGroupsAPIFilter(BaseFilterBackend):
    """A filter backend for portal module"""

    def filter_queryset(self, request, queryset, view):

        ##
        # Example:
        # 
        # hide macrogroups on frontend (returns empty list)
        #
        # PORTAL_MAGROGROUPS_FILTER = { "pk": -9999 }
        ##
        if (hasattr(settings, 'PORTAL_MACROGROUPS_FILTER')):
           queryset = queryset.filter(**getattr(settings, 'PORTAL_MACROGROUPS_FILTER'))

        return queryset