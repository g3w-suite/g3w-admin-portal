import json
from email.message import Message
from unittest.mock import patch

from behave import then, when


@when('a proxy request from "{host}" targets "{target}"')
def proxy_request(context, host, target):
    from django.test import RequestFactory, override_settings
    from portal.views import PortalApiProxyView

    request = RequestFactory().get(
        f"/it/portal/proxy/{target}?lang=it", HTTP_HOST=host,
    )
    request.COOKIES = {
        "portal_proxy_sessionid": "remote-session", "sessionid": "local-session",
    }
    with override_settings(
        PORTAL_API_BASE_URL="https://dev.g3wsuite.it/",
        ALLOWED_HOSTS=["localhost", "example.com"],
    ), patch("portal.views.build_opener") as opener:
        upstream = opener.return_value.open.return_value
        upstream.code = 200
        upstream.headers = Message()
        upstream.headers["Content-Type"] = "application/json"
        upstream.headers.add_header("Set-Cookie", "sessionid=remote; HttpOnly; Secure; SameSite=None")
        body = (
            b'{"map_url": "/it/map/g/qdjango/97/", "ogc_urls": {"WMS": "/ows/97/"},'
            b' "description": "<img src=\\"/media/a.png\\"><a href=\\"//cdn.test/x\\">x</a>"}'
        )
        open_ = opener.return_value.open
        upstream.read.side_effect = lambda: (
            body if "/infodata/" in open_.call_args.args[0].full_url
            else b'[{"order": 2, "image": "/media/b.png"}, {"order": 1, "image": "/media/a.png"}]'
        )
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


@then("the proxy makes relative URLs point to the remote host")
def proxy_urls(context):
    assert json.loads(context.response.content) == {
        "map_url": "https://dev.g3wsuite.it/it/map/g/qdjango/97/",
        "ogc_urls": {"WMS": "https://dev.g3wsuite.it/ows/97/"},
        "description": '<img src="https://dev.g3wsuite.it/media/a.png"><a href="//cdn.test/x">x</a>',
    }


@then("the proxy aggregates the remote catalog endpoints")
def proxy_catalog(context):
    urls = [call.args[0].full_url for call in context.proxy_open.call_args_list]
    assert urls == [
        f"https://dev.g3wsuite.it/it/portal/api/{path}?lang=it"
        for path in ["infodata/", "pictures/", "macrogroup/", "group/nomacrogroup/", "group/", "project/"]
    ], urls
    data = json.loads(context.response.content)
    assert list(data) == ["info", "pictures", "macros", "groups", "allGroups", "projects"], data
    assert data["info"]["map_url"] == "https://dev.g3wsuite.it/it/map/g/qdjango/97/"
    assert [picture["image"] for picture in data["pictures"]] == [
        "https://dev.g3wsuite.it/media/a.png", "https://dev.g3wsuite.it/media/b.png",
    ]
    assert "portal_proxy_sessionid" in context.response.cookies


@then("the proxy rejects the request without contacting upstream")
def proxy_rejected(context):
    assert context.response.status_code == 404
    context.proxy_opener.assert_not_called()
