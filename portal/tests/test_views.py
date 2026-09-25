# coding=utf-8
""" Portal views tests
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__    = 'lorenzetti@gis3w.it'
__date__      = '2019-09-10'
__copyright__ = 'Copyright 2019, GIS3W'
__license__   = "MPL 2.0"

from django.conf import settings
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client
import json

from .test_base import PortalTestsBase

class PortalViewsTest(PortalTestsBase):

    def test_index(self):

        """ test index page"""
        url = reverse('frontend')

        # instance client
        client = Client()

        response = client.get(url)

        self.assertEqual(response.status_code, 200)

    def test_ajax_login_logout(self):
        """ Test Ajax login"""
        url = reverse('portal-ajax-login')

        # instance client
        client = Client()

        # test login
        response = client.post(url, {
            'username': self.test_user_admin1.username,
            'password': self.test_user_admin1.username
        })

        self.assertTrue(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['status'], 'ok')

        # test logout
        url_logout = reverse('portal-ajax-logout')
        response = client.get(url_logout)
        self.assertTrue(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['status'], 'ok')
        self.assertEqual(jcontent['message'], 'Logout')

        # test not login
        response = client.post(url, {
            'username': 'xxxxx',
            'password': 'xxxxx'
        })

        self.assertTrue(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['status'], 'error')

    def test_picture_list(self):
        """ Test picture list view """

        url = reverse('portal-picture')

        # instance client
        client = Client()

        # test login required
        response = client.get(url)

        # redirect to login page
        self.assertEqual(response.status_code, 302)

        # test 403 for not admin user: login as editor level 1
        self.assertTrue(client.login(username=self.test_user1, password=self.test_user1))

        response = client.get(url)
        self.assertEqual(response.status_code, 403)

        client.logout()

        # test 200 for admin user
        self.assertTrue(client.login(username=self.test_user_admin1, password=self.test_user_admin1))

        response = client.get(url)
        self.assertEqual(response.status_code, 200)

        client.logout()

    def test_picture_create_update(self):
        """ Test picture create view """

        url = reverse('portal-picture-add')

        # instance client
        client = Client()

        # test login required
        response = client.get(url)

        # redirect to login page
        self.assertEqual(response.status_code, 302)

        # test 403 for not admin user: login as editor level 1
        self.assertTrue(client.login(username=self.test_user1, password=self.test_user1))

        response = client.get(url)
        self.assertEqual(response.status_code, 403)

        client.logout()

        # test 200 for admin user
        self.assertTrue(client.login(username=self.test_user_admin1, password=self.test_user_admin1))

        response = client.get(url)
        self.assertEqual(response.status_code, 200)

        """
        with open('%sportal_image_test.png' % (DATASOURCE_PATH), 'rb') as test_image:

            # test create record
            response = client.post(url, data={
                'image': SimpleUploadedFile('portal_image_test.png', test_image.read()),
                'author': 'walter lorenzetti'
            })

        self.assertEqual(response.status_code, 200)

        m_picture = Picture.objects.get(author='walter lorenzetti')
        """

        client.logout()




