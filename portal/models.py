# coding=utf-8
""" Portal models
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__ = 'lorenzetti@gis3w.it'
__date__ = '2020-03-31'
__copyright__ = 'Copyright 2020, GIS3W'

from django.db import models
from django.utils.translation import ugettext, ugettext_lazy as _
from ordered_model.models import OrderedModel


class Picture(OrderedModel):
    """
    Model for custom portal module
    """
    image            = models.ImageField(_('Picture'), upload_to='portal_picture')
    main_color       = models.CharField(_('Main color'), max_length=7, default='#FFF')
    main_title_color = models.CharField(_('Main title color'), max_length=7, default='#FFF')
    subtitle_color   = models.CharField(_('Subtitle color'), max_length=7, default='#FFF')
    author           = models.CharField(_('Author'), max_length=255, blank=True, null=True)
    author_url       = models.URLField(_('Author URL'), blank=True, null=True)
    
    # class Meta:
    #     app_label = 'portal'
