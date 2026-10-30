@browser
Feature: Cookie authentication and return destinations
  Login, logout and redirects keep the visitor inside the portal.

  Background:
    Given a portal with mocked Django APIs

  Scenario: Cookie login, catalog refresh and logout on the current page
    When I open "/#/en/login"
    And I submit "correct" credentials
    Then I am authenticated and the catalog has been refreshed
    When I log out from search
    Then I stay on search without authenticated controls

  @issue-17
  Scenario Outline: External return destinations are rejected
    When I request the return destination "<destination>" after "<stage>"
    Then the invalid return destination is reported without leaving the portal

    Examples:
      | stage | destination          |
      | login | https://other.test/  |
      | login | //other.test/        |
      | login | /\other.test/        |
      | login | en/                  |
      | login | javascript:alert(1)  |
      | load  | https://other.test/  |
      | load  | //other.test/        |
      | load  | /\other.test/        |
      | load  | en/                  |
      | load  | javascript:alert(1)  |

  Scenario Outline: Internal login ignores the Django logout page
    Given the visitor is "authenticated"
    And internal login advertises the Django logout URL
    When I use internal logout from "<path>"
    Then logout uses the portal API without leaving the application

    Examples:
      | path         |
      | /#/en/search |
      | /#/en/logout |

  @issue-13 @issue-14
  Scenario: Invalid credentials are reported without authenticating
    When I open "/#/en/login"
    And I submit "incorrect" credentials
    Then the login error is visible and recovery links remain available

  Scenario Outline: Custom destinations
    Given a custom "<action>" destination
    When I select "<action>"
    Then I reach the configured "<action>" destination

    Examples:
      | action |
      | login  |
      | logout |
      | admin  |

  @issue-17
  Scenario: Login returns to a previously restricted group
    Given the group is available only after authentication
    When I open "/#/en/group/2"
    Then the missing group shows "login"
    When I submit "correct" credentials
    Then I return to the requested group with refreshed permissions

  Scenario: Cross-origin cookie requests include session credentials
    Given the portal is hosted separately from its API
    When I open "/#/en/"
    Then remote requests carry credentials and map links use the remote host

  Scenario: Failed logout preserves the session and reports the error
    Given an authenticated session and unavailable logout endpoint
    When I open "/#/en/search"
    And I log out
    Then logout failure is visible and authenticated controls remain

  @issue-17
  Scenario: An authenticated return URL restores the requested portal page
    Given the visitor is "authenticated"
    When I open "/?next=%2Fen%2Fgroup%2F2#/en/"
    Then the return page is opened and the consumed next parameter is removed

  Scenario: Successful logout clears private content even if catalog refresh fails
    Given an authenticated session whose public catalog refresh fails
    When I open "/#/en/search"
    Then authenticated map content is visible
    When I log out
    Then private content is cleared and the refresh error is visible
