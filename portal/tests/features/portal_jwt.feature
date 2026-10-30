@browser
Feature: JWT authentication
  Token login, refresh and blacklist against the portal API.

  Background:
    Given a portal with mocked Django APIs

  Scenario: Expired JWT requests share one bounded refresh attempt
    Given stored expired Bearer credentials
    When I open "/#/en/"
    Then one refresh serves all concurrent requests

  Scenario Outline: JWT login, single refresh and blacklist logout
    Given JWT login issues an expired access token
    And the token API base is "<base>"
    When I open "/#/en/login"
    And I submit "correct" credentials
    Then the access token has been refreshed once
    When I log out
    Then the refresh token is blacklisted and stored tokens are removed
    And token requests target "<token_base>"

    Examples:
      | base                                | token_base                |
      | /                                   | /                         |
      | /deployment/                        | /                         |
      | https://api.example.test/deployment/ | https://api.example.test/ |

  Scenario: Failed JWT refresh does not loop or pretend success
    Given revoked JWT credentials
    When I open "/#/en/"
    Then authentication failure is explicit and stored credentials are removed

  Scenario: A late expired response reuses the already renewed access token
    Given expired JWT requests with one delayed response
    When I open "/#/en/"
    Then one refresh serves all concurrent requests
