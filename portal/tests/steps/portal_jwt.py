import json
from urllib.parse import urljoin

from behave import given, then
from playwright.async_api import expect

from portal.tests.steps.portal_support import role


async def token_value(context, name):
    return await context.page.evaluate("name => localStorage.getItem(name)", name)


async def setup_jwt(context, case, auth="JWT", refresh=None):
    context.jwt_case = case
    context.settings["PORTAL_AUTH_MODE"] = auth
    context.token_requests = 0
    context.refreshes = 0
    context.blacklisted = False
    if refresh:
        await context.page.add_init_script(
            'localStorage.setItem("access_token", "expired");'
            f'localStorage.setItem("refresh_token", {json.dumps(refresh)});'
        )


@given("JWT login issues an expired access token")
async def jwt_login(context):
    await setup_jwt(context, "login")


@given('the token API base is "{base}"')
def token_api_base(context, base):
    context.settings["API_BASE_URL"] = base


@then('token requests target "{base}"')
def token_request_urls(context, base):
    prefix = urljoin(context.base_url, base) + "authjwt/api/token/"
    requests = [url for url in context.requests if "/authjwt/api/token/" in url]
    assert requests == [prefix, prefix + "refresh/", prefix + "blacklist/"], requests


@then("the access token has been refreshed once")
async def refreshed_login(context):
    await expect(role(context, "link", "Logout").first).to_be_visible()
    assert context.refreshes == 1, context.refreshes
    assert await token_value(context, "access_token") == "renewed-access"


@then("the refresh token is blacklisted and stored tokens are removed")
async def blacklist(context):
    await expect(role(context, "link", "Login").first).to_be_visible()
    assert context.blacklisted
    assert context.token_requests == 3, context.token_requests
    assert await token_value(context, "access_token") is None
    assert await token_value(context, "refresh_token") is None


@given("stored expired Bearer credentials")
async def concurrent_refresh(context):
    await setup_jwt(context, "concurrent", auth="Bearer", refresh="valid-refresh")


@given("expired JWT requests with one delayed response")
async def delayed_refresh(context):
    context.authenticated = True
    await setup_jwt(context, "late", refresh="valid-refresh")


@then("one refresh serves all concurrent requests")
async def refresh_once(context):
    await expect(role(context, "heading", "Catalog")).to_be_visible()
    assert context.refreshes == 1, context.refreshes


@given("revoked JWT credentials")
async def revoked_credentials(context):
    await setup_jwt(context, "revoked", refresh="revoked")


@then("authentication failure is explicit and stored credentials are removed")
async def revoked_error(context):
    await expect(context.page.get_by_role("alert")).to_contain_text("401")
    assert context.refreshes == 1, context.refreshes
    assert await token_value(context, "access_token") is None
    assert await token_value(context, "refresh_token") is None
