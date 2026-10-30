import re
from urllib.parse import quote, urlparse

from behave import given, then, when
from playwright.async_api import expect

from portal.tests.steps.portal_support import role


@when('I request the return destination "{destination}" after "{stage}"')
async def invalid_return_destination(context, destination, stage):
    assert stage in {"login", "load"}, stage
    destination = quote(destination, safe="")
    if stage == "load":
        context.authenticated = True
        await context.page.goto(f"/?next={destination}#/en/")
    else:
        await context.page.goto(f"/#/en/login?next={destination}")
        await context.page.get_by_label("Username", exact=True).fill("admin")
        await context.page.get_by_label("Password", exact=True).fill("correct")
        await role(context, "button", "Login").click()


@then("the invalid return destination is reported without leaving the portal")
async def invalid_return_reported(context):
    await expect(context.page.get_by_role("alert")).to_contain_text("Invalid return path")
    assert urlparse(context.page.url).netloc == urlparse(context.base_url).netloc


@given("internal login advertises the Django logout URL")
def django_logout_destination(context):
    context.info.update(login_url="login", logout_url="/en/logout/")


@when('I use internal logout from "{path}"')
async def internal_logout(context, path):
    await context.page.goto(path)
    if "/logout" not in path.split("#")[-1]:
        await role(context, "link", "Logout").click()


@then("logout uses the portal API without leaving the application")
async def internal_logout_completed(context):
    await expect(role(context, "link", "Login")).to_be_visible()
    assert "/en/portal/jx/logout/" in context.calls
    assert not context.authenticated
    assert "#" in context.page.url
    assert not urlparse(context.page.url).path.endswith("/logout/")


@then("I am authenticated and the catalog has been refreshed")
async def authenticated(context):
    await expect(role(context, "link", "Logout").first).to_be_visible()
    assert sum(path.endswith("/api/catalog/") for path in context.calls) > 1


@when("I log out from search")
async def logout_from_search(context):
    await role(context, "link", "Search").first.click()
    await role(context, "link", "Logout").first.click()


@then("I stay on search without authenticated controls")
async def logged_out(context):
    await expect(context.page).to_have_url(re.compile(r"#/en/search$"))
    await expect(role(context, "link", "Logout")).to_have_count(0)
    await expect(role(context, "link", "Login").first).to_be_visible()


@then("the login error is visible and recovery links remain available")
async def login_error(context):
    await expect(context.page.get_by_role("alert")).to_contain_text("Login error")
    await expect(role(context, "button", "Login")).to_be_enabled()
    await expect(role(context, "link", "Logout")).to_have_count(0)
    await expect(role(context, "button", "google")).to_have_attribute("href", re.compile(r"/accounts/google/login/$"))
    await expect(role(context, "link", "Forgot your password?")).to_have_attribute("href", re.compile(r"/password/reset/$"))


@given('a custom "{action}" destination')
async def custom_destination(context, action):
    context.authenticated = action != "login"
    context.info.update(
        login_url="https://identity.example.test/login",
        logout_url="https://identity.example.test/logout",
    )
    context.settings["PORTAL_ADMIN_ROOT"] = "/control-panel/"
    for pattern in ["https://identity.example.test/**", "**/control-panel/"]:
        await context.page.route(pattern, lambda route: route.fulfill(
            content_type="text/html", body="Configured destination",
        ))
    await context.page.goto("/#/en/")


@when('I select "{action}"')
async def select_action(context, action):
    await context.page.get_by_role("link", name=re.compile(f"^{action}$", re.I)).first.click()


@then('I reach the configured "{action}" destination')
async def reached_destination(context, action):
    url = re.compile(r"/control-panel/$") if action == "admin" else f"https://identity.example.test/{action}"
    await expect(context.page).to_have_url(url)


@then("authenticated map content is visible")
async def private_content_visible(context):
    await expect(role(context, "heading", "Rivers")).to_be_visible()
    await expect(role(context, "link", "Logout").first).to_be_visible()


@given("the group is available only after authentication")
def restricted_group(context):
    context.restricted_group = True


@then("I return to the requested group with refreshed permissions")
async def returned_to_group(context):
    await expect(context.page).to_have_url(re.compile(r"#/en/group/2$"))
    await expect(role(context, "heading", "Rivers")).to_be_visible()
    await expect(role(context, "link", "Edit")).to_be_visible()


@given("the portal is hosted separately from its API")
async def cross_origin(context):
    context.settings["API_BASE_URL"] = "https://api.example.test/"
    await context.page.add_init_script("""
        const original = window.fetch;
        window.fetch = (input, options) => {
            window.portalCredentials = options.credentials;
            return original(input, options);
        };
    """)


@then("remote requests carry credentials and map links use the remote host")
async def remote_credentials(context):
    await expect(role(context, "heading", "Catalog")).to_be_visible()
    assert await context.page.evaluate("window.portalCredentials") == "include"
    await context.page.goto("/#/en/search")
    await expect(role(context, "link", "View").first).to_have_attribute("href", "https://api.example.test/maps/4/")


@given("an authenticated session and unavailable logout endpoint")
def logout_unavailable(context):
    context.authenticated = True
    context.logout_unavailable = True


@then("logout failure is visible and authenticated controls remain")
async def logout_failed(context):
    await expect(context.page.get_by_role("alert")).to_contain_text("503")
    await expect(role(context, "link", "Logout").first).to_be_visible()


@then("the return page is opened and the consumed next parameter is removed")
async def returned_from_backend(context):
    await expect(context.page).to_have_url(context.base_url + "/#/en/group/2")
    await expect(role(context, "heading", "Rivers")).to_be_visible()


@given("an authenticated session whose public catalog refresh fails")
def public_catalog_failure(context):
    context.authenticated = True
    context.public_catalog_failure = True


@then("private content is cleared and the refresh error is visible")
async def private_content_cleared(context):
    await expect(context.page.get_by_role("alert")).to_contain_text("503")
    await expect(role(context, "heading", "Rivers")).to_have_count(0)
    await expect(role(context, "link", "Logout")).to_have_count(0)
    await expect(context.page.get_by_role("progressbar")).to_have_count(0)
