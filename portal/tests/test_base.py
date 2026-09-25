from django.conf import settings
from django.test import TestCase, override_settings
from django.test.signals import setting_changed
from django.dispatch import receiver
from django.urls import clear_url_caches
from django.core.files import File
from django.utils import translation
from qdjango.utils.data import QgisProject
from guardian.compat import get_user_model
from usersmanage.models import User, Group as UserGroup
from core.models import Group as CoreGroup, G3WSpatialRefSys, MacroGroup

import base.urls as base_urls
import importlib
import os

CURRENT_PATH = os.path.dirname(os.path.realpath(__file__))
TEST_BASE_PATH = '/data/'
DATASOURCE_PATH = '{}{}'.format(CURRENT_PATH, TEST_BASE_PATH)
QGS_DB = 'portal_test_project.sqlite'
QGS_FILE = 'portal_test_project.qgs'
QGS_FILE_2 = 'portal_test_project2.qgs'


@receiver(setting_changed)
def _reload_root_urlconf_on_frontend_change(sender, setting, **kwargs):
    """base.urls builds urlpatterns at import time from FRONTEND/FRONTEND_APP, so it must be reloaded when they're overridden."""
    if setting in ('FRONTEND', 'FRONTEND_APP'):
        importlib.reload(base_urls)
        clear_url_caches()

@override_settings(
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'some',
            }
    },
    DATASOURCE_PATH=DATASOURCE_PATH,
    G3WADMIN_LOCAL_MORE_APPS= [ 'portal', ],
    FRONTEND=True,
    FRONTEND_APP='portal'
)
class PortalTestsBase(TestCase):
    """Base class for Portal tests"""

    fixtures = [
        'BaseLayer.json',
        'G3WMapControls.json',
        'G3WSpatialRefSys.json',
        'G3WGeneralDataSuite.json',
        'portal_picture.json'
    ]

    @classmethod
    def setUpTestData(cls):

        translation.activate(settings.LANGUAGE_CODE[:2])

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
        cls.test_user4.save()

        cls.project_group = CoreGroup(
            name='Group1',
            title='Group1',
            header_logo_img='',
            srid=G3WSpatialRefSys.objects.get(auth_srid=4326)
        )

        cls.project_group.save()
        cls.project_group.addPermissionsToEditor(cls.test_user2)

        cls.project_group2 = CoreGroup(
            name='Group2',
            title='Group2',
            header_logo_img='',
            srid=G3WSpatialRefSys.objects.get(auth_srid=4326)
        )

        cls.project_group2.save()

        # create macrogroups
        cls.macrogroup = MacroGroup(title='Macrogroup1', logo_img='macrogroup.png')
        cls.macrogroup.save()
        cls.project_group2.macrogroups.add(cls.macrogroup)
        cls.project_group.macrogroups.add(cls.macrogroup)

        # create macrogroups 2
        cls.macrogroup2 = MacroGroup(title='Macrogroup2', logo_img='macrogroup2.png')
        cls.macrogroup2.save()
        cls.project_group.macrogroups.add(cls.macrogroup2)

        # add permission to anonymous and viewer
        cls.project_group2.addPermissionsToViewers(users_id=[cls.test_user3.pk, get_user_model().get_anonymous().pk])

        # projects
        qgis_project_file = File(open('{}{}{}'.format(CURRENT_PATH, TEST_BASE_PATH, QGS_FILE), 'r'))
        cls.project = QgisProject(qgis_project_file)
        cls.project.title = 'A project'
        cls.project.group = cls.project_group
        cls.project.save()

        # projects
        qgis_project_file = File(open('{}{}{}'.format(CURRENT_PATH, TEST_BASE_PATH, QGS_FILE_2), 'r'))
        cls.project2 = QgisProject(qgis_project_file)
        cls.project2.group = cls.project_group
        cls.project2.save()

        # add permission to anonymous and viewer
        cls.project.instance.addPermissionsToViewers([cls.test_user3.pk])

    @classmethod
    def tearDownClass(cls):
        """Cleanup """
        # Cleanup
        super(PortalTestsBase, cls).tearDownClass()