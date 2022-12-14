# coding=utf-8
""" Portal urls
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'


from django.conf.urls import include, url
from django.urls import path
from django.contrib.auth.decorators import login_required
from base.urls import BASE_ADMIN_URLPATH
from .views import (
    LoginAjaxView,
    LogoutAjaxView,
    PortalView,
    PictureListView,
    PictureCreateView,
    PictureUpdateView,
    PictureDeleteView,
)
from .api.views import (
    InfoDataApiView,
    GroupsApiView,
    WhoamiApiView,
    MacroGroupsApiView,
    ProjectsApiView,
    PicuresApiView
)

urlpatterns = [

    url(
        r'^$',
        PortalView.as_view(),
        name='frontend'
    ),
    url(
        r'^jx/login/$',
        LoginAjaxView.as_view(),
        name='portal-ajax-login'
    ),
    url(
        r'^jx/logout/$',
        LogoutAjaxView.as_view(),
        name='portal-ajax-logout'
    ),

    # MOVE EVERY API URLS HERE TO USER I18N CAPABILITIES
    # --------------------------------------------------
    # Generic suite data
    url(
        r'^portal/api/infodata/$',
        InfoDataApiView.as_view(),
        name='portal-infodata-api-list'
    ),

    # All Groups (filtered by user role)
    url(
        r'^portal/api/group/$',
        GroupsApiView.as_view(),
        name='portal-group-api-list'
    ),

    # Return logged user info
    url(
        r'^portal/api/whoami/$',
        WhoamiApiView.as_view(),
        name='portal-whoami-api'
    ),

    # All Projects (filtered by user role)
    url(
        r'^portal/api/project/$',
        ProjectsApiView.as_view(),
        name='portal-project-api-list'
    ),


    # All Project (filtered by user role and groups)
    url(
        r'^portal/api/group/(?P<group_id>[0-9]+)/projects/$',
        ProjectsApiView.as_view(),
        name='portal-project-by-group-api-list'
    ),

    # Groups by MacroGroup
    url(
        r'^portal/api/group/(?P<macrogroup_id>[0-9]+)$',
        GroupsApiView.as_view(),
        name='portal-group-by-macrogroup-api-list'
    ),

    # Groups without MacroGroups
    url(
        r'^portal/api/group/nomacrogroup/$',
        GroupsApiView.as_view(),
        name='portal-group-without-macrogroup-api-list'
    ),

    # All MacroGroups
    url(
        r'^portal/api/macrogroup/$',
        MacroGroupsApiView.as_view(),
        name='portal-macrogroup-api-list'
    ),

    # Pictures manager
    # ------------------------------------
    url(
        r'^{}portal/pictures/$'.format(BASE_ADMIN_URLPATH),
        login_required(PictureListView.as_view()),
        name='portal-picture'
    ),

    url(
        r'^{}portal/pictures/add/$'.format(BASE_ADMIN_URLPATH),
        login_required(PictureCreateView.as_view()),
        name='portal-picture-add'
    ),

    path(
        '{}portal/pictures/update/<int:pk>'.format(BASE_ADMIN_URLPATH),
        login_required(PictureUpdateView.as_view()),
        name='portal-picture-update'
    ),

    path(
        '{}portal/pictures/delete/<int:pk>'.format(BASE_ADMIN_URLPATH),
        login_required(PictureDeleteView.as_view()),
        name='portal-picture-delete'
    ),

    # Picture api urls
    # --------------------------------------
    # All MacroGroups
    path(
        'portal/api/pictures/',
        PicuresApiView.as_view(),
        name='portal-picture-api-list'
    )
]