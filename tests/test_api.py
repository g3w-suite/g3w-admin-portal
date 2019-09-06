# coding=utf-8
""" Base testing adn testing API for Portal
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'

from django.conf import settings
from django.test import TestCase, override_settings
from django.urls import reverse
from guardian.compat import get_user_model
from rest_framework.test import APIClient
from usersmanage.models import User, Group as UserGroup
from core.models import Group as CoreGroup, G3WSpatialRefSys, MacroGroup
import os
import json


CURRENT_PATH = os.getcwd()
TEST_BASE_PATH = '/editing/tests/data/'
DATASOURCE_PATH = '{}{}'.format(CURRENT_PATH, TEST_BASE_PATH)

@override_settings(CACHES = {
        'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'some',
        }
    },
    DATASOURCE_PATH=DATASOURCE_PATH,
    G3WADMIN_LOCAL_MORE_APPS=[
    'editing',
])
class PortalTestsBase(TestCase):
    """Base class for Portal tests"""

    fixtures = ['BaseLayer.json',
                'G3WMapControls.json',
                'G3WSpatialRefSys.json',
                'G3WGeneralDataSuite.json'
                ]

    @classmethod
    def setUpTestData(cls):
        # Admin level 1
        cls.test_user_admin1 = User.objects.create_user(username='admin01', password='admin01')
        cls.test_user_admin1.is_superuser = True
        cls.test_user_admin1.save()

        # Editor level 1
        cls.test_user1 = User.objects.create_user(username='user01', password='user01')
        cls.group = UserGroup.objects.get(name='Editor Level 1')
        cls.test_user1.groups.add(cls.group)
        cls.test_user1.save()

        # Editor level 2
        cls.test_user2 = User.objects.create_user(username='user02', password='user02')
        cls.group = UserGroup.objects.get(name='Editor Level 2')
        cls.test_user2.groups.add(cls.group)
        cls.test_user2.save()

        cls.test_user3 = User.objects.create_user(username='user03', password='user03')
        cls.group = UserGroup.objects.get(name='Viewer Level 1')
        cls.test_user3.groups.add(cls.group)
        cls.test_user3.save()

        cls.test_user4 = User.objects.create_user(username='user04', password='user04')
        cls.test_user4.groups.add(cls.group)
        cls.test_user3.save()

        cls.project_group = CoreGroup(name='Group1', title='Group1', header_logo_img='',
                                      srid=G3WSpatialRefSys.objects.get(auth_srid=4326))

        cls.project_group.save()
        cls.project_group.addPermissionsToEditor(cls.test_user2)

        cls.project_group2 = CoreGroup(name='Group2', title='Group2', header_logo_img='',
                                      srid=G3WSpatialRefSys.objects.get(auth_srid=4326))

        cls.project_group2.save()

        # create macrogroups
        cls.macrogroup = MacroGroup(title='Macrogroup1', logo_img='macrogroup.png')
        cls.macrogroup.save()
        cls.project_group2.macrogroups.add(cls.macrogroup)

        # add permission to anonymous and viewer
        cls.project_group2.addPermissionsToViewers(users_id=[cls.test_user3.pk, get_user_model().get_anonymous().pk])


class PortalTestAPI(PortalTestsBase):
    """ Main portal test API class"""

    def test_group(self):
        """ Test for group map """

        # instance API client
        client = APIClient()

        # user not logged(anonymoususer)
        url = reverse('portal-group-api-list')
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['count'], 1)

        # user logged as viewer
        self.assertTrue(client.login(username=self.test_user3, password=self.test_user3))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['count'], 1)

        client.logout()

        # user logged as admin
        self.assertTrue(client.login(username=self.test_user_admin1, password=self.test_user_admin1))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['count'], 2)

        client.logout()

    def test_project(self):
        """ Test api for qdjango projects """

        # instance API client
        client = APIClient()

        # user not logged(anonymoususer)
        url = reverse('portal-project-api-list')
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['count'], 0)

    def test_macrogroup(self):
        """ Test for macrogroup """

        # instance API client
        client = APIClient()

        # user not logged(anonymoususer)
        url = reverse('portal-macrogroup-api-list')
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(jcontent['count'], 1)
