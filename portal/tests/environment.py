import asyncio
import importlib
import os
import re
import shutil
import tempfile
from pathlib import Path
from types import ModuleType

from behave.model_core import Status
from playwright.async_api import async_playwright


REPO = Path(__file__).resolve().parents[2]
FIXTURES = [
    "BaseLayer.json", "G3WMapControls.json", "G3WSpatialRefSys.json",
    "G3WGeneralDataSuite.json", "portal_picture.json",
]


def start_backend(context):
    if not os.environ.get("DJANGO_SETTINGS_MODULE"):
        raise RuntimeError(
            "Backend scenarios require the G3W-ADMIN/QGIS environment and "
            "DJANGO_SETTINGS_MODULE=base.settings. Use --tags=browser for browser-only tests."
        )
    import django
    django.setup()

    import base.urls
    from django.test import override_settings
    from django.test.utils import (
        setup_databases, setup_test_environment, teardown_databases, teardown_test_environment,
    )
    from django.urls import clear_url_caches

    def reload_urls():
        importlib.reload(base.urls)
        clear_url_caches()

    overrides = override_settings(
        CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
        G3WADMIN_LOCAL_MORE_APPS=["portal"], FRONTEND=True, FRONTEND_APP="portal",
    )
    overrides.enable()

    def restore_settings():
        overrides.disable()
        reload_urls()

    context.add_cleanup(restore_settings)
    reload_urls()
    setup_test_environment()
    context.add_cleanup(teardown_test_environment)
    databases = setup_databases(verbosity=1, interactive=False, aliases={"default"})
    context.add_cleanup(teardown_databases, databases, verbosity=1)


def prepare_backend(context):
    from django.conf import settings
    from django.core.cache import caches
    from django.core.management import call_command
    from django.db import transaction
    from django.test import override_settings
    from django.utils import translation
    from rest_framework.test import APIClient

    directory = tempfile.TemporaryDirectory(prefix="portal-bdd-")
    context.add_cleanup(directory.cleanup)
    data = Path(directory.name) / "data"
    shutil.copytree(Path(__file__).resolve().parent / "pdata", data)
    context.datasource = data
    overrides = override_settings(DATASOURCE_PATH=str(data) + os.sep, MEDIA_ROOT=directory.name)
    overrides.enable()
    context.add_cleanup(overrides.disable)
    caches["default"].clear()

    atomic = transaction.atomic()
    atomic.__enter__()

    def rollback():
        transaction.set_rollback(True)
        atomic.__exit__(None, None, None)

    context.add_cleanup(rollback)
    for fixture in FIXTURES:
        call_command("loaddata", fixture, verbosity=0)
    locale = translation.override(settings.LANGUAGE_CODE[:2])
    locale.__enter__()
    context.add_cleanup(locale.__exit__, None, None, None)
    seed_catalog(context)
    context.client = APIClient()


def seed_catalog(context):
    from core.models import Group, G3WSpatialRefSys, MacroGroup
    from django.contrib.auth import get_user_model
    from django.core.files import File
    from guardian.compat import get_user_model as get_guardian_user_model
    from qdjango.utils.data import QgisProject
    from usersmanage.models import Group as UserGroup

    user_model = get_user_model()
    context.users = {}
    for role, username, group in [
        ("admin", "admin01", None),
        ("editor1", "user01", "Editor Level 1"),
        ("editor2", "user02", "Editor Level 2"),
        ("viewer", "user03", "Viewer Level 1"),
        ("other viewer", "user04", "Viewer Level 1"),
    ]:
        user = user_model.objects.create_user(username=username, password=username)
        if group:
            user.groups.add(UserGroup.objects.get(name=group))
        else:
            user.is_superuser = True
            user.save()
        context.users[role] = user

    context.groups = {}
    for name in ["Group1", "Group2"]:
        context.groups[name] = Group.objects.create(
            name=name, title=name, header_logo_img="",
            srid=G3WSpatialRefSys.objects.get(auth_srid=4326),
        )
    group1, group2 = context.groups.values()
    group1.addPermissionsToEditor(context.users["editor2"])
    context.macrogroups = {}
    for name in ["Macrogroup1", "Macrogroup2"]:
        macro = MacroGroup.objects.create(title=name, logo_img=f"{name.lower()}.png")
        context.macrogroups[name] = macro
        group1.macrogroups.add(macro)
    group2.macrogroups.add(context.macrogroups["Macrogroup1"])
    group2.addPermissionsToViewers(users_id=[
        context.users["viewer"].pk, get_guardian_user_model().get_anonymous().pk,
    ])
    context.projects = []
    for filename in ["portal_test_project.qgs", "portal_test_project2.qgs"]:
        with (context.datasource / filename).open() as source:
            project = QgisProject(File(source))
            if not context.projects:
                project.title = "A project"
            project.group = group1
            project.save()
            context.projects.append(project.instance)
    context.projects[0].addPermissionsToViewers([context.users["viewer"].pk])
    group1.addPermissionsToViewers(users_id=[context.users["viewer"].pk])


def before_all(context):
    context.repo = REPO
    context.results = Path(__file__).resolve().parent / "results"
    context.results.mkdir(parents=True, exist_ok=True)


def before_feature(context, feature):
    if "backend" in feature.tags:
        start_backend(context)
    elif "browser" in feature.tags:
        start_browser(context)
    else:
        raise ValueError(f"Feature requires @backend or @browser: {feature.name}")


def start_browser(context):
    import django
    from django.conf import settings
    from django.contrib.staticfiles.handlers import StaticFilesHandler
    from django.shortcuts import render
    from django.test import override_settings
    from django.test.testcases import LiveServerThread, ThreadedWSGIServer
    from django.urls import re_path
    from django.views.decorators.http import require_safe

    browser_name = context.config.userdata.get("browser", "chromium")
    if browser_name not in {"chromium", "firefox", "webkit"}:
        raise ValueError(f"Unsupported browser: {browser_name}")
    headless = context.config.userdata.get("headless", "true").lower()
    if headless not in {"true", "false"}:
        raise ValueError("headless must be true or false")

    @require_safe
    def document(request):
        portal_settings = {
            "PORTAL_AUTH_MODE": "cookie", "PORTAL_MAX_HOME_ARTICLES": 1,
            "PORTAL_NAVBAR_TOP": True,
            "PORTAL_MENU_BUTTON": True,
            **getattr(context, "settings", {}),
        }
        return render(request, "portal/index.html", {
            "API_BASE_URL": portal_settings.get("API_BASE_URL", request.build_absolute_uri("/")),
            "LANGUAGES": portal_settings.get("LANGUAGES", ["en", "it", "fr", "de", "bg", "fi", "pt", "ro", "se"]),
            "PORTAL_VERSION": "test", "admin_page_title": "G3W-SUITE",
            "SETTINGS": portal_settings,
        })

    urls = ModuleType("portal_browser_urls")
    # Behave executes hooks without module metadata; Django needs it for views.
    document.__module__ = urls.__name__
    urls.urlpatterns = [
        re_path(r"^(?:index\.html|(?:en|it|fr|de|bg|fi|pt|ro|se)/.*)?$", document),
    ]
    if not settings.configured and not os.environ.get("DJANGO_SETTINGS_MODULE"):
        settings.configure(SECRET_KEY="portal-browser-tests")
    django.setup()
    overrides = override_settings(
        ROOT_URLCONF=urls, ALLOWED_HOSTS=["127.0.0.1"], LANGUAGE_CODE="en", DEBUG=True,
        INSTALLED_APPS=["django.contrib.staticfiles"], MIDDLEWARE=[],
        STATIC_URL="/static/", STATICFILES_DIRS=[REPO / "portal" / "static"],
        STATIC_ROOT=None, MEDIA_URL="/media/", MEDIA_ROOT="",
        TEMPLATES=[{
            "BACKEND": "django.template.backends.django.DjangoTemplates",
            "DIRS": [REPO / "portal" / "templates"],
        }],
    )
    overrides.enable()
    context.add_cleanup(overrides.disable)
    class BrowserServer(ThreadedWSGIServer):
        request_queue_size = 128

    server = LiveServerThread("127.0.0.1", StaticFilesHandler)
    server.server_class = BrowserServer
    server.start()
    context.add_cleanup(server.terminate)
    if not server.is_ready.wait(timeout=15):
        raise RuntimeError("Django browser test server did not start")
    if server.error:
        raise server.error
    context.base_url = f"http://127.0.0.1:{server.port}"

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    context.loop = loop
    context.add_cleanup(loop.close)

    async def start_browser():
        driver = await async_playwright().start()
        context.add_cleanup(lambda: loop.run_until_complete(driver.stop()))
        browser = await getattr(driver, browser_name).launch(headless=headless == "true")
        context.add_cleanup(lambda: loop.run_until_complete(browser.close()))
        return browser

    context.browser = loop.run_until_complete(start_browser())
    context.browser_name = browser_name


def before_scenario(context, scenario):
    if "backend" in scenario.effective_tags:
        prepare_backend(context)
        return
    context.settings = {}
    context.info = {}
    context.pictures = [{"image": "/media/banner.png", "author": "Cartographer", "order": 0}]
    context.authenticated = False
    context.calls = []
    context.requests = []

    async def start_scenario():
        browser_context = await context.browser.new_context(
            base_url=context.base_url, locale="en-GB", viewport={"width": 1280, "height": 720},
        )
        context.browser_context = browser_context
        context.add_cleanup(lambda: context.loop.run_until_complete(browser_context.close()))
        await browser_context.tracing.start(screenshots=True, snapshots=True, sources=True)
        context.page = await browser_context.new_page()
        context.page.set_default_timeout(10_000)
        context.page.set_default_navigation_timeout(30_000)
        context.page.on("request", lambda request: context.requests.append(request.url))

    context.loop.run_until_complete(start_scenario())


def after_scenario(context, scenario):
    if "backend" in scenario.effective_tags:
        return
    async def finish_scenario():
        if scenario.status in {Status.failed, Status.error, Status.hook_error}:
            name = re.sub(r"[^a-zA-Z0-9_-]+", "-", scenario.name)
            path = context.results / f"{context.browser_name}-{name}"
            try:
                await context.page.screenshot(path=str(path.with_suffix(".png")), full_page=True)
            finally:
                await context.browser_context.tracing.stop(path=str(path.with_suffix(".zip")))
        else:
            await context.browser_context.tracing.stop()

    context.loop.run_until_complete(finish_scenario())
