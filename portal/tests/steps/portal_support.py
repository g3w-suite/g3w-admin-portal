


def role(context, name, label):
    return context.page.get_by_role(name, name=label, exact=True)
