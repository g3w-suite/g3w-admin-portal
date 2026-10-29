import asyncio
import json
import re
from urllib.parse import parse_qs, quote, urlparse

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
    await expect(context.page.locator("#content article h3")).to_have_text("Water maps")


@when("I request the complete catalog")
async def complete_catalog(context):
    await role(context, "button", "Show all").click()


@when("I open the featured group")
async def open_featured_group(context):
    await context.page.locator("#content .item-G a").first.click()


@then("projects were requested from the group API")
async def group_api_requested(context):
    assert "/en/portal/api/group/2/projects/" in context.calls, context.calls
    await expect(role(context, "heading", "Page Not Found")).to_have_count(0)
    await expect(context.page.locator("#portal-error")).to_have_count(0)


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


@then("the default navigation colors and card layout are applied")
async def default_styles(context):
    await expect(context.page.locator("#content article")).to_have_count(1)
    for selector, color in [
        ("#top-menu", "rgb(195, 12, 38)"),
        ("#main-menu", "rgb(175, 11, 34)"),
    ]:
        await expect(context.page.locator(selector)).to_have_css("background-color", color)
        await expect(context.page.locator(selector)).to_have_css("color", "rgb(255, 255, 255)")
    card = context.page.locator("#content article").first
    await expect(card.locator("figure > img")).to_have_css("aspect-ratio", "16 / 9")
    await expect(card.locator("figure > img")).to_have_css("object-fit", "contain")
    await expect(card.locator("figure > figcaption")).to_have_css("grid-row-start", "1")
    await expect(card.locator("figure > figcaption")).to_have_css("background-color", "rgb(175, 11, 34)")
    await expect(card.locator("figure > figcaption h3")).to_have_css("font-weight", "400")
    await expect(card.locator("figure > figcaption h3 b")).to_have_css("font-weight", "700")
    await expect(card.locator("> a")).to_have_css("display", "flex")
    header_height = await context.page.evaluate(
        "parseFloat(getComputedStyle(document.documentElement).fontSize) * 3.5"
    )
    await expect(card.locator("figure > figcaption")).to_have_css("grid-template-rows", f"{header_height:g}px")
    caption = await card.locator("figure > figcaption").bounding_box()
    image = await card.locator("figure > img").bounding_box()
    assert caption and image
    assert image["y"] >= caption["y"] + caption["height"] - 1


@given("the top navbar and menu button are disabled")
def compact_navigation(context):
    context.settings.update(PORTAL_NAVBAR_TOP=False, PORTAL_MENU_BUTTON=False)
    context.info["sub_title"] = "Public map catalog"


@then("navigation stays compact without a secondary menu")
async def compact_layout(context):
    await expect(context.page.locator("#content article")).to_have_count(1)
    await expect(context.page.locator("#top-menu")).to_have_count(0)
    await expect(context.page.locator("#secondary-menu")).to_be_hidden()
    await expect(context.page.locator("[data-menu]")).to_have_count(0)
    await expect(role(context, "link", "Search")).to_be_visible()
    await expect(role(context, "link", "Login")).to_be_visible()
    navbar = await context.page.locator("#main-menu").bounding_box()
    assert navbar and navbar["height"] < 120, navbar


@then("the desktop navbar hides the title at the reference breakpoint")
async def desktop_identity(context):
    await context.page.set_viewport_size({"width": 1024, "height": 768})
    title = context.page.locator("#main-menu .nav-title")
    await expect(title).to_be_hidden()
    await expect(context.page.locator("#main-menu .nav-logo img")).to_be_visible()
    await expect(role(context, "link", "Search")).to_be_visible()
    await expect(role(context, "link", "Login")).to_be_visible()
    navbar = await context.page.locator("#main-menu").bounding_box()
    assert navbar and navbar["height"] < 90, navbar


@then("the login icon uses the filled reference style")
async def filled_login_icon(context):
    icon = context.page.locator("#main-menu .nav-login svg path")
    await expect(icon).to_have_attribute("fill", "currentColor")
    await expect(icon).to_have_attribute("stroke", "none")


@then("language flags retain their original proportions")
async def flag_dimensions(context):
    await expect(context.page.locator(".nav-lang a:visible img")).to_have_css("width", "18px")
    await expect(context.page.locator(".nav-lang a:visible img")).to_have_css("height", "12px")


@then("the home breadcrumb does not repeat the current page label")
async def home_breadcrumb(context):
    await expect(context.page.locator("#breadcrumb")).to_have_text("")
    await expect(context.page.locator('#breadcrumb [aria-current="page"]')).to_have_count(1)
    await expect(context.page.locator("#breadcrumb")).to_have_css("border-bottom-width", "0px")


@given("the footer contains policy and social links")
def footer_links(context):
    context.info.update(
        cookie_policy_url="/cookie/", privacy_policy_url="/privacy/",
        facebook_url="https://www.facebook.com/gis3w.sas/",
        twitter_url="https://twitter.com/_gis3w_", youtube_url="https://www.youtube.com/",
    )


@then("the footer policy bar spans the viewport with contrasting links")
async def footer_bar(context):
    bar = context.page.locator("#footer > nav")
    await expect(bar).to_have_css("background-color", "rgb(0, 0, 0)")
    await expect(bar.locator(":scope > div.container")).to_be_visible()
    await expect(bar.locator(":scope > div.container")).to_have_css("max-width", "1130px")
    bounds = await bar.bounding_box()
    width = await context.page.evaluate("document.documentElement.clientWidth")
    assert bounds and abs(bounds["x"]) < 1 and abs(bounds["width"] - width) < 1, bounds
    for label in ["Cookie", "Privacy", "Credits"]:
        link = bar.get_by_role("link", name=label, exact=True)
        await expect(link).to_have_css("color", "rgb(237, 240, 243)")
        await expect(link).to_have_class("contrast")


@then("social links use accessible icons instead of text labels")
async def social_icons(context):
    for label in ["Facebook", "Twitter", "Youtube"]:
        anchor = context.page.locator(".social-icons").get_by_role("link", name=label, exact=True)
        await expect(anchor).to_have_text("")
        await expect(anchor.locator("svg")).to_be_visible()
        await expect(anchor).to_have_attribute("rel", "noopener noreferrer")


@given("a tablet viewport")
async def tablet_viewport(context):
    await context.page.set_viewport_size({"width": 800, "height": 1024})


@then("footer contacts occupy the third column")
async def footer_columns(context):
    columns = context.page.locator("#footer .grid")
    about = await columns.locator("> div").first.bounding_box()
    contacts = await columns.locator("> address").bounding_box()
    grid = await columns.bounding_box()
    assert about and contacts and grid
    assert abs(about["y"] - contacts["y"]) < 1, (about, contacts)
    assert contacts["x"] > grid["x"] + grid["width"] * .6, (grid, contacts)


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
    await expect(context.page.locator("#content article h3")).to_have_text(["Water maps", "Municipality"])


@when("I open an organization and its group")
async def organization(context):
    await context.page.goto("/#/en/group")
    await role(context, "link", "Municipality").click()
    await role(context, "link", "City maps").click()


@given("internal login advertises the Django logout URL")
def django_logout_destination(context):
    context.info.update(login_url="login", logout_url="/en/logout/")


@when("I use internal logout")
async def internal_logout(context):
    if "/logout" not in context.page.url.split("#")[-1]:
        await role(context, "link", "Logout").click()


@then("logout uses the portal API without leaving the application")
async def internal_logout_completed(context):
    await expect(role(context, "link", "Login")).to_be_visible()
    assert "/en/portal/jx/logout/" in context.calls
    assert not context.authenticated
    assert "#" in context.page.url
    assert not urlparse(context.page.url).path.endswith("/logout/")


@then("breadcrumbs link to every parent without duplicate separators")
async def breadcrumb_hierarchy(context):
    crumbs = context.page.locator("#breadcrumb")
    await expect(crumbs.locator("li")).to_have_text(["Home", "Organizations", "Municipality", "City maps"])
    for label, path in [
        ("Home", "/en/"), ("Organizations", "/en/organization"),
        ("Municipality", "/en/organization/1"),
    ]:
        await expect(crumbs.get_by_role("link", name=label, exact=True)).to_have_attribute("href", f"#{path}")
    await expect(crumbs.locator('[aria-current="page"]')).to_have_text("City maps")
    separators = await crumbs.locator("li").evaluate_all(
        "items => items.slice(1).map(item => getComputedStyle(item, '::before').content)"
    )
    assert all(value in {"none", "normal", '""', '"\u200b"'} for value in separators), separators


@when("I return to the organization using breadcrumbs")
async def breadcrumb_parent(context):
    await context.page.locator("#breadcrumb").get_by_role("link", name="Municipality", exact=True).click()


@then("the organization catalog and its breadcrumb are restored")
async def breadcrumb_parent_restored(context):
    await expect(role(context, "link", "City maps")).to_be_visible()
    await expect(context.page.locator('#breadcrumb [aria-current="page"]')).to_have_text("Municipality")
    await expect(context.page.locator("#breadcrumb li")).to_have_count(3)


@then('the current breadcrumb is "{title}"')
async def current_breadcrumb(context, title):
    await expect(context.page.locator('#breadcrumb [aria-current="page"]')).to_have_text(title)


@then("project details sit beside the image with illustrated actions")
async def project_layout(context):
    card = context.page.locator(".item-P").first
    await expect(card.get_by_role("heading", name="Rivers")).to_be_visible()
    image = await card.locator("> div").bounding_box()
    description = await card.locator("> hgroup").bounding_box()
    assert image and description
    assert abs(image["y"] - description["y"]) < 1, (image, description)
    assert description["x"] >= image["x"] + image["width"] - 1
    assert description["width"] > image["width"] * 1.5
    heading = await context.page.locator("#content > hgroup").bounding_box()
    article = await card.bounding_box()
    assert heading and article
    expected_gap = await context.page.evaluate(
        "parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.5"
    )
    assert abs(article["y"] - heading["y"] - heading["height"] - expected_gap) < 1, (heading, article)
    await expect(card.get_by_role("link", name="View").locator("svg")).to_have_count(1)
    await expect(card.get_by_role("link", name="Services").locator("svg")).to_have_count(1)


@given("the group project has its own network service")
def group_service(context):
    context.group_project = {"ogc_urls": {"WMS": "/ows/group-only/4/"}}


@then("project details follow the image without horizontal overflow")
async def mobile_project_layout(context):
    card = context.page.locator(".item-P").first
    await expect(card.get_by_role("heading", name="Rivers")).to_be_visible()
    image = await card.locator("> div").bounding_box()
    description = await card.locator("> hgroup").bounding_box()
    assert image and description
    assert description["y"] >= image["y"] + image["height"] - 1
    assert await context.page.evaluate("document.documentElement.scrollWidth <= innerWidth")


@when("I open the project services")
async def open_project_services(context):
    await role(context, "link", "Services").click()


@then("the displayed project service and documentation are in the dialog")
async def project_service(context):
    dialog = context.page.get_by_role("dialog")
    await expect(dialog.locator("input.close")).to_be_visible()
    service_url = "https://dev.g3wsuite.it/ows/group-only/4/"
    service = dialog.get_by_role("link", name=service_url, exact=True)
    await expect(service).to_be_visible()
    await expect(service).to_have_attribute("href", service_url)
    await expect(service).to_have_css("color", "rgb(175, 11, 34)")
    await expect(dialog.locator('a[href*="docs.qgis.org"]')).to_have_attribute(
        "href", "https://docs.qgis.org/3.34/en/docs/server_manual/services.html"
    )


@then("the dialog locks scrolling until closed with Escape")
async def modal_scroll(context):
    await expect(context.page.get_by_role("dialog")).to_be_visible()
    overflow = await context.page.evaluate("getComputedStyle(document.documentElement).overflowY")
    assert overflow == "hidden", f"Open dialog: overflowY={overflow}"
    await context.page.keyboard.press("Escape")
    await expect(context.page.get_by_role("dialog")).to_be_hidden()
    await context.page.wait_for_function("getComputedStyle(document.documentElement).overflowY !== 'hidden'")


@when("I choose Italian from the language list")
async def choose_italian(context):
    await context.page.locator(".nav-lang a:visible").first.click()
    await context.page.locator('#language-dialog input[value="it"]').check()


@then("the login destination is retained after changing language")
async def translated_login_destination(context):
    await expect(context.page.locator("html")).to_have_attribute("lang", "it")
    query = context.page.url.split("#", 1)[1].split("?", 1)[-1]
    assert parse_qs(query).get("next") == ["/en/group/2"]


@when("I navigate to search after scrolling to the footer")
async def navigate_scrolled(context):
    await context.page.locator("#footer").scroll_into_view_if_needed()
    assert await context.page.evaluate("scrollY") > 0
    await expect(context.page.locator(".bottom-right svg")).to_be_visible()
    await role(context, "link", "Search").click()


@then("search opens at the top of the page")
async def navigation_top(context):
    await expect(context.page.get_by_role("searchbox")).to_be_visible()
    await context.page.wait_for_function("scrollY < 2")


@then("mobile navigation shows a menu button instead of crowded actions")
async def mobile_actions(context):
    await expect(role(context, "button", "MENU")).to_be_visible()
    await expect(context.page.locator("#main-menu > ul:nth-child(2) .nav-search")).to_be_hidden()
    await expect(context.page.locator("#main-menu > ul:nth-child(2) .nav-login")).to_be_hidden()


@then("search and login are available inside the expanded menu")
async def mobile_menu_actions(context):
    menu = context.page.locator("#secondary-menu")
    await expect(menu.get_by_role("link", name="Search", exact=True)).to_be_visible()
    await expect(menu.get_by_role("link", name="Login", exact=True)).to_be_visible()
    await menu.get_by_role("link", name="Search", exact=True).click()
    await expect(context.page.get_by_role("searchbox")).to_be_visible()
    await expect(context.page.locator("#secondary-menu")).to_be_hidden()


@then("administration and logout are usable in the mobile menu")
async def authenticated_mobile_menu(context):
    menu = context.page.locator("#secondary-menu")
    await expect(menu.get_by_role("link", name="Admin", exact=True)).to_be_visible()
    await menu.get_by_role("link", name="Logout", exact=True).click()
    await expect(context.page.locator("#main-menu .nav-admin")).to_have_count(0)
    await context.page.get_by_role("button", name="MENU", exact=True).click()
    await expect(menu.get_by_role("link", name="Login", exact=True)).to_be_visible()


@given("Polish and Spanish are configured")
def additional_languages(context):
    context.settings["LANGUAGES"] = ["en", "it", "pl", "es"]


@then("compact mobile actions retain accessible names without crowded labels")
async def compact_mobile_labels(context):
    await expect(role(context, "link", "Login")).to_be_visible()
    await expect(context.page.locator("#main-menu .nav-login span")).to_be_hidden()
    await expect(context.page.locator("#main-menu .nav-lang a span")).to_be_hidden()


@then("additional languages have their own names and flags")
async def additional_language_labels(context):
    menu = context.page.locator("#language-dialog")
    for locale, name in [("pl", "polski"), ("es", "español")]:
        option = menu.locator("label", has=context.page.locator(f'input[value="{locale}"]'))
        await expect(option).to_have_text(re.compile(f"^\\s*{name}$", re.IGNORECASE))
        await expect(option.locator("img")).to_have_count(1)
    await menu.locator('input[value="pl"]').check()
    await expect(context.page.locator("html")).to_have_attribute("lang", "pl")
    await expect(context.page.get_by_role("searchbox", name="Find a map in the catalog")).to_be_visible()


@given("the carousel author is unspecified")
def anonymous_picture(context):
    context.pictures[0]["author"] = ""


@then("no empty photo credit badge is drawn")
async def empty_photo_credit(context):
    credit = context.page.locator("#carousel > figcaption")
    await expect(credit).to_be_empty()
    await expect(credit).to_have_css("background-color", "rgba(0, 0, 0, 0)")
    await expect(credit).to_have_css("padding", "0px")


@given("the menu button is disabled")
def disable_menu(context):
    context.settings["PORTAL_MENU_BUTTON"] = False


@when("I expand the language list")
async def expand_languages(context):
    await context.page.locator(".nav-lang a:visible").first.click()


@then("every language is reachable without horizontal overflow")
async def language_bounds(context):
    languages = context.page.locator("#language-dialog article")
    await expect(languages).to_be_visible()
    bounds = await languages.bounding_box()
    viewport = context.page.viewport_size
    assert bounds and viewport
    assert bounds["x"] >= 0 and bounds["x"] + bounds["width"] <= viewport["width"]
    await languages.locator("label").last.scroll_into_view_if_needed()
    assert await context.page.evaluate("document.documentElement.scrollWidth <= innerWidth")


@then("credits show their branded header, logos and contact details")
async def credits_presentation(context):
    dialog = context.page.get_by_role("dialog")
    await expect(dialog.locator("article > header")).to_have_css("background-color", "rgb(149, 173, 54)")
    await expect(dialog.get_by_role("img", name="G3W SUITE", exact=True)).to_be_visible()
    await expect(dialog.get_by_role("img", name="Gis3w", exact=True)).to_be_visible()
    await expect(dialog.get_by_role("link", name="info@gis3w.it")).to_have_attribute("href", "mailto:info@gis3w.it")


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
    await context.page.locator('#language-dialog input[value="it"]').check()


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


@then('the missing group shows "{outcome}"')
async def missing_group(context, outcome):
    if outcome == "not found":
        await expect(role(context, "heading", "Page Not Found")).to_be_visible()
    else:
        assert outcome == "login", outcome
        await expect(context.page).to_have_url(re.compile(r"login\?next="))
        await expect(context.page.get_by_label("Username", exact=True)).to_be_visible()


@given("the home article limit is {limit}")
def article_limit(context, limit):
    context.settings["PORTAL_MAX_HOME_ARTICLES"] = json.loads(limit) if limit != "invalid" else limit


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
        "async locale => (await import(`/static/frontend/locale/${locale}.js`)).default['Find a map in the catalog']",
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
    assert 'type="module"' not in html
    await context.page.goto("/#/en/")
    assert await context.page.evaluate(
        "['fetch', 'login', 'logout', 'escape', 't', 'safeURL', 'whoami', 'render']"
        ".every(name => typeof portal[name] === 'function')"
    )
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
    async with context.page.expect_response("**/it/portal/api/catalog/"):
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


@given("the API is local and its media is remote")
async def remote_media(context):
    context.settings["API_BASE_URL"] = "https://dev.g3wsuite.it/"
    await context.page.route("https://dev.g3wsuite.it/media/**", lambda route: route.fulfill(
        content_type="image/svg+xml",
        body='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">'
             '<rect width="600" height="400" fill="#326789"/></svg>',
    ))


@given("the API is local and its OGC services are remote")
def remote_services(context):
    context.settings["API_BASE_URL"] = "https://dev.g3wsuite.it/"


@then("group images load from the remote media host")
async def group_images_remote(context):
    assert await context.page.evaluate("Object.hasOwn(window, 'API_ASSET_BASE_URL')") is False
    image = context.page.locator("#content article img").first
    await expect(image).to_have_attribute("src", re.compile(r"^https://dev\.g3wsuite\.it/media/"))
    await expect(image).to_have_js_property("complete", True)
    await expect(image).not_to_have_js_property("naturalWidth", 0)


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
