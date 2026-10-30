from behave import given, then, when


def request_endpoint(context, name, **kwargs):
    from django.urls import reverse
    context.response = context.client.get(reverse(name, kwargs=kwargs or None))


def response_json(context):
    assert context.response.status_code == 200, context.response.status_code
    return context.response.json()


@given("the Django portal catalog")
def catalog(context):
    assert context.groups["Group1"].pk
    assert len(context.projects) == 2


@given('a backend "{visitor}" session')
def session(context, visitor):
    context.client.logout()
    if visitor != "anonymous":
        user = context.users[visitor]
        assert context.client.login(username=user.username, password=user.username)


@when('the backend endpoint "{endpoint}" is requested')
def request(context, endpoint):
    request_endpoint(context, endpoint)


@then("the backend responds with status {status:d}")
def status_code(context, status):
    assert context.response.status_code == status, context.response.status_code


@then('the backend identity is "{visitor}"')
def identity(context, visitor):
    data = response_json(context)
    assert data["is_authenticated"] == (visitor != "anonymous")
    if visitor != "anonymous":
        assert data["username"] == context.users[visitor].username


@then("the backend returns {count:d} entries")
def entry_count(context, count):
    data = response_json(context)
    assert len(data) == count, data


@then("the catalog matches the individual endpoints")
def catalog_matches(context):
    from portal.api.views import CatalogApiView
    catalog = response_json(context)
    assert set(catalog) == set(CatalogApiView.views), catalog
    for key, (_, name) in CatalogApiView.views.items():
        request_endpoint(context, name)
        assert catalog[key] == response_json(context), key


@then('{kind} edit links are "{editing}"')
def edit_links(context, kind, editing):
    from django.urls import reverse
    assert editing in {"present", "absent"}
    for item in response_json(context):
        if kind == "group":
            group = context.groups["Group1"]
            assert item["id"] == group.pk
            expected = reverse("group-update", kwargs={"slug": group.slug})
        elif kind == "project":
            project = next(project for project in context.projects if project.pk == item["id"])
            expected = reverse("qdjango-project-update", kwargs={
                "group_slug": project.group.slug, "slug": project.slug,
            })
        else:
            assert kind == "macrogroup", kind
            macro = next(macro for macro in context.macrogroups.values() if macro.pk == item["id"])
            expected = reverse("macrogroup-update", kwargs={"slug": macro.slug})
        if editing == "present":
            assert item["edit_url"] == expected, item
        else:
            assert "edit_url" not in item, item


@then("the first backend project has its expected title and map and edit URLs")
def project_urls(context):
    from django.urls import reverse
    item = response_json(context)[0]
    project = context.projects[0]
    assert item["id"] == project.pk
    assert item["title"] == project.title
    assert item["map_url"] == reverse("group-project-map", kwargs={
        "group_slug": project.group.slug, "project_type": "qdjango", "project_id": project.pk,
    })
    assert item["edit_url"] == reverse("qdjango-project-update", kwargs={
        "group_slug": project.group.slug, "slug": project.slug,
    })


@when('projects in "{group}" are requested')
def projects_by_group(context, group):
    request_endpoint(context, "portal-project-by-group-api-list", group_id=context.groups[group].pk)


@when('groups in "{macrogroup}" are requested')
def groups_by_macrogroup(context, macrogroup):
    request_endpoint(context, "portal-group-by-macrogroup-api-list",
                     macrogroup_id=context.macrogroups[macrogroup].pk)


@when("an independent empty group is created")
def independent_group(context):
    from core.models import Group, G3WSpatialRefSys
    context.independent_group = Group.objects.create(
        name="Group33", title="Group33", header_logo_img="",
        srid=G3WSpatialRefSys.objects.get(auth_srid=4326),
    )


@when("a QGIS project is added to the independent group")
def populate_group(context):
    add_project(context, context.independent_group)


@given('a QGIS project is added to "{group}"')
def populate_named_group(context, group):
    add_project(context, context.groups[group])


def add_project(context, group):
    from django.core.files import File
    from qdjango.utils.data import QgisProject
    with (context.datasource / "portal_test_project2.qgs").open() as source:
        project = QgisProject(File(source))
        project.group = group
        project.save()


@then("only the independent group is returned")
def independent_result(context):
    data = response_json(context)
    assert len(data) == 1, data
    assert data[0]["id"] == context.independent_group.pk
    assert data[0]["name"] == "Group33"


@then("suite title and contact metadata are provided")
def suite_metadata(context):
    data = response_json(context)
    assert "title" in data and "about_name" in data, data


@then("picture credits and media URLs match the database")
def picture_metadata(context):
    from django.conf import settings
    from portal.models import Picture
    pictures = list(Picture.objects.order_by("order"))
    data = response_json(context)
    assert len(data) == len(pictures)
    assert pictures, "The portal_picture fixture must contain pictures"
    picture = pictures[0]
    assert data[0]["author"] == picture.author
    assert data[0]["author_url"] == picture.author_url
    assert data[0]["image"] == f"{settings.MEDIA_URL}{picture.image}"


@when("the first project becomes panoramic")
def panoramic_project(context):
    from core.models import GroupProjectPanoramic
    context.panoramic = GroupProjectPanoramic.objects.create(
        group_id=context.groups["Group1"].pk, project_type="qdjango",
        project_id=context.projects[0].pk,
    )


@when("the panoramic association is removed")
def remove_panorama(context):
    context.panoramic.delete()


@then("the Django document contains the native portal entry point")
def portal_document(context):
    html = context.response.content.decode()
    assert 'type="module"' not in html and "<script defer" in html and "frontend/index.js" in html
    assert '<div id="app">' in html


@when("valid backend credentials are submitted")
def valid_login(context):
    from django.urls import reverse
    username = context.users["admin"].username
    context.response = context.client.post(reverse("portal-ajax-login"), {
        "username": username, "password": username,
    })


@when("invalid backend credentials are submitted")
def invalid_login(context):
    from django.urls import reverse
    context.response = context.client.post(reverse("portal-ajax-login"), {
        "username": "xxxxx", "password": "xxxxx",
    })


@then('the backend operation reports "{status}"')
def operation_result(context, status):
    assert response_json(context)["status"] == status


@then('the backend logout message is "{message}"')
def logout_message(context, message):
    assert response_json(context)["message"] == message


@given('the first project thumbnail is "{thumbnail}"')
def project_thumbnail(context, thumbnail):
    project = context.projects[0]
    project.thumbnail = "" if thumbnail == "none" else thumbnail
    project.save()


@given('"{owner}" uses its logo for the client')
def client_logo(context, owner):
    if owner in context.groups:
        group = context.groups[owner]
        group.header_logo_img = f"{owner.lower()}.png"
        group.use_logo_client = True
        group.save()
    elif owner in context.macrogroups:
        macro = context.macrogroups[owner]
        macro.use_logo_client = True
        macro.save()
    else:
        assert owner == "nobody", owner


@then('the first project thumbnail is "{expected}"')
def thumbnail_result(context, expected):
    from django.conf import settings
    item = next(item for item in response_json(context) if item["id"] == context.projects[0].pk)
    if expected == "placeholder":
        assert item["thumbnail"] == "https://placehold.co/80x60?text=MAP", item
    else:
        assert item["thumbnail"] == f"{settings.MEDIA_URL}{expected}", item


@then("every backend project exposes its WMS service URL")
def ogc_urls(context):
    from django.urls import reverse
    for item in response_json(context):
        project = next(project for project in context.projects if project.pk == item["id"])
        assert item["ogc_urls"]["WMS"] == reverse("OWS:ows", args=[project.group.slug, "qdjango", project.pk]), item


@when('"{name}" is moved to the top in the administration')
def move_to_top(context, name):
    item = context.groups.get(name) or context.macrogroups[name]
    item.refresh_from_db()
    item.top()


@then('the backend titles are "{titles}"')
def ordered_titles(context, titles):
    assert [item["title"] for item in response_json(context)] == titles.split(", "), response_json(context)


@when("the first project is moved to the trash")
def trash_project(context):
    from django.urls import reverse
    project = context.projects[0]
    response = context.client.post(reverse("qdjango-project-deactive", kwargs={
        "group_slug": project.group.slug, "slug": project.slug,
    }))
    assert response.status_code == 200, response.status_code


@when('"{group}" is moved to the trash')
def trash_group(context, group):
    from django.urls import reverse
    response = context.client.post(reverse("group-deactive", kwargs={"slug": context.groups[group].slug}))
    assert response.status_code == 200, response.status_code


@then("no social login provider is advertised")
def no_social_login(context):
    assert "social_auth_providers" not in response_json(context)


@given('a "{provider}" social login application')
def social_application(context, provider):
    from allauth.socialaccount.models import SocialApp
    from django.contrib.sites.models import Site
    app = SocialApp.objects.create(provider=provider, name=provider, client_id="portal", secret="portal")
    app.sites.add(Site.objects.get_current())


@then('the "{provider}" social login URL is advertised')
def social_login(context, provider):
    from django.urls import reverse
    providers = response_json(context)["social_auth_providers"]
    assert list(providers) == [provider], providers
    assert providers[provider].startswith(reverse(f"{provider}_login")), providers


@then("the Django document advertises the installed portal version")
def portal_version(context):
    import re
    from importlib.metadata import version
    html = context.response.content.decode()
    expected = f'<meta name="generator" content="g3w-portal v{version("portal")}" />'
    assert expected in html, re.findall(r'<meta name="generator"[^>]*>', html)


@then("the Django document context has no deprecated portal settings")
def deprecated_settings(context):
    keys = set(context.response.context.keys())
    assert "API_BASE_URL" in keys and "LANGUAGES" in keys, keys
    assert not keys & {"IS_PA", "PORTAL_SECTIONS", "ADMIN_BTN", "PORTAL_COLOR"}, keys


@when('the identity is requested with the redirect "{url}"')
def whoami_redirect(context, url):
    from django.urls import reverse
    context.redirect = url
    context.response = context.client.get(reverse("portal-whoami-api"), {"redirect": url})


@then('the identity response is "{kind}"')
def whoami_redirect_result(context, kind):
    if kind == "anonymous json":
        assert response_json(context) == {"is_authenticated": False}
        return
    assert kind == "redirect splash page", kind
    assert "portal/login_redirect.html" in [template.name for template in context.response.templates]
    assert "Location" not in context.response
    html = context.response.content.decode()
    assert f'<meta http-equiv="refresh" content="3;url={context.redirect}">' in html, html


@then("the session cookie is not partitioned")
def unpartitioned_cookie(context):
    from django.conf import settings
    cookies = context.response.cookies
    assert settings.SESSION_COOKIE_NAME in cookies, cookies
    assert "partitioned" not in cookies.output().lower(), cookies.output()
