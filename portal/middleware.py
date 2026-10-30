import json
import logging
import re
from http.cookies import SimpleCookie
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from django.conf import settings
from django.http import HttpResponse, JsonResponse

logger = logging.getLogger('g3wadmin.debug')


def _is_localhost(request):
    hostname = urlsplit(f'//{request.get_host()}').hostname
    return hostname in {'localhost', '127.0.0.1', '::1'}


def _proxy_enabled(request):
    root = request.build_absolute_uri('/')
    api = urlsplit(urljoin(root, getattr(settings, 'PORTAL_API_BASE_URL', root)))
    local = urlsplit(root)
    return _is_localhost(request) and (api.scheme, api.netloc) != (local.scheme, local.netloc)


def _is_proxy_path(path):
    return bool(
        re.fullmatch(
            r'[a-z]{2}/(?:portal/)?api/(?:catalog|pictures|infodata|whoami|macrogroup|project|group'
            r'(?:/nomacrogroup|/[0-9]+(?:/projects)?)?)/?',
            path,
        )
        or re.fullmatch(r'[a-z]{2}/(?:portal/)?jx/(?:login|logout)/?', path)
        or re.fullmatch(r'authjwt/api/token/(?:refresh/|blacklist/)?', path)
    )


class PortalProxyMiddleware:
    """Transparently forwards localhost portal API calls to a remote PORTAL_API_BASE_URL."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info.lstrip('/')
        if _is_proxy_path(path) and _proxy_enabled(request):
            return self.proxy(request, path)
        return self.get_response(request)

    def proxy(self, request, proxy_path):
        if request.method not in {'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'}:
            return HttpResponse(status=405)

        # ponytail: remote portals may lack api/catalog/, so build it here; drop once all remotes expose it
        catalog_path = re.fullmatch(r'([a-z]{2}/(?:portal/)?api/)catalog/?', proxy_path)
        if catalog_path and request.method == 'GET':
            data, cookies = {}, {}
            for key, path in (
                ('info', 'infodata/'), ('pictures', 'pictures/'), ('macros', 'macrogroup/'),
                ('groups', 'group/nomacrogroup/'), ('allGroups', 'group/'), ('projects', 'project/'),
            ):
                response = self.proxy(request, catalog_path[1] + path)
                if response.status_code != 200:
                    return response
                data[key] = json.loads(response.content)
                cookies.update(response.cookies)
            data['pictures'].sort(key=lambda picture: picture.get('order') or 0)
            catalog = JsonResponse(data)
            catalog.cookies.update(cookies)
            return catalog

        api_base_url = getattr(settings, 'PORTAL_API_BASE_URL', '')
        upstream = urlsplit(api_base_url)
        if upstream.scheme not in {'http', 'https'} or not upstream.netloc or upstream.username or upstream.password:
            return HttpResponse(status=502)

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
