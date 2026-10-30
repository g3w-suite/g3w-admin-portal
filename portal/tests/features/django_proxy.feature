@backend
Feature: Local development API proxy
  On localhost the portal transparently forwards its API calls to a remote PORTAL_API_BASE_URL.

  Background:
    Given the Django portal catalog

  Scenario: Local API proxy forwards and scopes remote session cookies
    When a proxy request from "localhost:8000" targets "it/portal/api/infodata/"
    Then the proxy forwards only remote session cookies and scopes the response cookies
    And the proxy makes relative URLs point to the remote host

  Scenario: Local API proxy builds the catalog from the remote endpoints
    When a proxy request from "localhost:8000" targets "it/portal/api/catalog/"
    Then the proxy aggregates the remote catalog endpoints

  Scenario Outline: API proxy ignores non-local hosts and unapproved paths
    When a proxy request from "<host>" targets "<target>"
    Then the local server handles the request without contacting upstream

    Examples:
      | host           | target                  |
      | example.com    | it/portal/api/infodata/ |
      | localhost:8000 | admin/                 |

  Scenario Outline: Root JWT token endpoints are proxied only on localhost
    When a JWT token request from "<host>" targets "/authjwt/api/token/refresh/"
    Then the token request is handled by "<handler>"

    Examples:
      | host           | handler    |
      | localhost:8000 | the proxy  |
      | example.com    | the server |
