# coding=utf-8
""" Portal urls
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'


from django.conf.urls import url
from .views import LoginAjaxView, LogoutAjaxView, PortalView
from .api.views import InfoDataApiView

urlpatterns = [
    url(r'^$', PortalView.as_view(), name='frontend'),
    url(r'^jx/login/$', LoginAjaxView.as_view(), name='portal-ajax-login'),
    url(r'^jx/logout/$', LogoutAjaxView.as_view(), name='portal-ajax-logout'),

    # Generic suite data
    url(r'^portal/api/infodata/$', InfoDataApiView.as_view(), name='portal-infodata-api-list')

]