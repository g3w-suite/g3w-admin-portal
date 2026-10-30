@browser
Feature: Project cards, services and credits
  Project details, network services and dialogs.

  Background:
    Given a portal with mocked Django APIs

  Scenario: Project image and description share the same desktop row
    When I open "/#/en/group/2"
    Then project details sit beside the image with illustrated actions

  Scenario: Project details fit a phone screen
    Given a narrow viewport without the top navbar
    When I open "/#/en/group/2"
    Then project details follow the image without horizontal overflow

  @issue-3 @issue-4
  Scenario: Group services use the displayed project and remote asset origin
    Given the group project has its own network service
    And the API is local and its OGC services are remote
    When I open "/#/en/group/2"
    And I open the project services
    Then the displayed project service is in the dialog without a documentation link
    And the dialog locks scrolling until closed with Escape

  Scenario: Credits retain the original presentation and contacts
    When I open "/#/en/"
    And I open credits
    Then credits show their branded header, logos and contact details
    And the dialog locks scrolling until closed with Escape

  Scenario: Authenticated map editing and accessible credits
    Given the visitor is "authenticated"
    When I open "/#/en/group/2"
    Then the authorized map edit link remains available
    When I open credits
    Then the native credits dialog can be closed with its button
