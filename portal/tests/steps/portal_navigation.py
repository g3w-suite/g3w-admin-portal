import re

from behave import given, then, when
from playwright.async_api import expect

from portal.tests.steps.portal_support import role


@when("I open an organization and its group")
async def organization(context):
    await context.page.goto("/#/en/group")
    await role(context, "link", "Municipality").click()
    await role(context, "link", "City maps").click()


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
