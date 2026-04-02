## ADDED Requirements

### Requirement: Storybook Environment
The system SHALL provide a Storybook 8 development environment for `@hongyishi/ui` components that runs independently of application code.

#### Scenario: Storybook starts successfully
- **WHEN** developer runs `pnpm --filter @hongyishi/ui storybook`
- **THEN** Storybook server starts on port 6006
- **AND** all component stories are available in the sidebar

#### Scenario: Storybook builds static site
- **WHEN** developer runs `pnpm --filter @hongyishi/ui build-storybook`
- **THEN** a static site is generated in `packages/ui/storybook-static/`
- **AND** the site can be served by any static file server

### Requirement: Component Stories Coverage
The system SHALL provide stories for all exported components in `@hongyishi/ui`.

#### Scenario: Button component stories
- **WHEN** developer opens Button stories in Storybook
- **THEN** stories for all variants (default, destructive, outline, secondary, ghost, link, success, warning, error) are shown
- **AND** stories for all sizes (default, sm, lg, icon) are shown
- **AND** stories for loading and disabled states are shown

#### Scenario: Card component stories
- **WHEN** developer opens Card stories in Storybook
- **THEN** stories for CardHeader, CardContent, CardFooter are shown
- **AND** stories demonstrate composition patterns

#### Scenario: Form component stories
- **WHEN** developer opens Form stories in Storybook
- **THEN** Input stories demonstrate all states (default, disabled, error, with label, with description)
- **AND** Select stories demonstrate open/close and disabled states
- **AND** Form stories demonstrate react-hook-form integration

#### Scenario: Layout component stories
- **WHEN** developer opens Layout stories in Storybook
- **THEN** Container stories demonstrate different maxWidth presets
- **AND** Stack stories demonstrate direction and gap props

### Requirement: Visual Regression Testing
The system SHALL detect visual changes in components via Chromatic automated testing.

#### Scenario: Chromatic detects component changes
- **WHEN** a PR introduces visual changes to a component
- **THEN** Chromatic captures screenshots of all affected stories
- **AND** a UI review link is posted to the PR
- **AND** the CI check fails if changes are not approved

### Requirement: Storybook Theming
The Storybook SHALL be configured with a theme matching the project's design language.

#### Scenario: Custom theme applied
- **WHEN** Storybook starts
- **THEN** the UI uses a theme with brand colors matching the project
- **AND** the sidebar and toolbar reflect the project's visual identity
