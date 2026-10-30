@backend
Feature: Django portal sessions and administration
  Session identity, ajax login/logout, the portal document and picture administration.

  Background:
    Given the Django portal catalog

  Scenario: Django serves the portal document
    When the backend endpoint "frontend" is requested
    Then the backend responds with status 200
    And the Django document contains the native portal entry point

  Scenario Outline: Current session identity
    Given a backend "<visitor>" session
    When the backend endpoint "portal-whoami-api" is requested
    Then the backend responds with status 200
    And the backend identity is "<visitor>"

    Examples:
      | visitor   |
      | anonymous |
      | viewer    |

  Scenario: Ajax login and logout update the real session
    When valid backend credentials are submitted
    Then the backend responds with status 200
    And the backend operation reports "ok"
    When the backend endpoint "portal-ajax-logout" is requested
    Then the backend responds with status 200
    And the backend operation reports "ok"
    And the backend logout message is "Logout"
    When invalid backend credentials are submitted
    Then the backend responds with status 200
    And the backend operation reports "error"

  Scenario Outline: Picture administration is reserved for administrators
    Given a backend "<visitor>" session
    When the backend endpoint "<endpoint>" is requested
    Then the backend responds with status <status>

    Examples:
      | visitor   | endpoint           | status |
      | anonymous | portal-picture     | 302    |
      | editor1   | portal-picture     | 403    |
      | admin     | portal-picture     | 200    |
      | anonymous | portal-picture-add | 302    |
      | editor1   | portal-picture-add | 403    |
      | admin     | portal-picture-add | 200    |
