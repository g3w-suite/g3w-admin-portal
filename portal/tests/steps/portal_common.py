import asyncio
import re
from urllib.parse import parse_qs, urlparse

from behave import given, then, when
from playwright.async_api import expect

from portal.tests.steps.portal_support import role


GROUP = {
    "id": 2, "name": "water", "title": "Water maps",
    "description": "<p>Water catalog</p>", "header_logo_img": "/media/water.png",
}


NESTED_GROUP = {**GROUP, "id": 3, "title": "City maps"}


ORGANIZATION = {
    "id": 1, "title": "Municipality",
    "description": "<p>City catalog</p>", "logo_img": "/media/city.png",
}


PROJECT = {
    "id": 4, "title": "Rivers", "description": "<p>Hydrology network</p>",
    "thumbnail": "/media/river.png", "map_url": "/maps/4/",
    "edit_url": "/admin/maps/4/", "ogc_urls": {"WMS": "/ows/4/"},
}


async def mock_api(context, route):
    path = urlparse(route.request.url).path
    context.calls.append(path)
    if getattr(context, "slow_italian", False) and path == "/it/portal/api/catalog/":
        context.italian_started.set()
        await context.italian_release.wait()

    jwt_case = getattr(context, "jwt_case", None)
    if jwt_case and "/authjwt/api/token/" in path:
        context.token_requests += 1
        if path.endswith("/refresh/"):
            context.refreshes += 1
            if jwt_case == "revoked":
                await route.fulfill(status=401, json={"detail": "Revoked refresh token"})
                return
            await asyncio.sleep(0.1)
            await route.fulfill(json={"access": "renewed-access"})
        elif path.endswith("/blacklist/"):
            assert route.request.post_data_json["refresh"] == "valid-refresh"
            context.blacklisted = True
            await route.fulfill(json={})
        else:
            assert route.request.post_data_json == {"username": "admin", "password": "correct"}
            await route.fulfill(json={"access": "expired", "refresh": "valid-refresh"})
        return

    authorization = route.request.headers.get("authorization", "")
    if jwt_case in {"concurrent", "late", "login"} and authorization.endswith(" expired"):
        if jwt_case == "late" and path.endswith("/api/catalog/"):
            await asyncio.sleep(0.3)
        await route.fulfill(status=401, json={"detail": "Expired"})
        return
    if path.endswith("/api/catalog/"):
        if getattr(context, "catalog_unavailable", False) or (
            getattr(context, "public_catalog_failure", False) and not context.authenticated
        ):
            await route.fulfill(status=503, body="Service unavailable")
            return
        restricted = getattr(context, "restricted_group", False) and not context.authenticated
        data = {"info": {
            "title": "G3W-SUITE", "groups_title": "Catalog",
            "home_description": "<h1>Welcome</h1>", "about_title": "About",
            "about_description": "<p>Public maps</p>", "about_email": "maps@example.test",
            "login_url": "login", "logout_url": "logout", "credits": "Portal credits",
            "social_auth_providers": {"google": "/accounts/google/login/"},
            "reset_password_url": "/password/reset/", **context.info,
        },
            "pictures": sorted(context.pictures, key=lambda picture: picture["order"]),
            "macros": [ORGANIZATION],
            "groups": [] if restricted else [GROUP],
            "allGroups": [NESTED_GROUP] if restricted else [GROUP, NESTED_GROUP],
            "projects": [PROJECT, {**PROJECT, "id": 5, "title": "Roads", "description": "<p>Transport</p>", "ogc_urls": None}],
        }
    elif path.endswith("/api/whoami/"):
        if jwt_case == "revoked":
            await route.fulfill(status=401, json={"detail": "Expired"})
            return
        authenticated = context.authenticated
        if jwt_case == "login":
            authenticated = not context.blacklisted and authorization == "JWT renewed-access"
        data = {"is_authenticated": authenticated, "username": "admin"}
    elif re.search(r"/api/group/1$", path):
        data = [NESTED_GROUP]
    elif re.search(r"/api/group/\d+/projects/$", path):
        data = [{**PROJECT, **getattr(context, "group_project", {})}]
    elif path.endswith("/jx/login/"):
        credentials = parse_qs(route.request.post_data)
        context.authenticated = credentials.get("password") == ["correct"]
        data = {
            "status": "ok" if context.authenticated else "error",
            "errors_form": {"__all__": ["Invalid credentials"]},
        }
    elif path.endswith("/jx/logout/"):
        if getattr(context, "logout_unavailable", False):
            await route.fulfill(status=503, body="Unavailable")
            return
        context.authenticated = False
        data = {"status": "ok"}
    else:
        raise AssertionError(f"Unexpected API request: {path}")
    await route.fulfill(json=data)


@given("a portal with mocked Django APIs")
async def mocked_portal(context):
    await context.page.route("**/portal/**", lambda route: mock_api(context, route))
    await context.page.route("**/authjwt/api/token/**", lambda route: mock_api(context, route))
    await context.page.route("**/media/*.png", lambda route: route.fulfill(
        content_type="image/svg+xml",
        body='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">'
             '<rect width="600" height="400" fill="#326789"/></svg>',
    ))
    # G3W-ADMIN serves the flags; WebKit collapses a missing image with an empty alt to 0x0.
    await context.page.route("**/static/img/flags/*.png", lambda route: route.fulfill(
        content_type="image/svg+xml",
        body='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="12"/>',
    ))


@given('the visitor is "{session}"')
def visitor(context, session):
    assert session in {"anonymous", "authenticated"}, session
    context.authenticated = session == "authenticated"


@when('I open "{path}"')
async def open_page(context, path):
    await context.page.goto(path)


@then("the map and its network services remain available")
async def services(context):
    await expect(role(context, "heading", "Rivers")).to_be_visible()
    await expect(role(context, "link", "View")).to_have_attribute("href", re.compile(r"/maps/4/$"))
    await role(context, "link", "Services").click()
    dialog = context.page.get_by_role("dialog")
    await expect(dialog).to_be_visible()
    await expect(dialog.get_by_role("link", name=re.compile(r"\/ows\/4\/"))).to_be_visible()
    await context.page.keyboard.press("Escape")
    await expect(dialog).not_to_be_visible()


@when('I submit "{password}" credentials')
async def submit_credentials(context, password):
    await context.page.get_by_label("Username", exact=True).fill("admin")
    await context.page.get_by_label("Password", exact=True).fill(password)
    await role(context, "button", "Login").click()


@then('the missing group shows "{outcome}"')
async def missing_group(context, outcome):
    if outcome == "not found":
        await expect(role(context, "heading", "Page Not Found")).to_be_visible()
    else:
        assert outcome == "login", outcome
        await expect(context.page).to_have_url(re.compile(r"login\?next="))
        await expect(context.page.get_by_label("Username", exact=True)).to_be_visible()


@when("I log out")
async def logout(context):
    await role(context, "link", "Logout").first.click()


@given("a narrow viewport without the top navbar")
async def mobile(context):
    await context.page.set_viewport_size({"width": 375, "height": 812})
    context.settings["PORTAL_NAVBAR_TOP"] = False
