# coding=utf-8
""" Portal views
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-10'
__copyright__ = 'Copyright 2019, GIS3W'


from django.views.generic.edit import BaseFormView
from django.http import JsonResponse
from django.contrib.auth import login as auth_login
from django.contrib.auth.forms import AuthenticationForm


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