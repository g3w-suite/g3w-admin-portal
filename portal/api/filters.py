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


class VisibleProjectsMixin(object):
    """Resolves the projects visible to the request user or to anonymous/public access"""

    def get_visible_projects(self, request):
        user_projects   = get_objects_for_user(request.user, 'qdjango.view_project', Project)
        public_projects = get_objects_for_user(AnonymousUser(), 'qdjango.view_project', Project)
        return (user_projects | public_projects).filter(is_active=True)


class VisibleGroupsMixin(VisibleProjectsMixin):
    """Resolves the groups visible to the request user or to anonymous/public access, with visible projects inside"""

    def get_visible_groups(self, request):
        user_groups   = get_objects_for_user(request.user, 'core.view_group', Group)
        public_groups = get_objects_for_user(AnonymousUser(), 'core.view_group', Group)
        return (user_groups | public_groups).filter(is_active=True) \
            .filter(qdjango_project__in=self.get_visible_projects(request))


class GroupsAPIFilter(VisibleGroupsMixin, BaseFilterBackend):
    """A filter backend for portal module"""

    def filter_queryset(self, request, queryset, view):

        url_name = resolve(request.path_info).url_name

        # filter by user role and visible projects
        queryset = self.get_visible_groups(request).order_by('order')

        # filter by "macrogroup_id"
        if 'macrogroup_id' in view.kwargs:
            queryset = queryset.filter(macrogroups__pk=view.kwargs['macrogroup_id'])

        queryset = queryset.distinct()

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

        # groups queryset is already restricted to active/visible ones
        return queryset

class MacroGroupsAPIFilter(VisibleGroupsMixin, BaseFilterBackend):
    """A filter backend for portal module"""

    def filter_queryset(self, request, queryset, view):

        # keep only macrogroups with at least one visible, active group that has visible projects
        queryset = queryset.filter(group__in=self.get_visible_groups(request)).distinct()

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