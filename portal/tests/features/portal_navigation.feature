@browser
Feature: Catalog navigation and routing
  Organizations, groups, breadcrumbs and routes stay consistent.

  Background:
    Given a portal with mocked Django APIs

  @issue-3 @issue-4
  Scenario: Navigate organization, group, map and services
    When I open an organization and its group
    Then the map and its network services remain available

  @issue-17
  Scenario Outline: Missing organization or nested group for a visitor
    Given the visitor is "<session>"
    When I open "/#/en/<path>"
    Then the missing group shows "<outcome>"

    Examples:
      | session       | path               | outcome   |
      | anonymous     | organization/999   | login     |
      | authenticated | organization/999   | not found |
      | anonymous     | organization/1/999 | login     |
      | authenticated | organization/1/999 | not found |

  Scenario: Search title and description without case sensitivity
    When I search for "HYDROLOGY"
    Then only Rivers is shown and title searching and clearing still work

  @issue-20
  Scenario: Breadcrumbs retain the organization and group hierarchy
    When I open an organization and its group
    Then breadcrumbs link to every parent without duplicate separators
    When I return to the organization using breadcrumbs
    Then the organization catalog and its breadcrumb are restored

  @issue-21
  Scenario: Untranslated organizations show their identification name
    Given the organization is untranslated and named "Gran Paradiso"
    When I open "/#/en/"
    Then the catalog cards are "Gran Paradiso"
    When I open "/#/en/organization/1"
    Then the organization page is titled "Gran Paradiso"
    And the breadcrumbs are "Home, Organizations, Gran Paradiso"
    When I open "/#/en/organization/1/3"
    Then the breadcrumbs are "Home, Organizations, Gran Paradiso, City maps"

  @issue-5
  Scenario: A group inside an organization can be opened directly
    When I open "/#/en/group/3"
    Then the map and its network services remain available
    And the current breadcrumb is "City maps"

  @issue-5
  Scenario: An authenticated group page survives a reload
    Given the visitor is "authenticated"
    When I open "/#/en/group/2"
    And I reload the page
    Then the map and its network services remain available
    And the current breadcrumb is "Water maps"

  Scenario: Navigation from the footer returns to the top
    When I open "/#/en/group/2"
    And I navigate to search after scrolling to the footer
    Then search opens at the top of the page

  Scenario Outline: Invalid route parameters do not render unrelated pages
    When I open "/#/en/<path>"
    Then the missing group shows "not found"

    Examples:
      | path             |
      | search/extra     |
      | group/2/extra    |
      | login/extra      |

  @issue-17
  Scenario Outline: Missing group for a visitor
    Given the visitor is "<session>"
    When I open "/#/en/group/999"
    Then the missing group shows "<outcome>"

    Examples:
      | session       | outcome   |
      | anonymous     | login     |
      | authenticated | not found |

  Scenario: Browser back and forward keep the catalog consistent
    When I visit search from home and go back
    Then home and forward navigation still work

  Scenario Outline: Optional native routing modes
    Given "<mode>" routing
    When I open search
    Then search works with "<mode>" URL behavior

    Examples:
      | mode     |
      | history  |
      | abstract |
