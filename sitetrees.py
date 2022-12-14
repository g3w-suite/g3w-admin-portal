from sitetree.utils import item
from core.utils.tree import G3Wtree

sitetrees = (
    # Define a tree with `tree` function.
    G3Wtree(
        'portal_sidebar_right',
        title  = 'Portal pictures sidebar right',
        module = 'portal',
        items  = [
            item(
                'PORTAL',
                '#',
                type_header = True
            ),
            item(
                'Immagini',
                'portal-picture',
                icon_css_class = 'fa fa-image',
                description = 'Gestisci le immagini del portale di accesso...'
            ),
        ]
    ),

    G3Wtree(
        'Portal_sidebar_right_en',
        title  = 'Portal pictures sidebar right',
        module = 'portal',
        items = [
            item(
                'PORTAL',
                '#',
                type_header = True
            ),
            item(
                'Pictures',
                'portal-picture',
                icon_css_class = 'fa fa-image',
                description = 'Portal pictures manager...'
            ),
        ]
    ),
)

