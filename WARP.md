# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: Laravel 12 (PHP 8.2+), Inertia.js, React 19, Vite 6, Tailwind CSS 4.
- Key backend packages: spatie/laravel-permission, spatie/laravel-medialibrary, spatie/laravel-activitylog, spatie/laravel-backup, inertiajs/inertia-laravel, tightenco/ziggy.
- Frontend entrypoints (vite.config.js): resources/css/app.css and resources/js/app.tsx; SSR entry at resources/js/ssr.jsx.
- Routing and modules (routes/*.php):
  - Authenticated group with custom menu.permission middleware. Core resources include roles, permissions, users, menus, media, files, and audit logs.
  - Domain modules include institutes, building/room types, rooms, assets (categories, assets, institute-assets, transactions), transport (vehicel types, transports), and plants.
  - Settings area (routes/settings.php): profile, password, and appearance pages; web root renders welcome and dashboard via Inertia.
- Testing (phpunit.xml): in-memory sqlite is configured (DB_CONNECTION=sqlite, DB_DATABASE=:memory:), so test runs don’t require a running database service.

Setup
1) Install dependencies
- Backend: composer install
- Frontend: npm install

2) Environment
- Copy .env.example to .env if needed, then generate a key: php artisan key:generate

3) Database
- Run initial migrations: php artisan migrate

Local development
- One-command dev (recommended): composer run dev
  - Starts: php artisan serve, queue:listen, pail (Laravel log viewer), and npm run dev (Vite) concurrently.

- Run services manually (alternative):
  - PHP server: php artisan serve
  - Vite dev server: npm run dev
  - Queue worker: php artisan queue:listen --tries=1
  - Log console: php artisan pail --timeout=0

Builds and assets
- Client build: npm run build
- Client + SSR build: npm run build:ssr (generates both client and SSR bundles)

Testing
- Full test suite: php artisan test
- Single file: php artisan test tests/Feature/SomeTest.php
- Filter by test class or method: php artisan test --filter TestClassName

Linting and formatting
- PHP (Laravel Pint):
  - Fix: ./vendor/bin/pint
  - Check only: ./vendor/bin/pint --test
- JS/TS:
  - Lint: npm run lint (ESLint)
  - Format: npm run format (Prettier)
  - Format check: npm run format:check

Architecture highlights for agents
- Inertia + React UI: Backend controllers typically return Inertia::render(...) with component names; React pages live under resources/js.
- Permissions: menu.permission middleware gates many routes; expect policy/ability checks or menu-based permission logic around navigation and actions.
- Media and files: spatie/laravel-medialibrary and custom UserFile routes are present; prefer storage APIs and media library for uploads and associations.
- Backups and audit logs: surfaced via /backup and /audit-logs routes; operational actions (run, download, delete) are HTTP endpoints.
- SSR: Vite config includes an SSR entry; when shipping SSR, use the build:ssr script to emit both client and server bundles.

Notes for Warp
- No WARP.md, README.md, or tool-specific rules (Claude/Cursor/Copilot) were found in the repo at the time of writing.
- Tests run against an in-memory sqlite database; avoid starting external DBs for unit/feature tests unless a test explicitly requires it.
