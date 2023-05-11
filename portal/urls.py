# coding=utf-8
""" Portal urls
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'


from django.conf import settings
from django.urls import path, re_path
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

# For API urls:
# if `portal` module is not used as settings.FRONTEND_APP module, remove `portal\` from path
pre_api_url = 'portal/' if settings.FRONTEND_APP == 'portal' else ''



urlpatterns = [

    path(
        '',
        PortalView.as_view(),
        name='frontend'
    ),
    path(
        'jx/login/',
        LoginAjaxView.as_view(),
        name='portal-ajax-login'
    ),
    path(
        'jx/logout/',
        LogoutAjaxView.as_view(),
        name='portal-ajax-logout'
    ),

    # MOVE EVERY API URLS HERE TO USER I18N CAPABILITIES
    # --------------------------------------------------
    # Generic suite data
    path(
        f'{pre_api_url}api/infodata/',
        InfoDataApiView.as_view(),
        name='portal-infodata-api-list'
    ),

    # All Groups (filtered by user role)
    path(
        f'{pre_api_url}api/group/',
        GroupsApiView.as_view(),
        name='portal-group-api-list'
    ),

    # Return logged user info
    path(
        f'{pre_api_url}api/whoami/',
        WhoamiApiView.as_view(),
        name='portal-whoami-api'
    ),

    # All Projects (filtered by user role)
    path(
        f'{pre_api_url}api/project/',
        ProjectsApiView.as_view(),
        name='portal-project-api-list'
    ),


    # All Project (filtered by user role and groups)
    re_path(
        r'^{}api/group/(?P<group_id>[0-9]+)/projects/$'.format(pre_api_url),
        ProjectsApiView.as_view(),
        name='portal-project-by-group-api-list'
    ),

    # Groups by MacroGroup
    re_path(
        r'^{}api/group/(?P<macrogroup_id>[0-9]+)$'.format(pre_api_url),
        GroupsApiView.as_view(),
        name='portal-group-by-macrogroup-api-list'
    ),

    # Groups without MacroGroups
    path(
        f'{pre_api_url}api/group/nomacrogroup/',
        GroupsApiView.as_view(),
        name='portal-group-without-macrogroup-api-list'
    ),

    # All MacroGroups
    path(
        f'{pre_api_url}api/macrogroup/',
        MacroGroupsApiView.as_view(),
        name='portal-macrogroup-api-list'
    ),

    # Pictures manager
    # ------------------------------------
    path(
        f'{BASE_ADMIN_URLPATH}{pre_api_url}pictures/',
        login_required(PictureListView.as_view()),
        name='portal-picture'
    ),

    path(
        f'{BASE_ADMIN_URLPATH}{pre_api_url}pictures/add/',
        login_required(PictureCreateView.as_view()),
        name='portal-picture-add'
    ),

    path(
        f'{BASE_ADMIN_URLPATH}{pre_api_url}pictures/update/<int:pk>',
        login_required(PictureUpdateView.as_view()),
        name='portal-picture-update'
    ),

    path(
        f'{BASE_ADMIN_URLPATH}{pre_api_url}pictures/delete/<int:pk>',
        login_required(PictureDeleteView.as_view()),
        name='portal-picture-delete'
    ),

    # Picture api urls
    # --------------------------------------
    # All MacroGroups
    path(
        f'{pre_api_url}api/pictures/',
        PicuresApiView.as_view(),
        name='portal-picture-api-list'
    ),
]