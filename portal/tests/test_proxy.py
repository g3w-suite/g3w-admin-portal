from email.message import Message
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase, override_settings

from portal.views import PortalApiProxyView


class UpstreamResponse:
    code = 200

    def __init__(self):
        self.headers = Message()
        self.headers['Content-Type'] = 'application/json'
        self.headers.add_header('Set-Cookie', 'sessionid=remote; HttpOnly; Secure; SameSite=None')
        self.body = b'{"ok":true}'

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def read(self):
        return self.body


class PortalApiProxyTests(SimpleTestCase):
    @override_settings(PORTAL_API_BASE_URL='https://dev.g3wsuite.it/')
    @patch('portal.views.build_opener')
    def test_forwards_api_and_scopes_remote_cookies(self, build_opener):
        request = RequestFactory().get(
            '/it/portal/api-proxy/it/portal/api/infodata/?lang=it',
            HTTP_HOST='localhost:8000',
        )
        request.COOKIES = {
            'portal_proxy_sessionid': 'remote-session',
            'sessionid': 'local-session',
        }
        upstream_response = UpstreamResponse()
        build_opener.return_value.open.return_value = upstream_response

        response = PortalApiProxyView.as_view()(
            request, proxy_path='it/portal/api/infodata/'
        )

        upstream_request = build_opener.return_value.open.call_args.args[0]
        self.assertEqual(
            upstream_request.full_url,
            'https://dev.g3wsuite.it/it/portal/api/infodata/?lang=it',
        )
        self.assertEqual(upstream_request.get_header('Cookie'), 'sessionid=remote-session')
        self.assertEqual(response.status_code, 200)
        self.assertIn('portal_proxy_sessionid', response.cookies)
        self.assertNotIn('sessionid', response.cookies)

    @override_settings(PORTAL_API_BASE_URL='https://dev.g3wsuite.it/')
    @patch('portal.views.build_opener')
    def test_rejects_non_local_and_unapproved_targets(self, build_opener):
        view = PortalApiProxyView.as_view()
        request = RequestFactory().get(
            '/it/portal/api-proxy/it/portal/api/infodata/',
            HTTP_HOST='example.com',
        )
        self.assertEqual(
            view(request, proxy_path='it/portal/api/infodata/').status_code,
            404,
        )

        request = RequestFactory().get(
            '/it/portal/api-proxy/admin/',
            HTTP_HOST='localhost:8000',
        )
        self.assertEqual(view(request, proxy_path='admin/').status_code, 404)
        build_opener.assert_not_called()
