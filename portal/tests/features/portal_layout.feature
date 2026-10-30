@browser
Feature: Responsive navigation and footer layout
  Navigation, menus and footer adapt to settings and viewport sizes.

  Background:
    Given a portal with mocked Django APIs

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
    And the login icon uses the linear reference style
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

  Scenario: Mobile navigation has no horizontal overflow
    Given a narrow viewport without the top navbar
    When I open "/#/en/"
    And I expand the menu
    Then the menu and mobile title are visible without overflow

  Scenario: Keyboard skip navigation does not become an application route
    When I open "/#/en/"
    And I activate the skip control with the keyboard
    Then focus moves to content without replacing the home route
