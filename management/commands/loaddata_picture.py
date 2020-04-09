# coding=utf-8
""""
    Load portal picture fixture and copy image files to media_root
.. note:: This program is free software; you can redistribute it and/or modify
    it under the terms of the Mozilla Public License 2.0.

"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2020-04-09'
__copyright__ = 'Copyright 2015 - 2020, Gis3w'


from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
import os
import shutil

FILE_ROOT = os.path.abspath(os.path.dirname(__file__))
PICTURE_DEFAULT_ROOT = '%s/../../fixtures/data' % FILE_ROOT


class Command(BaseCommand):
    help = 'Load default Portal Picture'

    def handle(self, *args, **options):

        # Copy media picture to MEDIA_ROOT
        try:
            shutil.copytree(PICTURE_DEFAULT_ROOT, settings.MEDIA_ROOT + '/portal_picture')
        except shutil.Error as e:
            print(e)

        # Load fixture
        call_command('loaddata', 'portal_picture.json')

