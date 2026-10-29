from email.message import Message
from unittest.mock import patch

from behave import then, when


@when('a proxy request from "{host}" targets "{target}"')
def proxy_request(context, host, target):
    from django.test import RequestFactory, override_settings
    from portal.views import PortalApiProxyView

    request = RequestFactory().get(
        f"/it/portal/api-proxy/{target}?lang=it", HTTP_HOST=host,
    )
    request.COOKIES = {
        "portal_proxy_sessionid": "remote-session", "sessionid": "local-session",
    }
    with override_settings(
        PORTAL_API_BASE_URL="https://dev.g3wsuite.it/",
        ALLOWED_HOSTS=["localhost", "example.com"],
    ), patch("portal.views.build_opener") as opener:
        upstream = opener.return_value.open.return_value.__enter__.return_value
        upstream.code = 200
        upstream.headers = Message()
        upstream.headers["Content-Type"] = "application/json"
        upstream.headers.add_header("Set-Cookie", "sessionid=remote; HttpOnly; Secure; SameSite=None")
        upstream.read.return_value = b'{"ok":true}'
        context.response = PortalApiProxyView.as_view()(request, proxy_path=target)
        context.proxy_open = opener.return_value.open
        context.proxy_opener = opener


@then("the proxy forwards only remote session cookies and scopes the response cookies")
def proxy_cookies(context):
    upstream = context.proxy_open.call_args.args[0]
    assert upstream.full_url == "https://dev.g3wsuite.it/it/portal/api/infodata/?lang=it"
    assert upstream.get_header("Cookie") == "sessionid=remote-session"
    assert context.response.status_code == 200
    assert "portal_proxy_sessionid" in context.response.cookies
    assert "sessionid" not in context.response.cookies


@then("the proxy rejects the request without contacting upstream")
def proxy_rejected(context):
    assert context.response.status_code == 404
    context.proxy_opener.assert_not_called()
