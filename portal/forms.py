# coding=utf-8
""""
    Portal forms module
.. note:: This program is free software; you can redistribute it and/or modify
    it under the terms of the Mozilla Public License 2.0.

"""

__author__    = 'lorenzetti@gis3w.it'
__date__      = '2020-04-01'
__copyright__ = 'Copyright 2015 - 2020, Gis3w'
__license__   = "MPL 2.0"


from django.forms import ModelForm, ValidationError, Form, CharField, DateField
from django.utils.translation import ugettext_lazy as _
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, HTML, Row, Field
from crispy_forms.bootstrap import AppendedText
from django_file_form.forms import FileFormMixin, UploadedFileField

from core.mixins.forms import G3WRequestFormMixin, G3WFormMixin

from .models import Picture


class PictureForm(G3WFormMixin, FileFormMixin, ModelForm):
    """
    Form for portal Picture
    """

    image = UploadedFileField(required=True)

    class Meta:
        model = Picture
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super(PictureForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_tag = False
        self.helper.layout = Layout(
                                Div(
                                    Div(
                                        Div(
                                            Div(
                                                HTML(
                                                    "<h3 class='box-title'><i class='fa fa-file'></i> {}</h3>"
                                                    .format(
                                                        _('Picture data'))),
                                                        css_class='box-header with-border'
                                                    ),
                                            Div(
                                                'image',
                                                HTML(
                                                    """<img
                                                    {% if not form.image.value %}style="display:none;"{% endif %}
                                                    class="img-responsive img-thumbnail"
                                                    src="{{ MEDIA_URL }}{{ form.image.value }}">""",
                                                ),
                                                'form_id',
                                                'upload_url',
                                                'delete_url',
                                                css_class='box-body',
                                            ),
                                            css_class='box box-success'
                                        ),
                                        css_class='col-md-6'
                                    ),
                                    Div(
                                        Div(
                                            Div(
                                                HTML(
                                                    "<h3 class='box-title'><i class='fa fa-file'></i> {}</h3>"
                                                    .format(
                                                        _('Author and style data')
                                                    )
                                                ),
                                                css_class='box-header with-border'
                                            ),
                                            Div(
                                                'author',
                                                'author_url',
                                                AppendedText('main_color', '<i></i>', css_class='colorpicker'),
                                                AppendedText('main_title_color', '<i></i>', css_class='colorpicker'),
                                                AppendedText('subtitle_color', '<i></i>', css_class='colorpicker'),
                                                css_class='box-body',
                                            ),
                                            css_class='box box-success'
                                        ),
                                        css_class='col-md-6'
                                    ),
                                    css_class = 'row'
                                ),
                            )