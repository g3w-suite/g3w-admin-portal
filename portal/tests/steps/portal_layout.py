import re

from behave import given, then, when
from playwright.async_api import expect

from portal.tests.steps.portal_support import role


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


@then("the login icon uses the linear reference style")
async def linear_login_icon(context):
    icon = context.page.locator("#main-menu .nav-login svg path")
    await expect(icon).to_have_attribute("fill", "none")
    await expect(icon).to_have_attribute("stroke", "currentColor")


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
    await expect(columns).to_have_css(
        "grid-template-columns", re.compile(r"^\S+\s+\S+\s+\S+$")
    )
    await expect(columns.locator("> address")).to_have_css("grid-column-start", "3")


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


@when("I expand the menu")
async def expand_menu(context):
    await role(context, "button", "MENU").click()


@then("the menu and mobile title are visible without overflow")
async def mobile_layout(context):
    await expect(context.page.locator("#secondary-menu")).to_be_visible()
    await expect(role(context, "heading", "G3W-SUITE")).to_be_visible()
    assert await context.page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    await expect(role(context, "button", "MENU")).to_have_attribute("aria-expanded", "true")


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
