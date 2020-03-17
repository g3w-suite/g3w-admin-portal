# coding=utf-8
""" Portal views
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-10'
__copyright__ = 'Copyright 2019, GIS3W'


from django.conf import settings
from django.views.generic.edit import BaseFormView
from django.views.generic import TemplateView, View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import login as auth_login, logout as auth_logout
from django.contrib.auth.forms import AuthenticationForm


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
            'IS_PA': getattr(settings, 'PORTAL_IS_PA', False),
            'API_BASE_URL': '/'
        }
