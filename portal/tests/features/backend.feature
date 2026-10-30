@backend
Feature: Django portal API contracts and permissions
  Real Django clients, fixtures and QGIS projects verify the backend.
  Every scenario runs in an isolated test database transaction.

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

  Scenario Outline: Current session identity
    Given a backend "<visitor>" session
    When the backend endpoint "portal-whoami-api" is requested
    Then the backend responds with status 200
    And the backend identity is "<visitor>"

    Examples:
      | visitor   |
      | anonymous |
      | viewer    |

  Scenario Outline: Groups require at least one visible project
    Given a backend "<visitor>" session
    When the backend endpoint "portal-group-api-list" is requested
    Then the backend responds with status 200
    And the backend returns <count> entries
    And group edit links are "<editing>"

    Examples:
      | visitor   | count | editing |
      | anonymous | 0     | absent  |
      | viewer    | 1     | absent  |
      | editor2   | 0     | absent  |
      | admin     | 1     | present |

  Scenario Outline: Projects respect viewer and editor permissions
    Given a backend "<visitor>" session
    When the backend endpoint "portal-project-api-list" is requested
    Then the backend responds with status 200
    And the backend returns <count> entries
    And project edit links are "<editing>"

    Examples:
      | visitor   | count | editing |
      | anonymous | 0     | absent  |
      | admin     | 2     | present |
      | editor2   | 0     | absent  |
      | viewer    | 1     | absent  |

  Scenario: Project map and edit URLs refer to the real group and project
    Given a backend "admin" session
    When the backend endpoint "portal-project-api-list" is requested
    Then the first backend project has its expected title and map and edit URLs

  Scenario Outline: Projects can be filtered by group
    Given a backend "admin" session
    When projects in "<group>" are requested
    Then the backend responds with status 200
    And the backend returns <count> entries

    Examples:
      | group  | count |
      | Group1 | 2     |
      | Group2 | 0     |

  Scenario Outline: Macrogroups require a visible populated group
    Given a backend "<visitor>" session
    When the backend endpoint "portal-macrogroup-api-list" is requested
    Then the backend responds with status 200
    And the backend returns <count> entries
    And macrogroup edit links are "<editing>"

    Examples:
      | visitor   | count | editing |
      | anonymous | 0     | absent  |
      | admin     | 2     | present |

  Scenario Outline: Macrogroup group lists enforce visibility
    Given a backend "<visitor>" session
    When groups in "<macrogroup>" are requested
    Then the backend responds with status 200
    And the backend returns <count> entries
    And group edit links are "<editing>"

    Examples:
      | visitor   | macrogroup  | count | editing |
      | anonymous | Macrogroup1 | 0     | absent  |
      | anonymous | Macrogroup2 | 0     | absent  |
      | admin     | Macrogroup1 | 1     | present |
      | admin     | Macrogroup2 | 1     | present |

  Scenario: Independent empty groups are excluded until they contain a project
    Given a backend "admin" session
    When the backend endpoint "portal-group-without-macrogroup-api-list" is requested
    Then the backend returns 0 entries
    When an independent empty group is created
    And the backend endpoint "portal-group-without-macrogroup-api-list" is requested
    Then the backend returns 0 entries
    When a QGIS project is added to the independent group
    And the backend endpoint "portal-group-without-macrogroup-api-list" is requested
    Then only the independent group is returned

  Scenario Outline: The catalog bundles the home endpoints
    Given a backend "<visitor>" session
    When the backend endpoint "portal-catalog-api" is requested
    Then the backend responds with status 200
    And the catalog matches the individual endpoints

    Examples:
      | visitor   |
      | anonymous |
      | viewer    |
      | admin     |

  Scenario: Public suite metadata
    When the backend endpoint "portal-infodata-api-list" is requested
    Then the backend responds with status 200
    And suite title and contact metadata are provided

  Scenario: Public pictures retain credits and media URLs
    When the backend endpoint "portal-picture-api-list" is requested
    Then the backend responds with status 200
    And picture credits and media URLs match the database

  Scenario: Panoramic projects are excluded and restored
    Given a backend "admin" session
    When the backend endpoint "portal-project-api-list" is requested
    Then the backend returns 2 entries
    When the first project becomes panoramic
    And the backend endpoint "portal-project-api-list" is requested
    Then the backend returns 1 entries
    When the panoramic association is removed
    And the backend endpoint "portal-project-api-list" is requested
    Then the backend returns 2 entries

  Scenario: Django serves the portal document
    When the backend endpoint "frontend" is requested
    Then the backend responds with status 200
    And the Django document contains the native portal entry point

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
