import re

from behave import given, then, when
from playwright.async_api import expect

from portal.tests.steps.portal_support import role


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


@then("the displayed project service is in the dialog without a documentation link")
async def project_service(context):
    dialog = context.page.get_by_role("dialog")
    await expect(dialog.locator("input.close")).to_be_visible()
    service_url = "https://dev.g3wsuite.it/ows/group-only/4/"
    service = dialog.get_by_role("link", name=service_url, exact=True)
    await expect(service).to_be_visible()
    await expect(service).to_have_attribute("href", service_url)
    await expect(service).to_have_css("color", "rgb(175, 11, 34)")
    await expect(dialog.locator('a[href*="docs.qgis.org"]')).to_have_count(0)


@then("the dialog locks scrolling until closed with Escape")
async def modal_scroll(context):
    await expect(context.page.get_by_role("dialog")).to_be_visible()
    overflow = await context.page.evaluate("getComputedStyle(document.documentElement).overflowY")
    assert overflow == "hidden", f"Open dialog: overflowY={overflow}"
    await context.page.keyboard.press("Escape")
    await expect(context.page.get_by_role("dialog")).to_be_hidden()
    await context.page.wait_for_function("getComputedStyle(document.documentElement).overflowY !== 'hidden'")


@then("credits show their branded header, logos and contact details")
async def credits_presentation(context):
    dialog = context.page.get_by_role("dialog")
    await expect(dialog.locator("article > header")).to_have_css("background-color", "rgb(149, 173, 54)")
    await expect(dialog.get_by_role("img", name="G3W SUITE", exact=True)).to_be_visible()
    await expect(dialog.get_by_role("img", name="Gis3w", exact=True)).to_be_visible()
    await expect(dialog.get_by_role("link", name="info@gis3w.it")).to_have_attribute("href", "mailto:info@gis3w.it")


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


@given("the API is local and its OGC services are remote")
def remote_services(context):
    context.settings["API_BASE_URL"] = "https://dev.g3wsuite.it/"
