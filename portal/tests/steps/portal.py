import asyncio
import json
import re
from urllib.parse import parse_qs, urlparse

from behave import given, then, when
from playwright.async_api import expect


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


def role(context, name, label):
    return context.page.get_by_role(name, name=label, exact=True)


async def token_value(context, name):
    return await context.page.evaluate("name => localStorage.getItem(name)", name)


async def mock_api(context, route):
    path = urlparse(route.request.url).path
    context.calls.append(path)
    if getattr(context, "slow_italian", False) and path == "/it/portal/api/infodata/":
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
        if jwt_case == "late" and path.endswith("/api/project/"):
            await asyncio.sleep(0.3)
        await route.fulfill(status=401, json={"detail": "Expired"})
        return
    if path.endswith("/api/infodata/"):
        data = {
            "title": "G3W-SUITE", "groups_title": "Catalog",
            "home_description": "<h1>Welcome</h1>", "about_title": "About",
            "about_description": "<p>Public maps</p>", "about_email": "maps@example.test",
            "login_url": "login", "logout_url": "logout", "credits": "Portal credits",
            "social_auth_providers": {"google": "/accounts/google/login/"},
            "reset_password_url": "/password/reset/", **context.info,
        }
    elif path.endswith("/api/whoami/"):
        if jwt_case == "revoked":
            await route.fulfill(status=401, json={"detail": "Expired"})
            return
        authenticated = context.authenticated
        if jwt_case == "login":
            authenticated = not context.blacklisted and authorization == "JWT renewed-access"
        data = {"is_authenticated": authenticated, "username": "admin"}
    elif path.endswith("/api/pictures/"):
        data = context.pictures
    elif path.endswith("/api/macrogroup/"):
        data = [ORGANIZATION]
    elif re.search(r"/api/group/1$", path):
        data = [NESTED_GROUP]
    elif re.search(r"/api/group/\d+/projects/$", path):
        data = [PROJECT]
    elif path.endswith("/api/group/nomacrogroup/"):
        data = [] if getattr(context, "restricted_group", False) and not context.authenticated else [GROUP]
    elif path.endswith("/api/group/"):
        data = [GROUP, NESTED_GROUP]
    elif path.endswith("/api/project/"):
        if getattr(context, "catalog_unavailable", False) or (
            getattr(context, "public_catalog_failure", False) and not context.authenticated
        ):
            await route.fulfill(status=503, body="Service unavailable")
            return
        data = [PROJECT, {**PROJECT, "id": 5, "title": "Roads", "description": "<p>Transport</p>", "ogc_urls": None}]
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


@given('the visitor is "{session}"')
def visitor(context, session):
    assert session in {"anonymous", "authenticated"}, session
    context.authenticated = session == "authenticated"


@when('I open "{path}"')
async def open_page(context, path):
    await context.page.goto(path)


@then("the home page shows one featured card and a photo credit")
async def home(context):
    await expect(context.page).to_have_title("Home - G3W-SUITE")
    await expect(role(context, "heading", "Welcome")).to_be_visible()
    await expect(context.page.get_by_text("Photo by Cartographer")).to_be_visible()
    await expect(context.page.locator("#content article")).to_have_count(1)


@when("I request the complete catalog")
async def complete_catalog(context):
    await role(context, "button", "Show all").click()


@then("the archive contains both catalog entries")
async def archive(context):
    await expect(context.page.locator("#content article")).to_have_count(2)
    await expect(role(context, "heading", "Water maps")).to_be_visible()


@when("I open an organization and its group")
async def organization(context):
    await context.page.goto("/#/en/")
    await role(context, "link", "Municipality").click()
    await role(context, "link", "City maps").click()


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


@when('I search for "{query}"')
async def search(context, query):
    await context.page.goto("/#/en/search")
    await context.page.get_by_role("searchbox").fill(query)


@then("only Rivers is shown and title searching and clearing still work")
async def search_results(context):
    await expect(context.page.locator("#content article")).to_have_count(1)
    await expect(role(context, "heading", "Rivers")).to_be_visible()
    await context.page.get_by_role("searchbox").fill("roads")
    await expect(role(context, "heading", "Roads")).to_be_visible()
    await context.page.get_by_role("searchbox").fill("")
    await expect(context.page.locator("#content article")).to_have_count(2)


@when("I switch the English search page to Italian")
async def switch_language(context):
    await context.page.goto("/#/en/search")
    await role(context, "link", "Choose a language").click()
    await context.page.locator('a[hreflang="it"]:visible').click()


@then("the route, document and search label are Italian")
async def italian(context):
    await expect(context.page).to_have_url(re.compile(r"#/it/search$"))
    await expect(context.page.locator("html")).to_have_attribute("lang", "it")
    await expect(context.page.get_by_role("searchbox")).to_have_attribute(
        "placeholder", "Cerca una mappa nel catalogo",
    )


@when('I submit "{password}" credentials')
async def submit_credentials(context, password):
    await context.page.get_by_label("Username", exact=True).fill("admin")
    await context.page.get_by_label("Password", exact=True).fill(password)
    await role(context, "button", "Login").click()


@then("I am authenticated and the catalog has been refreshed")
async def authenticated(context):
    await expect(role(context, "link", "Logout").first).to_be_visible()
    assert sum(path.endswith("/api/project/") for path in context.calls) > 1


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


@then('the missing group shows "{outcome}"')
async def missing_group(context, outcome):
    if outcome == "not found":
        await expect(role(context, "heading", "Page Not Found")).to_be_visible()
    else:
        assert outcome == "login", outcome
        await expect(context.page).to_have_url(re.compile(r"login\?next="))
        await expect(context.page.get_by_label("Username", exact=True)).to_be_visible()


@given("the home article limit is {limit:d}")
def article_limit(context, limit):
    context.settings["PORTAL_MAX_HOME_ARTICLES"] = limit


@then('there are {cards:d} home cards and the show-all control is "{visibility}"')
async def home_limit(context, cards, visibility):
    assert visibility in {"visible", "absent"}, visibility
    await expect(context.page).to_have_title("Home - G3W-SUITE")
    await expect(context.page.locator("#content article")).to_have_count(cards)
    await expect(role(context, "button", "Show all")).to_have_count(int(visibility == "visible"))


@then('the catalog and search label use "{locale}"')
async def translation(context, locale):
    await expect(context.page.locator("html")).to_have_attribute("lang", locale)
    await expect(role(context, "heading", "Rivers")).to_be_visible()
    placeholder = await context.page.evaluate(
        "async locale => (await import(`/static/frontend/locale/${locale}.js`)).default.menu.search_placeholder",
        locale,
    )
    await expect(context.page.get_by_role("searchbox")).to_have_attribute("placeholder", placeholder)


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


@given("the catalog API is unavailable")
def unavailable_catalog(context):
    context.catalog_unavailable = True


@then("the API error is visible instead of a successful empty catalog")
async def api_error(context):
    await expect(context.page.get_by_role("alert")).to_contain_text("503")
    await expect(context.page.locator("#app")).to_have_count(0)


@when("the catalog API recovers and I retry")
async def retry(context):
    context.catalog_unavailable = False
    await role(context, "button", "Retry").click()


@then("the catalog is usable again")
async def catalog_ready(context):
    await expect(role(context, "heading", "Catalog")).to_be_visible()
    await expect(context.page.get_by_role("alert")).to_have_count(0)


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


@then("the access token has been refreshed once")
async def refreshed_login(context):
    await expect(role(context, "link", "Logout").first).to_be_visible()
    assert context.refreshes == 1, context.refreshes
    assert await token_value(context, "access_token") == "renewed-access"


@when("I log out")
async def logout(context):
    await role(context, "link", "Logout").first.click()


@then("authenticated map content is visible")
async def private_content_visible(context):
    await expect(role(context, "heading", "Rivers")).to_be_visible()
    await expect(role(context, "link", "Logout").first).to_be_visible()


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


@then("the authorized map edit link remains available")
async def edit_link(context):
    await expect(role(context, "link", "Edit")).to_have_attribute("href", re.compile(r"/admin/maps/4/$"))


@when("I open credits")
async def open_credits(context):
    await role(context, "link", "Credits").click()


@then("the native credits dialog can be closed with its button")
async def credits(context):
    dialog = context.page.get_by_role("dialog")
    await expect(dialog).to_be_visible()
    await expect(dialog).to_contain_text("Portal credits")
    await expect(dialog.get_by_role("link", name="info@gis3w.it")).to_have_attribute("href", "mailto:info@gis3w.it")
    await role(context, "button", "Close").click()
    await expect(dialog).not_to_be_visible()


@given("rich text containing formatted and executable markup")
def rich_text(context):
    context.info["home_description"] = (
        '<h1>Welcome</h1><p><strong>Formatted</strong></p>'
        '<img src="/media/banner.png" onload="window.injected=true">'
        '<script>window.injected=true</script>'
        '<a href="javascript:window.injected=true">Unsafe</a>'
    )


@then("formatting remains but active content is removed")
async def sanitized(context):
    await expect(role(context, "heading", "Welcome")).to_be_visible()
    await expect(context.page.locator("#header strong")).to_have_text("Formatted")
    await expect(context.page.locator("#header script, #header [onload]")).to_have_count(0)
    await expect(context.page.get_by_text("Unsafe", exact=True)).not_to_have_attribute("href", re.compile("javascript:"))
    assert await context.page.evaluate("window.injected") is None


@when("I visit search from home and go back")
async def browser_back(context):
    await context.page.goto("/#/en/")
    await expect(context.page).to_have_title("Home - G3W-SUITE")
    await role(context, "link", "Search").first.click()
    await expect(context.page.get_by_role("searchbox")).to_be_visible()
    await context.page.go_back()


@then("home and forward navigation still work")
async def browser_forward(context):
    await expect(role(context, "heading", "Welcome")).to_be_visible()
    await context.page.go_forward()
    await expect(context.page.get_by_role("searchbox")).to_be_visible()


@given("a narrow viewport without the top navbar")
async def mobile(context):
    await context.page.set_viewport_size({"width": 375, "height": 812})
    context.settings["PORTAL_NAVBAR_TOP"] = False


@when("I expand the menu")
async def expand_menu(context):
    await role(context, "button", "MENU").click()


@then("the menu and mobile title are visible without overflow")
async def mobile_layout(context):
    await expect(context.page.locator("#secondary-menu")).to_be_visible()
    await expect(role(context, "heading", "G3W-SUITE")).to_be_visible()
    assert await context.page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    await expect(role(context, "button", "MENU")).to_have_attribute("aria-expanded", "true")


@then("the checked-in application is served directly without npm dependencies")
async def native_delivery(context):
    await expect(context.page).to_have_title("Home - G3W-SUITE")
    for name in ["package.json", "package-lock.json", "server.js", ".nvmrc", "server.py", "config.js"]:
        assert not (context.repo / name).exists(), name
    assert not any(re.search(r"node_modules|\.vue(?:\?|$)|\.ts(?:\?|$)|@vite|unpkg|jsdelivr", url) for url in context.requests)
    client = context.browser_context.request
    for url in [url for url in context.requests if re.search(r"\.(js|css)$", url)]:
        response = await client.get(url)
        assert response.ok, url
        assert re.search(r"javascript|css", response.headers["content-type"]), url
    for path in [
        "/package.json", "/server.py", "/config.js", "/requirements-test.txt",
        "/static/frontend/missing.js",
    ]:
        assert (await client.get(path)).status == 404, path
    for method in ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]:
        response = await client.fetch("/", method=method)
        assert response.status == 405, method
        assert response.headers["allow"] == "GET, HEAD"


@when("I request the Django portal document")
async def request_document(context):
    context.document = await context.browser_context.request.get("/")


@then("its markup comes from the Django template without unresolved template syntax")
async def shared_document(context):
    html = await context.document.text()
    assert context.document.status == 200, html
    template = (context.repo / "portal" / "templates" / "portal" / "index.html").read_text(encoding="utf-8")
    assert not re.search(r"{[{%#]", html), html
    for tag in re.findall(r"<style>[\s\S]*?</style>|<noscript>[\s\S]*?</noscript>", template):
        if not re.search(r"{[{%#]", tag):
            assert tag in html
    assert '<div id="app"></div>' in html
    assert "config.js" not in html
    assert "window.API_BASE_URL" in html
    assert f"'{context.base_url}/'" in html
    assert html.count('src="/static/frontend/index.js"') == 1
    assert html.count('href="/static/frontend/assets/pico.css"') == 1
    assert html.count('href="/static/frontend/assets/index.css"') == 1
    assert html.index("window.API_BASE_URL") < html.index('<div id="app">')
    for path in ["/index.html", "/en/search"]:
        response = await context.browser_context.request.get(path)
        assert response.status == 200
        assert await response.text() == html
    response = await context.browser_context.request.head("/")
    assert response.status == 200
    assert await response.body() == b""


@given("the group is available only after authentication")
def restricted_group(context):
    context.restricted_group = True


@then("I return to the requested group with refreshed permissions")
async def returned_to_group(context):
    await expect(context.page).to_have_url(re.compile(r"#/en/group/2$"))
    await expect(role(context, "heading", "Rivers")).to_be_visible()
    await expect(role(context, "link", "Edit")).to_be_visible()


@given("a slow Italian catalog response")
async def slow_italian(context):
    context.slow_italian = True
    context.italian_started = asyncio.Event()
    context.italian_release = asyncio.Event()
    await context.page.goto("/#/en/")
    await expect(context.page).to_have_title("Home - G3W-SUITE")


@when("Italian is superseded by French before loading finishes")
async def race_languages(context):
    await context.page.evaluate("location.hash = '/it/search'")
    await asyncio.wait_for(context.italian_started.wait(), timeout=10)
    await context.page.evaluate("location.hash = '/fr/search'")
    await expect(context.page.locator("html")).to_have_attribute("lang", "fr")
    async with context.page.expect_response("**/it/portal/api/infodata/"):
        context.italian_release.set()


@then("the French document and catalog remain consistent")
async def french_wins(context):
    await expect(context.page.locator("html")).to_have_attribute("lang", "fr")
    await expect(context.page.get_by_role("searchbox")).to_have_attribute(
        "placeholder", "Trouver une carte dans le catalogue",
    )
    await expect(role(context, "heading", "Rivers")).to_be_visible()


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


@given('"{mode}" routing')
async def routing(context, mode):
    assert mode in {"history", "abstract"}, mode
    context.settings["PORTAL_HISTORY_MODE"] = mode
    await context.page.goto("/en/" if mode == "history" else "/")
    await expect(context.page).to_have_title("Home - G3W-SUITE")


@when("I open search")
async def open_search(context):
    await role(context, "link", "Search").first.click()


@then('search works with "{mode}" URL behavior')
async def routing_behavior(context, mode):
    await expect(context.page.get_by_role("searchbox")).to_be_visible()
    await expect(context.page).to_have_url(
        re.compile(r"/en/search$") if mode == "history" else context.base_url + "/",
    )
    if mode == "history":
        await context.page.reload()
        await expect(context.page.get_by_role("searchbox")).to_be_visible()


@when("I activate the skip control with the keyboard")
async def skip_control(context):
    await expect(context.page).to_have_title("Home - G3W-SUITE")
    await context.page.keyboard.press("Tab")
    await expect(context.page.locator(".skip-link")).to_be_focused()
    await context.page.keyboard.press("Enter")


@then("focus moves to content without replacing the home route")
async def skip_focus(context):
    await expect(context.page.locator("#content")).to_be_focused()
    await expect(context.page).to_have_url(re.compile(r"#/en/$"))
    await expect(role(context, "heading", "Catalog")).to_be_visible()


@given("two carousel pictures supplied out of order")
def pictures(context):
    context.pictures = [
        {"image": "/media/second.png", "author": "Second author", "order": 10},
        {"image": "/media/first.png", "author": "First author", "author_url": "https://photos.example.test/", "order": 0},
    ]


@then("the pictures rotate after five seconds with matching credits")
async def carousel(context):
    await expect(role(context, "link", "Photo by First author")).to_be_visible()
    await expect(context.page.get_by_text("Photo by Second author")).to_be_visible(timeout=7000)
    await expect(context.page.locator("#carousel img")).to_have_attribute("src", re.compile(r"/media/second\.png$"))
    await role(context, "link", "Search").first.click()
    await expect(context.page.locator("#carousel")).to_have_count(0)


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
