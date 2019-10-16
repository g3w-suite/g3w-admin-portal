# coding=utf-8
""" Portal views tests
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-10'
__copyright__ = 'Copyright 2019, GIS3W'


from django.urls import reverse
from django.test import Client
from .test_api import PortalTestsBase
import json


class PortalViewsTest(PortalTestsBase):

    def test_index(self):
        """ test index page"""
        url = reverse('portal')

        # instance client
        client = Client()

        response = client.get(url)

        self.assertEqual(response.status_code, 200)

    def test_ajax_login(self):
        """ Test Ajax login"""
        url = reverse('portal-ajax-login')

        # instance client
        client = Client()

        # test login true
        response = client.post(url, {
            'username': self.test_user_admin1.username,
            'password': self.test_user_admin1.username
        })

        self.assertTrue(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['status'], 'ok')

        client.logout()

        # test not login
        response = client.post(url, {
            'username': 'xxxxx',
            'password': 'xxxxx'
        })

        self.assertTrue(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['status'], 'error')