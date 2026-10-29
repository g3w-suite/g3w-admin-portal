@browser
Feature: Native portal behavior without a JavaScript test runner
  The portal retains its existing browser behavior.
  Behave executes the specifications; Playwright Python only drives browsers.

  Background:
    Given a portal with mocked Django APIs

  Scenario: Home catalog and complete archive
    When I open "/#/en/"
    Then the home page shows one featured card and a photo credit
    When I request the complete catalog
    Then the archive contains both catalog entries

  Scenario: Clicking a group loads projects from the group API
    When I open "/#/en/"
    And I open the featured group
    Then the map and its network services remain available
    And projects were requested from the group API

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

  Scenario: Remote media URLs work with a local API
    Given the API is local and its media is remote
    When I open "/#/en/"
    Then group images load from the remote media host

  Scenario: Default navigation colors and catalog card layout
    When I open "/#/en/"
    Then the default navigation colors and card layout are applied

  Scenario: Compact navigation respects disabled menu settings
    Given the top navbar and menu button are disabled
    When I open "/#/en/"
    Then navigation stays compact without a secondary menu

  Scenario: Desktop navigation matches the reference at tablet width
    Given the top navbar and menu button are disabled
    When I open "/#/en/"
    Then the desktop navbar hides the title at the reference breakpoint
    And the login icon uses the filled reference style
    And language flags retain their original proportions
    And the home breadcrumb does not repeat the current page label

  Scenario: Footer policies use a full-width contrasting bar
    Given the footer contains policy and social links
    When I open "/#/en/"
    Then the footer policy bar spans the viewport with contrasting links
    And social links use accessible icons instead of text labels

  Scenario: Tablet footer retains three columns before stacking on phones
    Given a tablet viewport
    When I open "/#/en/"
    Then footer contacts occupy the third column

  Scenario: Home description remains readable without carousel pictures
    Given the home has no carousel pictures
    When I open "/#/en/"
    Then the home description and footer use readable dark theme colors

  Scenario: Navigate organization, group, map and services
    When I open an organization and its group
    Then the map and its network services remain available

  Scenario: Search title and description without case sensitivity
    When I search for "HYDROLOGY"
    Then only Rivers is shown and title searching and clearing still work

  Scenario: Change language while retaining the current page
    When I switch the English search page to Italian
    Then the route, document and search label are Italian

  Scenario: Cookie login, catalog refresh and logout on the current page
    When I open "/#/en/login"
    And I submit "correct" credentials
    Then I am authenticated and the catalog has been refreshed
    When I log out from search
    Then I stay on search without authenticated controls

  Scenario Outline: Internal login ignores the Django logout page
    Given the visitor is "authenticated"
    And internal login advertises the Django logout URL
    When I open "<path>"
    And I use internal logout
    Then logout uses the portal API without leaving the application

    Examples:
      | path         |
      | /#/en/search |
      | /#/en/logout |

  Scenario: Breadcrumbs retain the organization and group hierarchy
    When I open an organization and its group
    Then breadcrumbs link to every parent without duplicate separators
    When I return to the organization using breadcrumbs
    Then the organization catalog and its breadcrumb are restored

  Scenario: A group inside an organization can be opened directly
    When I open "/#/en/group/3"
    Then the map and its network services remain available
    And the current breadcrumb is "City maps"

  Scenario: Project image and description share the same desktop row
    When I open "/#/en/group/2"
    Then project details sit beside the image with illustrated actions

  Scenario: Project details fit a phone screen
    Given a narrow viewport without the top navbar
    When I open "/#/en/group/2"
    Then project details follow the image without horizontal overflow

  Scenario: Group services use the displayed project and remote asset origin
    Given the group project has its own network service
    And the API is local and its OGC services are remote
    When I open "/#/en/group/2"
    And I open the project services
    Then the displayed project service and documentation are in the dialog
    And the dialog locks scrolling until closed with Escape

  Scenario: Language changes preserve the requested login destination
    When I open "/#/en/login?next=%2Fen%2Fgroup%2F2"
    And I choose Italian from the language list
    Then the login destination is retained after changing language

  Scenario: Navigation from the footer returns to the top
    When I open "/#/en/group/2"
    And I navigate to search after scrolling to the footer
    Then search opens at the top of the page

  Scenario: Mobile menu contains search and authentication controls
    Given a narrow viewport without the top navbar
    When I open "/#/en/"
    Then mobile navigation shows a menu button instead of crowded actions
    When I expand the menu
    Then search and login are available inside the expanded menu

  Scenario: Authenticated mobile menu provides administration and logout
    Given a narrow viewport without the top navbar
    And the visitor is "authenticated"
    When I open "/#/en/search"
    And I expand the menu
    Then administration and logout are usable in the mobile menu

  Scenario: Language list fits a small viewport
    Given a narrow viewport without the top navbar
    And the menu button is disabled
    When I open "/#/en/"
    And I expand the language list
    Then every language is reachable without horizontal overflow
    And compact mobile actions retain accessible names without crowded labels

  Scenario: Additional configured languages have readable names
    Given Polish and Spanish are configured
    When I open "/#/en/search"
    And I expand the language list
    Then additional languages have their own names and flags

  Scenario: Carousel without an author does not show an empty credit badge
    Given the carousel author is unspecified
    When I open "/#/en/"
    Then no empty photo credit badge is drawn

  Scenario: Credits retain the original presentation and contacts
    When I open "/#/en/"
    And I open credits
    Then credits show their branded header, logos and contact details
    And the dialog locks scrolling until closed with Escape

  Scenario Outline: Invalid route parameters do not render unrelated pages
    When I open "/#/en/<path>"
    Then the missing group shows "not found"

    Examples:
      | path             |
      | search/extra     |
      | group/2/extra    |
      | login/extra      |

  Scenario: Invalid credentials are reported without authenticating
    When I open "/#/en/login"
    And I submit "incorrect" credentials
    Then the login error is visible and recovery links remain available

  Scenario Outline: Missing group for a visitor
    Given the visitor is "<session>"
    When I open "/#/en/group/999"
    Then the missing group shows "<outcome>"

    Examples:
      | session       | outcome   |
      | anonymous     | login     |
      | authenticated | not found |

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

  Scenario Outline: Existing translations work without compilation
    When I open "/#/<locale>/search"
    Then the catalog and search label use "<locale>"

    Examples:
      | locale |
      | bg     |
      | de     |
      | fi     |
      | fr     |
      | it     |
      | pt     |
      | ro     |
      | se     |

  Scenario Outline: Custom destinations
    Given a custom "<action>" destination
    When I select "<action>"
    Then I reach the configured "<action>" destination

    Examples:
      | action |
      | login  |
      | logout |
      | admin  |

  Scenario: An API failure is visible and can be retried
    Given the catalog API is unavailable
    When I open "/#/en/"
    Then the API error is visible instead of a successful empty catalog
    When the catalog API recovers and I retry
    Then the catalog is usable again

  Scenario: JWT login, single refresh and blacklist logout
    Given JWT login issues an expired access token
    When I open "/#/en/login"
    And I submit "correct" credentials
    Then the access token has been refreshed once
    When I log out
    Then the refresh token is blacklisted and stored tokens are removed

  Scenario: Expired JWT requests share one bounded refresh attempt
    Given stored expired Bearer credentials
    When I open "/#/en/"
    Then one refresh serves all concurrent requests

  Scenario: Failed JWT refresh does not loop or pretend success
    Given revoked JWT credentials
    When I open "/#/en/"
    Then authentication failure is explicit and stored credentials are removed

  Scenario: Authenticated map editing and accessible credits
    Given the visitor is "authenticated"
    When I open "/#/en/group/2"
    Then the authorized map edit link remains available
    When I open credits
    Then the native credits dialog can be closed with its button

  Scenario: Browser back and forward keep the catalog consistent
    When I visit search from home and go back
    Then home and forward navigation still work

  Scenario: Mobile navigation has no horizontal overflow
    Given a narrow viewport without the top navbar
    When I open "/#/en/"
    And I expand the menu
    Then the menu and mobile title are visible without overflow

  Scenario: Serving the portal requires no npm packages or compilation
    When I open "/#/en/"
    Then the checked-in application is served directly without npm dependencies

  Scenario: Django renders the portal template and its runtime configuration
    When I request the Django portal document
    Then its markup comes from the Django template without unresolved template syntax

  Scenario: Login returns to a previously restricted group
    Given the group is available only after authentication
    When I open "/#/en/group/2"
    Then the missing group shows "login"
    When I submit "correct" credentials
    Then I return to the requested group with refreshed permissions

  Scenario: The latest language selection wins over a slow earlier response
    Given a slow Italian catalog response
    When Italian is superseded by French before loading finishes
    Then the French document and catalog remain consistent

  Scenario: A late expired response reuses the already renewed access token
    Given expired JWT requests with one delayed response
    When I open "/#/en/"
    Then one refresh serves all concurrent requests

  Scenario: Cross-origin cookie requests include session credentials
    Given the portal is hosted separately from its API
    When I open "/#/en/"
    Then remote requests carry credentials and map links use the remote host

  Scenario Outline: Optional native routing modes
    Given "<mode>" routing
    When I open search
    Then search works with "<mode>" URL behavior

    Examples:
      | mode     |
      | history  |
      | abstract |

  Scenario: Keyboard skip navigation does not become an application route
    When I open "/#/en/"
    And I activate the skip control with the keyboard
    Then focus moves to content without replacing the home route

  Scenario: Carousel pictures retain their configured order and credits
    Given two carousel pictures supplied out of order
    When I open "/#/en/"
    Then the pictures rotate after five seconds with matching credits

  Scenario: Failed logout preserves the session and reports the error
    Given an authenticated session and unavailable logout endpoint
    When I open "/#/en/search"
    And I log out
    Then logout failure is visible and authenticated controls remain

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
