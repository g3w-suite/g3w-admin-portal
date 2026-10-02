# coding=utf-8
""" Base testing adn testing API for Portal
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__    = 'lorenzetti@gis3w.it'
__date__      = '2019-09-04'
__copyright__ = 'Copyright 2019, GIS3W'
__license__   = "MPL 2.0"

from django.conf import settings
from django.urls import reverse, get_resolver
from rest_framework.test import APIClient
import json
import os

from django.core.files import File
from qdjango.utils.data import QgisProject

from core.models import Group as CoreGroup, G3WSpatialRefSys, MacroGroup, GroupProjectPanoramic

from portal.models import Picture
from .test_base import PortalTestsBase, DATASOURCE_PATH, QGS_FILE_2

class PortalTestAPI(PortalTestsBase):
    """ Main portal test API class"""

    def test_whoami(self):
        """ Test whoami API: return data about user logged, if it's authenticated"""

        # instance API client
        client = APIClient()

        # user not logged(anonymoususer)
        url = reverse('portal-whoami-api')
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertFalse(jcontent['is_authenticated'])

        # user logged as viewer
        self.assertTrue(client.login(username=self.test_user3, password=self.test_user3))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertTrue(jcontent['is_authenticated'])
        self.assertEqual(jcontent['username'], self.test_user3.username)

        client.logout()


    def test_group(self):
        """ Test for group map """

        # instance API client
        client = APIClient()

        # user not logged(anonymoususer)
        url = reverse('portal-group-api-list')
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        # Group2 is public but has no projects: not listed
        self.assertEqual(len(jcontent), 0)

        # user logged as viewer: Group1 has a visible project
        self.assertTrue(client.login(username=self.test_user3, password=self.test_user3))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 1)
        self.assertEqual(jcontent[0]['id'], self.project_group.pk)
        self.assertNotIn('edit_url', jcontent[0])

        client.logout()

        # user logged as editor_level_2: sees Group1 but none of its projects
        self.assertTrue(client.login(username=self.test_user2, password=self.test_user2))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 0)

        client.logout()

        # user logged as admin: only groups with projects
        self.assertTrue(client.login(username=self.test_user_admin1, password=self.test_user_admin1))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 1)
        feature = jcontent[0]
        self.assertIn('edit_url', feature)
        group = CoreGroup.objects.filter(pk=feature['id'])[0]
        self.assertEqual(feature['edit_url'], reverse('group-update', kwargs={'slug': group.slug}))

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
        self.assertEqual(len(jcontent), 0)

        # user logged as admin
        self.assertTrue(client.login(username=self.test_user_admin1.username, password=self.test_user_admin1.username))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 2)

        # check for project data
        result = jcontent[0]
        self.assertEqual(self.project.pk, result['id'])
        self.assertEqual(self.project.title, result['title'])
        map_url = reverse('group-project-map', kwargs={
            'group_slug': self.project.group.slug,
            'project_type': 'qdjango',
            'project_id': self.project.pk
        })
        self.assertEqual(map_url, result['map_url'])
        edit_url = reverse('qdjango-project-update', kwargs={
            'group_slug': self.project.group.slug,
            'slug': self.project.slug
        })
        self.assertEqual(edit_url, result['edit_url'])

        url_by_group = reverse('portal-project-by-group-api-list', kwargs={'group_id': self.project_group.pk})
        response = client.get(url_by_group)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 2)

        url_by_group = reverse('portal-project-by-group-api-list', kwargs={'group_id': self.project_group2.pk})
        response = client.get(url_by_group)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 0)

        client.logout()

        # user logged as user2
        self.assertTrue(client.login(username=self.test_user2.username, password=self.test_user2.username))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 0)
        client.logout()

        # ser logged as user3
        self.assertTrue(client.login(username=self.test_user3.username, password=self.test_user3.username))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 1)
        self.assertNotIn('edit_url', jcontent[0])

    def test_macrogroup(self):
        """ Test for macrogroup """

        # instance API client
        client = APIClient()

        # user not logged: the only public group has no projects, so no macrogroup
        url = reverse('portal-macrogroup-api-list')
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 0)

        # user logged as admin
        self.assertTrue(client.login(username=self.test_user_admin1.username, password=self.test_user_admin1.username))
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 2)
        feature = jcontent[0]
        macrogroup = MacroGroup.objects.filter(pk=feature['id'])[0]
        self.assertIn('edit_url', feature)
        edit_url = reverse('macrogroup-update', kwargs={
            'slug': macrogroup.slug
        })
        self.assertEqual(edit_url, feature['edit_url'])

        client.logout()

        # get group by macrogroup id
        # user not logged: no visible groups in any macrogroup
        url = reverse('portal-group-by-macrogroup-api-list', kwargs={'macrogroup_id': self.macrogroup.pk})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 0)

        url = reverse('portal-group-by-macrogroup-api-list', kwargs={'macrogroup_id': self.macrogroup2.pk})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 0)

        # user logged as admin: Macrogroup1 1 group, Macrogroup2 1 group (Group2 has no projects)
        self.assertTrue(client.login(username=self.test_user_admin1.username, password=self.test_user_admin1.username))
        url = reverse('portal-group-by-macrogroup-api-list', kwargs={'macrogroup_id': self.macrogroup.pk})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 1)
        feature = jcontent[0]
        self.assertEqual(feature['id'], self.project_group.pk)
        group = CoreGroup.objects.filter(pk=feature['id'])[0]
        edit_url = reverse('group-update', kwargs={
            'slug': group.slug
        })
        self.assertEqual(edit_url, feature['edit_url'])

        url = reverse('portal-group-by-macrogroup-api-list', kwargs={'macrogroup_id': self.macrogroup2.pk})
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 1)

        # check Group without MacroGroup
        url = reverse('portal-group-without-macrogroup-api-list')
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 0)

        # a new group without macrogroup and without projects is not listed
        new_group = CoreGroup(name='Group33', title='Group33', header_logo_img='',
                  srid=G3WSpatialRefSys.objects.get(auth_srid=4326))
        new_group.save()

        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 0)

        # ... until it gets a project
        with open(os.path.join(DATASOURCE_PATH, QGS_FILE_2), 'r') as f:
            qgis_project = QgisProject(File(f))
            qgis_project.group = new_group
            qgis_project.save()

        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 1)
        self.assertEqual(jcontent[0]['name'], 'Group33')

        client.logout()

    def test_genericsuitedata(self):
        """ Test for Generic suite data """

        # instance API client
        client = APIClient()

        # user not logged(anonymoususer)
        url = reverse('portal-infodata-api-list')
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)

        self.assertTrue('title' in jcontent and 'about_name' in jcontent)

    def test_picture_list(self):
        """ Test for Portal picture lista API """

        pics = Picture.objects.all().order_by('id')

        # instance API client
        client = APIClient()

        # user not logged(anonymoususer)
        url = reverse('portal-picture-api-list')
        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)

        self.assertEqual(len(jcontent), len(pics))

        p = pics[0]
        jp = jcontent[0]

        self.assertEqual(p.author, jp['author'])
        self.assertEqual(p.author_url, jp['author_url'])

        media_url = getattr(self.settings, 'MEDIA_URL', '/media/')
        self.assertEqual('%s%s' % (media_url, p.image), jp['image'])

    def test_panoramic_project_filter(self):
        """Test filter remove panoramic project"""

        # instance API client
        client = APIClient()

        url = reverse('portal-project-api-list')

        self.assertTrue(client.login(username=self.test_user_admin1.username, password=self.test_user_admin1.username))

        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 2)

        # set project as panoramic
        gpp = GroupProjectPanoramic.objects.create(group_id=self.project_group.pk, project_type='qdjango',
                                             project_id=self.project.pk)

        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 1)

        #remove project as panoramic
        gpp.delete()

        response = client.get(url)
        self.assertEqual(response.status_code, 200)
        jcontent = json.loads(response.content)
        self.assertEqual(len(jcontent), 2)

        client.logout()