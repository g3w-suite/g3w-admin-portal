# coding=utf-8
""" Portal views
.. note:: This program is free software; you can redistribute it and/or modify
     it under the terms of the Mozilla Public License 2.0.
"""

__author__    = 'lorenzetti@gis3w.it'
__date__      = '2019-09-10'
__copyright__ = 'Copyright 2019, GIS3W'
__license__   = "MPL 2.0"

import json
import logging
import re
from http.cookies import SimpleCookie
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from django.conf                  import settings
from django.views.generic.edit    import BaseFormView, SingleObjectMixin
from django.views.generic         import TemplateView, View, ListView, CreateView, UpdateView
from django.http                  import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators      import method_decorator
from django.urls                  import reverse
from django.contrib.auth          import login as auth_login, logout as auth_logout
from django.contrib.auth.forms    import AuthenticationForm
from usersmanage.decorators       import user_passes_test_or_403

from core.mixins.views            import G3WAjaxDeleteViewMixin
from base                         import __version__ as version

from portal.models                import Picture
from portal.forms                 import PictureForm
from portal.utils                 import get_response_headers

from importlib.metadata           import version as get_version

logger = logging.getLogger('g3wadmin.debug')


def _is_localhost(request):
    hostname = urlsplit(f'//{request.get_host()}').hostname
    return hostname in {'localhost', '127.0.0.1', '::1'}


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

        response = JsonResponse({'status': 'ok', 'message': 'Logout'}, )

        h = get_response_headers(self, request)
        if h is not None:
            for k in h:
                response[k] = h[k]

        # 302 redirect after logout
        if ('redirect' in request.GET):
            response['Location'] = request.GET['redirect'] # TODO: ALLOWED_ORIGINS
            response.status_code = 302

        return response


class PortalView(TemplateView):
    """
    Base index portal view
    """
    template_name = 'portal/index.html'

    def get_context_data(self, **kwargs):
        api_base_url = getattr(settings, 'PORTAL_API_BASE_URL', self.request.build_absolute_uri('/'))
        asset_base_url = urljoin(self.request.build_absolute_uri('/'), api_base_url)
        api_origin = urlsplit(asset_base_url)
        request_origin = urlsplit(self.request.build_absolute_uri('/'))
        if _is_localhost(self.request) and (
            api_origin.scheme, api_origin.netloc
        ) != (request_origin.scheme, request_origin.netloc):
            proxy_url = reverse('portal-proxy', kwargs={'proxy_path': '__proxy_path__'})
            api_base_url = self.request.build_absolute_uri(proxy_url.rsplit('__proxy_path__', 1)[0])

        toret =  {

            # OPTIONAL: setting for API_BASE_URL (cross domain API) 
            'API_BASE_URL': api_base_url,

            'LANGUAGES': [l[0] for l in settings.LANGUAGES],
        }

        try:
            toret['PORTAL_VERSION'] = 'g3w-portal v' + get_version('portal')
        except Exception:
            toret['PORTAL_VERSION'] = 'unknown'

        return toret


@method_decorator(csrf_exempt, name='dispatch')
class PortalApiProxyView(View):
    """Local-development proxy for the configured remote portal API."""

    def dispatch(self, request, *args, **kwargs):
        if request.method not in {'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'}:
            return HttpResponse(status=405)

        proxy_path = kwargs['proxy_path']
        if not _is_localhost(request):
            return HttpResponse(status=404)

        # ponytail: remote portals may lack api/catalog/, so build it here; drop once all remotes expose it
        catalog_path = re.fullmatch(r'([a-z]{2}/(?:portal/)?api/)catalog/?', proxy_path)
        if catalog_path and request.method == 'GET':
            data, cookies = {}, {}
            for key, path in (
                ('info', 'infodata/'), ('pictures', 'pictures/'), ('macros', 'macrogroup/'),
                ('groups', 'group/nomacrogroup/'), ('allGroups', 'group/'), ('projects', 'project/'),
            ):
                response = self.dispatch(request, proxy_path=catalog_path[1] + path)
                if response.status_code != 200:
                    return response
                data[key] = json.loads(response.content)
                cookies.update(response.cookies)
            data['pictures'].sort(key=lambda picture: picture.get('order') or 0)
            catalog = JsonResponse(data)
            catalog.cookies.update(cookies)
            return catalog

        allowed_path = (
            re.fullmatch(
                r'[a-z]{2}/(?:portal/)?api/(?:pictures|infodata|whoami|macrogroup|project|group'
                r'(?:/nomacrogroup|/[0-9]+(?:/projects)?)?)/?',
                proxy_path,
            )
            or re.fullmatch(r'[a-z]{2}/(?:portal/)?jx/(?:login|logout)/?', proxy_path)
            or re.fullmatch(r'authjwt/api/token/(?:refresh/|blacklist/)?', proxy_path)
        )
        if not allowed_path:
            return HttpResponse(status=404)

        api_base_url = getattr(settings, 'PORTAL_API_BASE_URL', '')
        upstream = urlsplit(api_base_url)
        if upstream.scheme not in {'http', 'https'} or not upstream.netloc or upstream.username or upstream.password:
            return HttpResponse(status=502)
        if upstream.netloc.lower() == request.get_host().lower() and upstream.scheme == request.scheme:
            return HttpResponse(status=404)

        upstream_path = f'{upstream.path.rstrip("/")}/{proxy_path}'
        upstream_url = urlunsplit((
            upstream.scheme,
            upstream.netloc,
            upstream_path,
            request.META.get('QUERY_STRING', ''),
            '',
        ))
        headers = {
            key: request.META[meta_key]
            for key, meta_key in (
                ('Accept', 'HTTP_ACCEPT'),
                ('Content-Type', 'CONTENT_TYPE'),
                ('Authorization', 'HTTP_AUTHORIZATION'),
            )
            if request.META.get(meta_key)
        }
        proxy_cookies = {
            key[len('portal_proxy_'):]: value
            for key, value in request.COOKIES.items()
            if key.startswith('portal_proxy_')
        }
        if proxy_cookies:
            headers['Cookie'] = '; '.join(f'{key}={value}' for key, value in proxy_cookies.items())

        upstream_request = Request(
            upstream_url,
            data=request.body if request.method not in {'GET', 'OPTIONS'} else None,
            headers=headers,
            method=request.method,
        )

        try:
            try:
                response = build_opener(_NoRedirect).open(upstream_request, timeout=15)
            except HTTPError as error:
                response = error
            with response:
                status = response.code
                body = response.read()
                content_type = response.headers.get('Content-Type')
                set_cookies = response.headers.get_all('Set-Cookie', [])
                cache_control = response.headers.get('Cache-Control')
        except URLError:
            logger.exception('Local portal API proxy could not reach %s', upstream.netloc)
            return HttpResponse('Remote portal API is unavailable', status=502)

        if (content_type or '').startswith('application/json'):
            try:
                # Remote media, map and OGC links must not resolve against the local proxy.
                body = json.dumps(_absolute_urls(json.loads(body), f'{upstream.scheme}://{upstream.netloc}'))
            except ValueError:
                pass

        proxied_response = HttpResponse(body, status=status, content_type=content_type)
        if cache_control:
            proxied_response['Cache-Control'] = cache_control
        for raw_cookie in set_cookies:
            cookie = SimpleCookie()
            cookie.load(raw_cookie)
            for name, morsel in cookie.items():
                proxied_response.set_cookie(
                    f'portal_proxy_{name}',
                    morsel.value,
                    max_age=morsel['max-age'] or None,
                    expires=morsel['expires'] or None,
                    path='/',
                    secure=bool(morsel['secure']),
                    httponly=bool(morsel['httponly']),
                    samesite=morsel['samesite'] or None,
                )
        return proxied_response


def _absolute_urls(value, origin):
    if isinstance(value, dict):
        return {key: _absolute_urls(item, origin) for key, item in value.items()}
    if isinstance(value, list):
        return [_absolute_urls(item, origin) for item in value]
    if not isinstance(value, str):
        return value
    if value.startswith('/') and not value.startswith('//'):
        return origin + value
    return re.sub(r'''(\b(?:href|src)=["'])(?=/(?!/))''', lambda match: match.group(1) + origin, value)


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class PictureListView(ListView):
    """ Main frontend picture list"""

    model = Picture
    template_name = 'portal/picture_list.html'

    @method_decorator(user_passes_test_or_403(lambda u: u.is_superuser))
    def dispatch(self, *args, **kwargs):
        return super(PictureListView, self).dispatch(*args, **kwargs)


class PictureViewMixin(object):
    """ Mixin for common properties and methods between Picture CRUD views """
    model = Picture
    form_class = PictureForm
    template_name = 'portal/picture_form.html'

    @method_decorator(user_passes_test_or_403(lambda u: u.is_superuser))
    def dispatch(self, *args, **kwargs):
        return super(PictureViewMixin, self).dispatch(*args, **kwargs)

    def get_success_url(self):

        # return to picture list
        return reverse('portal-picture')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # BACKCOMP: removed template in g3w-admin@v3.6 ("core/django_file_form/upload_template.html")
        context["has_django_file_form_upload_template"] = (version < (3, 6))
        
        return context
    


class PictureCreateView(PictureViewMixin, CreateView):
    """ Create picture form view"""
    pass


class PictureUpdateView(PictureViewMixin, UpdateView):
    """ Update picture from view """


class PictureDeleteView(PictureViewMixin, G3WAjaxDeleteViewMixin, SingleObjectMixin, View):
    """ Delete picture Ajax view """
    pass
