from django.conf import settings

def get_response_headers(self, request, token_key  = '__drftk'):
    """
    Set appropriate `"Content-Security-Policy"` header when a token is found within a GET request 

    Example requests:
    ```html
        <iframe hidden src="http://remotehost:8080/en/portal/api/whoami/?__drftk=<drf_token>"></iframe>
        <iframe hidden src="http://remotehost:8080/en/portal/jx/logout/?__drftk=<drf_token>"></iframe>
    ```

    Expected response:
    ```
        'Content-Security-Policy': "frame-ancestors 'self' http://remotehost:8080"
    ```

    Sample config:
    ```
        CSP_FRAME_SRC        = [ 'http://remotehost:8080' ] # OPTIONAL: fallbacks to CORS_ALLOWED_ORIGINS
        CORS_ALLOWED_ORIGINS = [ 'http://remotehost:8080' ] 
    ```
    """

    ## TODO check this settings again in future django releases ("django-csp" will be included in "django-core")
    # --------------------------------------------
    # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#frame-src
    # https://django-csp.readthedocs.io/en/3.5/configuration.html
    # https://github.com/mozilla/django-csp/issues/186
    csp_frame_src = getattr(settings, 'CSP_FRAME_SRC', getattr(settings, 'CORS_ALLOWED_ORIGINS', [])) 

    # try to found token key into url
    if (token_key in request.GET): # and 'iframe' == request.META.HTTP_SEC_FETCH_DEST
        return {
            'Content-Security-Policy': "frame-ancestors 'self' " + " ".join(csp_frame_src)
        }
    return None 