@browser
Feature: Home catalog and portal delivery
  The home page, pictures, API failures and the served application.

  Background:
    Given a portal with mocked Django APIs

  @issue-20
  Scenario: Home catalog and complete archive
    When I open "/#/en/"
    Then the home page shows one featured card and a photo credit
    When I request the complete catalog
    Then the archive contains both catalog entries

  @issue-20
  Scenario Outline: Organizations are listed before independent groups
    Given the home article limit is 9
    When I open "<path>"
    Then the catalog cards are "Municipality, Water maps"

    Examples:
      | path        |
      | /#/en/      |
      | /#/en/group |

  Scenario: Clicking a group loads projects from the group API
    When I open "/#/en/group"
    And I open the featured group
    Then the map and its network services remain available
    And projects were requested from the group API

  Scenario: Remote media URLs work with a local API
    Given the API is local and its media is remote
    When I open "/#/en/"
    Then group images load from the remote media host

  Scenario: Home description remains readable without carousel pictures
    Given the home has no carousel pictures
    When I open "/#/en/"
    Then the home description and footer use readable dark theme colors

  Scenario: Carousel without an author does not show an empty credit badge
    Given the carousel author is unspecified
    When I open "/#/en/"
    Then no empty photo credit badge is drawn

  Scenario Outline: Home article limit
    Given the home article limit is <limit>
    When I open "/#/en/"
    Then there are <cards> home cards and the show-all control is "<show_all>"

    Examples:
      | limit | cards | show_all |
      | 0     | 0     | absent   |
      | -1    | 2     | absent   |
      | 1     | 1     | visible  |
      | 9     | 2     | absent   |
      | 1.5   | 1     | visible  |
      | invalid | 2   | absent   |

  Scenario: An API failure is visible and can be retried
    Given the catalog API is unavailable
    When I open "/#/en/"
    Then the API error is visible instead of a successful empty catalog
    When the catalog API recovers and I retry
    Then the catalog is usable again

  Scenario: Serving the portal requires no npm packages or compilation
    When I open "/#/en/"
    Then the checked-in application is served directly without npm dependencies

  Scenario: Django renders the portal template and its runtime configuration
    When I request the Django portal document
    Then its markup comes from the Django template without unresolved template syntax

  @issue-16
  Scenario: The loading spinner follows the theme primary color
    Given the theme primary color is "rgb(1, 2, 3)"
    And the portal script is unavailable
    When I open "/#/en/"
    Then the loading spinner uses "rgb(1, 2, 3)"

  Scenario: Carousel pictures retain their configured order and credits
    Given two carousel pictures supplied out of order
    When I open "/#/en/"
    Then the pictures rotate after five seconds with matching credits
