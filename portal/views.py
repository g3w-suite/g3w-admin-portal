# coding=utf-8
""" Portal views
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-10'
__copyright__ = 'Copyright 2019, GIS3W'

import json

from django.conf import settings
from django.views.generic.edit import BaseFormView, SingleObjectMixin
from django.views.generic import TemplateView, View, ListView, CreateView, UpdateView
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.urls import reverse
from usersmanage.decorators import user_passes_test_or_403
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.contrib.auth.forms import AuthenticationForm
from core.mixins.views import G3WAjaxDeleteViewMixin
from .models import Picture
from .forms import PictureForm


@method_decorator(csrf_exempt, name='dispatch')
class LoginAjaxView(BaseFormView):
    """
    View to make login by ajax call
    """
    form_class = AuthenticationForm

    def form_invalid(self, form):
        return JsonResponse({'status': 'error', 'errors_form': form.errors})

    def form_valid(self, form):
        auth_login(self.request, form.get_user())
        return JsonResponse({'status': 'ok', 'message': 'Login'})


class LogoutAjaxView(View):
    """
    View to make logout by ajax call
    """

    def get(self, request, *args, **kwargs):
        auth_logout(self.request)
        return JsonResponse({'status': 'ok', 'message': 'Logout'})


class PortalView(TemplateView):
    """
    Base index portal view
    """
    template_name = 'portal/index.html'

    def get_context_data(self, **kwargs):
        return {

            # TODO optional setting for API_BASE_URL (cross domain API) 
            'API_BASE_URL': self.request.build_absolute_uri('/'),

            # TODO optional setting for ADMIN_BASE_URL (cross domain ADMIN) 
            'ADMIN_BASE_URL': self.request.build_absolute_uri('/admin'),

            'LANGUAGES': [l[0] for l in settings.LANGUAGES],

            # DEPRECATED since v1.0.0
            'IS_PA': getattr(settings, 'PORTAL_IS_PA', False),
            
            # DEPRECATED since v1.0.0
            'PORTAL_SECTIONS': json.dumps(getattr(settings, 'PORTAL_SECTIONS', [])),
            
            # DEPRECATED since v1.0.0
            'ADMIN_BTN': json.dumps(getattr(settings, 'PORTAL_ADMIN_BTN', False)),
            
            # DEPRECATED since v1.0.0
            'PORTAL_COLOR': getattr(settings, 'PORTAL_COLOR', 'violet'),

        }


class PictureListView(ListView):
    """ Main frontend picture list"""

    model = Picture
    template_name = 'portal/picture_list.html'

    @method_decorator(user_passes_test_or_403(lambda u: u.is_superuser))
    def dispatch(self, *args, **kwargs):
        return super(PictureListView, self).dispatch(*args, **kwargs)


class PictureViewMixin(object):
    """ Mixin for common properties and methods between Picture CRUD views """
    model = Picture
    form_class = PictureForm
    template_name = 'portal/picture_form.html'

    @method_decorator(user_passes_test_or_403(lambda u: u.is_superuser))
    def dispatch(self, *args, **kwargs):
        return super(PictureViewMixin, self).dispatch(*args, **kwargs)

    def get_success_url(self):

        # return to picture list
        return reverse('portal-picture')


class PictureCreateView(PictureViewMixin, CreateView):
    """ Create picture form view"""
    pass


class PictureUpdateView(PictureViewMixin, UpdateView):
    """ Update picture from view """


class PictureDeleteView(PictureViewMixin, G3WAjaxDeleteViewMixin, SingleObjectMixin, View):
    """ Delete picture Ajax view """
    pass
