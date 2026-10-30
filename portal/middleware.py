import re

from portal.views import PortalApiProxyView, _proxy_enabled


class PortalProxyMiddleware:
    """Routes root-level JWT token endpoints through the local portal API proxy."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token_path = re.fullmatch(r'/(authjwt/api/token/(?:refresh/|blacklist/)?)', request.path_info)
        if token_path and _proxy_enabled(request):
            return PortalApiProxyView.as_view()(request, proxy_path=token_path[1])
        return self.get_response(request)
