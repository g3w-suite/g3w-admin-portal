@browser
Feature: Languages and translations
  Language selection keeps the current page and consistent translated content.

  Background:
    Given a portal with mocked Django APIs

  Scenario: Change language while retaining the current page
    When I switch the English search page to Italian
    Then the route, document and search label are Italian

  @issue-17
  Scenario: Language changes preserve the requested login destination
    When I open "/#/en/login?next=%2Fen%2Fgroup%2F2"
    And I choose Italian from the language list
    Then the login destination is retained after changing language

  Scenario: Language list fits a small viewport
    Given a narrow viewport without the top navbar
    And the menu button is disabled
    When I open "/#/en/"
    And I expand the language list
    Then every language is reachable without horizontal overflow
    And compact mobile actions retain accessible names without crowded labels

  Scenario: Additional configured languages use their own names
    Given Polish and Spanish are configured
    When I open "/#/it/search"
    And I expand the language list
    Then additional languages have their own names and flags

  @issue-18
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

  Scenario: The latest language selection wins over a slow earlier response
    Given a slow Italian catalog response
    When Italian is superseded by French before loading finishes
    Then the French document and catalog remain consistent

  @issue-19
  Scenario Outline: Missing locales fall back to the browser, English or the first language
    Given the configured languages are "<languages>"
    When I open "/"
    Then the portal falls back to "<locale>"

    Examples:
      | languages | locale |
      | pt, en    | en     |
      | it, pt    | it     |
      | pt, it    | pt     |
