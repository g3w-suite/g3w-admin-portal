@backend
Feature: Django portal catalog API and permissions
  Groups, projects, macrogroups, pictures and metadata respect user permissions.

  Background:
    Given the Django portal catalog

  Scenario: Project map and edit URLs refer to the real group and project
    Given a backend "admin" session
    When the backend endpoint "portal-project-api-list" is requested
    Then the first backend project has its expected title and map and edit URLs

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

  Scenario Outline: Projects can be filtered by group
    Given a backend "admin" session
    When projects in "<group>" are requested
    Then the backend responds with status 200
    And the backend returns <count> entries

    Examples:
      | group  | count |
      | Group1 | 2     |
      | Group2 | 0     |

  @issue-22
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

  @issue-22
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

  @issue-15
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

  Scenario Outline: Project thumbnails fall back to the client logo only when unset
    Given a backend "admin" session
    And the first project thumbnail is "<thumbnail>"
    And "<owner>" uses its logo for the client
    When the backend endpoint "portal-project-api-list" is requested
    Then the first project thumbnail is "<expected>"

    @issue-11 @issue-12
    Examples: Own thumbnail
      | thumbnail | owner       | expected        |
      | own.png   | Group1      | own.png         |
      | own.png   | Macrogroup1 | own.png         |

    @issue-1 @issue-2
    Examples: Group logo
      | thumbnail | owner       | expected        |
      | none      | Group1      | group1.png      |

    @issue-1 @issue-2 @issue-6
    Examples: Macrogroup logo
      | thumbnail | owner       | expected        |
      | none      | Macrogroup1 | macrogroup1.png |

    Examples: No logo
      | thumbnail | owner       | expected        |
      | none      | nobody      | placeholder     |

  @issue-3 @issue-4
  Scenario: Visible projects expose their OGC service URLs
    Given a backend "viewer" session
    When the backend endpoint "portal-project-api-list" is requested
    Then the backend returns 1 entries
    And every backend project exposes its WMS service URL

  @issue-7
  Scenario: Macrogroups and groups follow the administration order
    Given a backend "admin" session
    And a QGIS project is added to "Group2"
    When "Macrogroup2" is moved to the top in the administration
    And the backend endpoint "portal-macrogroup-api-list" is requested
    Then the backend titles are "Macrogroup2, Macrogroup1"
    When "Macrogroup1" is moved to the top in the administration
    And the backend endpoint "portal-macrogroup-api-list" is requested
    Then the backend titles are "Macrogroup1, Macrogroup2"
    When "Group2" is moved to the top in the administration
    And the backend endpoint "portal-group-api-list" is requested
    Then the backend titles are "Group2, Group1"
    When "Group1" is moved to the top in the administration
    And the backend endpoint "portal-group-api-list" is requested
    Then the backend titles are "Group1, Group2"

  @issue-8
  Scenario: Trashed projects and groups are hidden from the portal
    Given a backend "admin" session
    When the first project is moved to the trash
    And the backend endpoint "portal-project-api-list" is requested
    Then the backend returns 1 entries
    When "Group1" is moved to the trash
    And the backend endpoint "portal-project-api-list" is requested
    Then the backend returns 0 entries
    When the backend endpoint "portal-group-api-list" is requested
    Then the backend returns 0 entries
    When the backend endpoint "portal-macrogroup-api-list" is requested
    Then the backend returns 0 entries

  @issue-13 @issue-14
  Scenario: Suite metadata advertises configured social login providers
    When the backend endpoint "portal-infodata-api-list" is requested
    Then no social login provider is advertised
    Given a "google" social login application
    When the backend endpoint "portal-infodata-api-list" is requested
    Then the "google" social login URL is advertised
