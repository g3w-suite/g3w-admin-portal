import asyncio
import re
from urllib.parse import parse_qs

from behave import given, then, when
from playwright.async_api import expect

from portal.tests.steps.portal_support import role


@when("I choose Italian from the language list")
async def choose_italian(context):
    await context.page.locator(".nav-lang a:visible").first.click()
    await context.page.locator('#language-dialog input[value="it"]').check()


@then("the login destination is retained after changing language")
async def translated_login_destination(context):
    await expect(context.page.locator("html")).to_have_attribute("lang", "it")
    query = context.page.url.split("#", 1)[1].split("?", 1)[-1]
    assert parse_qs(query).get("next") == ["/en/group/2"]


@given("Polish and Spanish are configured")
def additional_languages(context):
    context.settings["LANGUAGES"] = ["en", "it", "pl", "es"]


@given('the configured languages are "{languages}"')
def configured_languages(context, languages):
    context.settings["LANGUAGES"] = languages.split(", ")


@then('the portal falls back to "{locale}"')
async def fallback_language(context, locale):
    await expect(context.page).to_have_url(re.compile(f"/#/{locale}/$"))
    await expect(context.page.locator("html")).to_have_attribute("lang", locale)
    await expect(role(context, "heading", "Catalog")).to_be_visible()
    assert [path for path in context.calls if path.endswith("/api/catalog/")] == [f"/{locale}/portal/api/catalog/"], context.calls


@then("compact mobile actions retain accessible names without crowded labels")
async def compact_mobile_labels(context):
    await expect(role(context, "link", "Login")).to_be_visible()
    await expect(context.page.locator("#main-menu .nav-login span")).to_be_hidden()
    await expect(context.page.locator("#main-menu .nav-lang a span")).to_be_hidden()


@then("additional languages have their own names and flags")
async def additional_language_labels(context):
    menu = context.page.locator("#language-dialog")
    for locale, name in [("it", "Italiano"), ("pl", "Polski"), ("es", "Español")]:
        option = menu.locator("label", has=context.page.locator(f'input[value="{locale}"]'))
        await expect(option).to_have_text(re.compile(f"^\\s*{name}$"))
        await expect(option.locator("img")).to_have_count(1)
    await menu.locator("input.close").click()


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


@then('the catalog and search label use "{locale}"')
async def translation(context, locale):
    await expect(context.page.locator("html")).to_have_attribute("lang", locale)
    await expect(role(context, "heading", "Rivers")).to_be_visible()
    placeholder = await context.page.evaluate(
        "async locale => (await import(`/static/frontend/locale/${locale}.js`)).default['Find a map in the catalog']",
        locale,
    )
    await expect(context.page.get_by_role("searchbox")).to_have_attribute("placeholder", placeholder)


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
