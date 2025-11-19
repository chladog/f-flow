<!--
This file is targeted to AI coding agents (GitHub Copilot, etc.) working on the repository.
It contains high-value, repo-specific guidance for making safe and stylistically consistent changes.
Keep concise and actionable; reference concrete files and commands that are important for contributors.
-->

# Foblex Flow — Copilot / AI Agent Instructions

Summary: Foblex Flow is an Angular-based library + portal app with SSR, E2E examples, and schematics.
Read this before making changes that modify public APIs, build steps, or release flow.

- Top-level structure:
  - `src/` — Angular host app (f-flow-portal) used for docs and examples (SSR enabled).
  - `server/` & `server.ts` — Express-based SSR host and small API routes/middleware.
  - `projects/f-flow/` — The library core: components (f-flow, f-node, f-connection etc.), domain logic, and schematics.
  - `projects/*-examples/` — Example apps and docs demonstrating patterns (use these for integration examples).
  - `cypress/` — E2E test suites and support helpers.

- Quick commands (use exact scripts):
  - Dev server (portal): `npm run start` (ng serve, default config)
  - Serve on all interfaces (dev): `npm run start-shared` (host 0.0.0.0)
  - Build library: `npm run build` (builds projects in angular.json)
  - Build & prepare library for publish: `npm run build-flow` (compiles schematics and copies files into dist)
  - Publish dist package: `npm run publish` (runs `build-flow` and `npm publish` from `dist/f-flow`)
  - Run unit tests: `npm test` (tests are configured with Karma/Jasmine; CI runs `--browsers=ChromeHeadless`)
  - Run cypress E2E tests: `npm run cypress:run`
  - Lint: `npm run lint`

- Build / CI notes:
  - CI uses Node 20 (check `.github/workflows/tests-ci.yml`).
  - Unit tests run with Karma (Angular CLI). CI uses ChromeHeadless in non-watch mode.
  - Release flow uses `standard-version` (`npm run release`) and strict `commitlint` rules
    — commit messages must use types like `feat`, `fix`, `docs`, `test`, `ci`, `chore`, or `revert`.
  - When publishing schematics: `projects/f-flow/schematics` must be compiled and copied to `dist/f-flow`.

- Architecture & patterns to follow:
  - The `f-*` namespace is used for library components, directives and attributes (e.g., `f-flow`, `f-node`).
  - Components are often `standalone` with `providers` arrays. Patterns use grouped `*_PROVIDERS` constants (e.g. `F_NODE_PROVIDERS`).
  - The `FMediator` request/execute pattern is the canonical way to interact with domain logic. Create Request/Execution classes in `projects/f-flow/src/domain`.
  - Stateful UI items use `input`, `output`, `model`, and `ChangeDetectionStrategy.OnPush` (Angular standalone style).
  - Domain code is under `projects/f-flow/src/domain/` and is mostly pure logic with test coverage.
  - Public API surface is defined in `projects/f-flow/src/public-api.ts`. If you add a new public directive/component, export it from `public-api.ts`.
  - Add new providers to corresponding `..._PROVIDERS` arrays and, when necessary, add to `f-flow.module.ts` if the component should be available as part of the module.

- Tests & Examples:
  - Unit tests: `projects/f-flow/*` uses Jasmine / Karma. Add a spec alongside the code (filename `*.spec.ts`); tests import `TestBed` from Angular.
  - E2E and Component tests use Cypress (`cypress.config.ts`). Ensure dev server is run when using the E2E runner during local testing if required.
  - Examples live in `projects/f-examples` and `projects/f-guides-examples`. Use these as integration tests and doc carriers.

- SSR specific notes:
  - The portal app (`f-flow-portal`) uses Angular SSR. The server entry is `server.ts` and `src/main.server.ts`.
  - Server code uses `CommonEngine` from `@angular/ssr` to render server responses; guard client-side logic using `BrowserService.isBrowser()`.

- Conventions & Best practices (project-specific):
  - Always export public components from `public-api.ts` and bump the package via `npm run release` if adding/removing public APIs.
  - When adding new files that are part of schematics or ng-add: update `projects/f-flow/schematics` and ensure `build-flow` copies the schematics JSON.
  - Follow component naming and attribute prefixes — importable selectors start with `f-` and provider constants are in uppercase `F_*_PROVIDERS`.
  - Prefer `FMediator`-based requests for cross-component and domain interactions — avoid directly mutating shared stores.
  - Use `...PROVIDERS` arrays for grouped provider registration and reuse across standalone components/providers.
  - When making public API changes, update `projects/f-flow/README.md` with usage examples and examples in `projects/f-guides-examples`.
  - Tests should not assume browser-only code when run under SSR or CI — guard logic using `BrowserService.isBrowser()` in runtime-critical places.

- Common PR checks for AI agents / reviewers:
  - Run `npm test` (Karma), `npm run lint`, and `npm run build-flow` locally for feature branches.
  - If you update schematics, run `npm run build-flow` and validate `dist/f-flow/schematics` contains json files.
  - For UI changes, add or update examples under `projects/f-examples` to demonstrate the new feature.
  - Maintain unit/e2e tests and update Cypress tests in `cypress/e2e` if behavior changes.

- Where to look for examples and quick reference:
  - Public API: `projects/f-flow/src/public-api.ts`.
  - Main portal SSR: `server.ts`, `server/` and `src/main.server.ts`.
  - Core components & patterns: `projects/f-flow/src/f-flow/f-flow.component.ts`, `f-node`, `f-connection`, `f-canvas`.
  - Domain & request pattern: `projects/f-flow/src/domain`.
  - Schematics: `projects/f-flow/schematics/ng-add` and `ng-update`.
  - Tests: `projects/f-flow/src/**/*.spec.ts`, `cypress/e2e/*`.

If a task is unclear, ask for the intended consumer changes (new public API vs internal refactor). Add tests, update examples, and prefer minimal changes to shared providers/exports.

-- End of instructions --
