import json
import re

from behave import given, then, when
from playwright.async_api import expect

from portal.tests.steps.portal_support import role


@then("the home page shows one featured card and a photo credit")
async def home(context):
    await expect(context.page).to_have_title("Home - G3W-SUITE")
    await expect(role(context, "heading", "Welcome")).to_be_visible()
    await expect(context.page.get_by_text("Photo by Cartographer")).to_be_visible()
    await expect(context.page.locator("#content article")).to_have_count(1)
    await expect(context.page.locator("#content article h3")).to_have_text("Municipality")


@when("I request the complete catalog")
async def complete_catalog(context):
    await role(context, "button", "Show all").click()


@when("I open the featured group")
async def open_featured_group(context):
    await context.page.locator("#content .item-G a").first.click()


@then('the catalog cards are "{titles}"')
async def catalog_cards(context, titles):
    await expect(context.page.locator("#content article h3")).to_have_text(titles.split(", "))


@given('the theme primary color is "{color}"')
def theme_primary(context, color):
    context.settings["PORTAL_CUSTOM_CSS"] = f":root {{ --primary: {color}; }}"


@given("the portal script is unavailable")
async def missing_script(context):
    await context.page.route("**/frontend/index.js", lambda route: route.abort())


@then('the loading spinner uses "{color}"')
async def spinner_color(context, color):
    await expect(context.page.locator("#app")).to_be_attached()
    for pseudo in ["::before", "::after"]:
        background = await context.page.evaluate(
            "pseudo => getComputedStyle(document.body, pseudo).backgroundColor", pseudo,
        )
        assert background == color, (pseudo, background)


@then("projects were requested from the group API")
async def group_api_requested(context):
    assert "/en/portal/api/group/2/projects/" in context.calls, context.calls
    await expect(role(context, "heading", "Page Not Found")).to_have_count(0)
    await expect(context.page.locator("#portal-error")).to_have_count(0)


@given("the home has no carousel pictures")
def no_carousel(context):
    context.pictures = []
    context.info["home_description"] = "A readable home description"


@then("the home description and footer use readable dark theme colors")
async def themed_text(context):
    await expect(context.page.locator("#header > .container")).to_have_text("A readable home description")
    await expect(context.page.locator("#carousel")).to_have_count(0)
    for selector in ["#header > .container", "#footer"]:
        colors = await context.page.locator(selector).evaluate(
            "element => { const css = getComputedStyle(element); "
            "return { color: css.color, expected: css.getPropertyValue('--color').trim() }; }"
        )
        expected = await context.page.evaluate(
            "color => { const probe = document.createElement('span'); probe.style.color = color; "
            "document.body.append(probe); const result = getComputedStyle(probe).color; "
            "probe.remove(); return result; }", colors["expected"],
        )
        assert colors["color"] == expected, (selector, colors)


@then("the archive contains both catalog entries")
async def archive(context):
    await expect(context.page.locator("#content article")).to_have_count(2)
    await expect(context.page.locator("#content article h3")).to_have_text(["Municipality", "Water maps"])


@given("the carousel author is unspecified")
def anonymous_picture(context):
    context.pictures[0]["author"] = ""


@then("no empty photo credit badge is drawn")
async def empty_photo_credit(context):
    credit = context.page.locator("#carousel > figcaption")
    await expect(credit).to_be_empty()
    await expect(credit).to_have_css("background-color", "rgba(0, 0, 0, 0)")
    await expect(credit).to_have_css("padding", "0px")


@given("the home article limit is {limit}")
def article_limit(context, limit):
    context.settings["PORTAL_MAX_HOME_ARTICLES"] = json.loads(limit) if limit != "invalid" else limit


@then('there are {cards:d} home cards and the show-all control is "{visibility}"')
async def home_limit(context, cards, visibility):
    assert visibility in {"visible", "absent"}, visibility
    await expect(context.page).to_have_title("Home - G3W-SUITE")
    await expect(context.page.locator("#content article")).to_have_count(cards)
    await expect(role(context, "button", "Show all")).to_have_count(int(visibility == "visible"))


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
    assert 'type="module"' not in html
    await context.page.goto("/#/en/")
    await expect(context.page.locator("#main-menu")).to_be_visible()
    assert await context.page.evaluate("!('portal' in window)")
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


@given("the API is local and its media is remote")
async def remote_media(context):
    context.settings["API_BASE_URL"] = "https://dev.g3wsuite.it/"
    await context.page.route("https://dev.g3wsuite.it/media/**", lambda route: route.fulfill(
        content_type="image/svg+xml",
        body='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">'
             '<rect width="600" height="400" fill="#326789"/></svg>',
    ))


@then("group images load from the remote media host")
async def group_images_remote(context):
    assert await context.page.evaluate("Object.hasOwn(window, 'API_ASSET_BASE_URL')") is False
    image = context.page.locator("#content article img").first
    await expect(image).to_have_attribute("src", re.compile(r"^https://dev\.g3wsuite\.it/media/"))
    await expect(image).to_have_js_property("complete", True)
    await expect(image).not_to_have_js_property("naturalWidth", 0)


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
