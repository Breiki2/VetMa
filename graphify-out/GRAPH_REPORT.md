# Graph Report - VetMa  (2026-10-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 937 nodes · 2264 edges · 50 communities (31 shown, 19 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 263 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c539c97c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- errorMessage
- User
- VaccineReminder
- Attention
- package.json
- app
- main
- ApiWebTestCase
- Doctrine\DBAL\Schema\Schema
- Patient
- require
- SeedDemoCommand.php
- AttentionAttachment
- Client
- session
- Symfony\Component\HttpFoundation\Response
- Vaccine
- healthcheck
- .getId
- App
- services
- CsrfRequestSubscriber.php
- compilerOptions
- composer.json
- mailer
- Kernel
- config
- router
- ActiveUserChecker.php
- validation
- reference.php
- ApiWebTestCase.php
- scripts
- _errors
- symfony
- doctrine_migrations
- framework
- framework
- _security_logout
- require-dev
- framework
- controllers
- vite-env.d.ts
- backup-production.sh
- restore-drill.sh
- test-backup-restore.sh

## God Nodes (most connected - your core abstractions)
1. `User` - 67 edges
2. `Patient` - 64 edges
3. `Client` - 61 edges
4. `Attention` - 58 edges
5. `errorMessage()` - 44 edges
6. `VaccineReminder` - 35 edges
7. `Vaccine` - 33 edges
8. `VaccineApplication` - 33 edges
9. `AttentionRepository` - 31 edges
10. `ApiWebTestCase` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Client` --references--> `User`  [EXTRACTED]
  backend/src/Entity/Client.php → backend/src/Entity/User.php
- `SeedDemoCommand` --references--> `UserRepository`  [EXTRACTED]
  backend/src/Command/SeedDemoCommand.php → backend/src/Repository/UserRepository.php
- `SeedDemoCommand` --references--> `AttentionRegistration`  [EXTRACTED]
  backend/src/Command/SeedDemoCommand.php → backend/src/Attention/AttentionRegistration.php
- `SeedDemoCommand` --references--> `VaccineRepository`  [EXTRACTED]
  backend/src/Command/SeedDemoCommand.php → backend/src/Repository/VaccineRepository.php
- `SendVaccineRemindersCommand` --references--> `VaccineReminderRepository`  [EXTRACTED]
  backend/src/Command/SendVaccineRemindersCommand.php → backend/src/Repository/VaccineReminderRepository.php

## Import Cycles
- None detected.

## Communities (50 total, 19 thin omitted)

### Community 0 - "errorMessage"
Cohesion: 0.05
Nodes (109): AdminUser, api, Attention, AttentionAttachment, Client, ClientAttention, ClientDetails, Patient (+101 more)

### Community 1 - "User"
Cohesion: 0.06
Nodes (15): CreateAdminCommand, AdminUserController, AttentionController, ClientController, {closure#3}(), CurrentUserController, PatientController, PatientHistoryController (+7 more)

### Community 2 - "VaccineReminder"
Cohesion: 0.06
Nodes (9): {closure#2}(), {closure#3}(), VaccineReminderController, VaccineApplication, VaccineReminder, VaccineReminderScheduler, VaccineApplicationRepository, VaccineReminderRepository (+1 more)

### Community 3 - "Attention"
Cohesion: 0.08
Nodes (7): AttentionRegistration, AttentionRegistrationResult, {closure#2}(), {closure#2}(), {closure#4}(), Attention, AttentionAttachmentFlowTest

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (40): dependencies, lucide-react@latest, react@latest, react-dom@latest, typescript@latest, vite@latest, @vitejs/plugin-react@latest, devDependencies (+32 more)

### Community 5 - "app"
Cohesion: 0.06
Nodes (40): build, condition, env_file, environment, expose, healthcheck, restart, volumes (+32 more)

### Community 6 - "main"
Cohesion: 0.06
Nodes (31): path, roles, pattern, security, class, property, dev, main (+23 more)

### Community 7 - "ApiWebTestCase"
Cohesion: 0.08
Nodes (6): ApiWebTestCase, AdminUserControllerTest, ClientPatientFlowTest, LoginFlowTest, PatientHistoryPdfTest, VaccineControllerTest

### Community 8 - "Doctrine\DBAL\Schema\Schema"
Cohesion: 0.13
Nodes (5): Version20261031021236, Version20261031090000, Version20261031091000, Version20261031092000, Version20261031093000

### Community 9 - "Patient"
Cohesion: 0.22
Nodes (3): {closure#1}(), Patient, PatientHistoryPdf

### Community 10 - "require"
Cohesion: 0.08
Nodes (24): require, doctrine/doctrine-bundle, doctrine/doctrine-migrations-bundle, doctrine/orm, ext-ctype, ext-iconv, ext-pdo, php (+16 more)

### Community 12 - "AttentionAttachment"
Cohesion: 0.20
Nodes (3): AttentionAttachmentController, {closure#1}(), AttentionAttachment

### Community 14 - "session"
Cohesion: 0.12
Nodes (17): framework, csrf_protection, router, secret, session, test, trusted_headers, trusted_proxies (+9 more)

### Community 15 - "Symfony\Component\HttpFoundation\Response"
Cohesion: 0.18
Nodes (3): ApiEntryPoint, JsonLoginFailureHandler, JsonLoginSuccessHandler

### Community 17 - "healthcheck"
Cohesion: 0.12
Nodes (15): environment, healthcheck, image, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, retries (+7 more)

### Community 19 - "App"
Cohesion: 0.13
Nodes (14): alias, dir, is_bundle, prefix, type, url, auto_mapping, mappings (+6 more)

### Community 20 - "services"
Cohesion: 0.14
Nodes (14): arguments, arguments, arguments, resource, $attachmentDirectory, $senderAddress, autoconfigure, autowire (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 23 - "composer.json"
Cohesion: 0.18
Nodes (10): autoload, autoload-dev, psr-4, psr-4, license, minimum-stability, prefer-stable, App\\ (+2 more)

### Community 24 - "mailer"
Cohesion: 0.20
Nodes (9): ports, MP_SMTP_AUTH_ACCEPT_ANY, MP_SMTP_AUTH_ALLOW_INSECURE, environment, image, ports, services, database (+1 more)

### Community 26 - "config"
Cohesion: 0.29
Nodes (7): php-http/discovery, symfony/flex, symfony/runtime, config, allow-plugins, sort-packages, vendor-dir

### Community 27 - "router"
Cohesion: 0.33
Nodes (6): framework, router, default_uri, strict_requirements, when@prod, framework

### Community 29 - "validation"
Cohesion: 0.40
Nodes (5): framework, validation, not_compromised_password, when@test, framework

### Community 32 - "scripts"
Cohesion: 0.40
Nodes (5): assets:install %PUBLIC_DIR%, cache:clear, scripts, auto-scripts, test

### Community 33 - "_errors"
Cohesion: 0.40
Nodes (4): prefix, resource, when@dev, _errors

### Community 34 - "symfony"
Cohesion: 0.50
Nodes (4): extra, symfony, allow-contrib, require

### Community 35 - "doctrine_migrations"
Cohesion: 0.50
Nodes (3): doctrine_migrations, migrations_paths, DoctrineMigrations

### Community 36 - "framework"
Cohesion: 0.50
Nodes (3): framework, mailer, dsn

### Community 37 - "framework"
Cohesion: 0.50
Nodes (3): framework, property_info, with_constructor_extractor

### Community 38 - "_security_logout"
Cohesion: 0.50
Nodes (3): _security_logout, resource, type

### Community 39 - "require-dev"
Cohesion: 0.67
Nodes (3): require-dev, phpunit/phpunit, symfony/browser-kit

## Knowledge Gaps
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `VaccineReminder`, `ApiWebTestCase`, `SeedDemoCommand.php`, `Client`, `Symfony\Component\HttpFoundation\Response`, `.getId`, `ActiveUserChecker.php`, `ApiWebTestCase.php`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `errorMessage` be split into smaller, more focused modules?**
  _Cohesion score 0.05004691898654989 - nodes in this community are weakly interconnected._
- **Why does `Attention` connect `Attention` to `User`, `VaccineReminder`, `ApiWebTestCase`, `Patient`, `AttentionAttachment`, `Vaccine`, `.getId`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.06131934032983508 - nodes in this community are weakly interconnected._
- **Why does `Patient` connect `Patient` to `User`, `VaccineReminder`, `Attention`, `ApiWebTestCase`, `SeedDemoCommand.php`, `Client`, `Vaccine`, `.getId`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `VaccineReminder` be split into smaller, more focused modules?**
  _Cohesion score 0.0554954954954955 - nodes in this community are weakly interconnected._
- **Should `Attention` be split into smaller, more focused modules?**
  _Cohesion score 0.08385744234800839 - nodes in this community are weakly interconnected._