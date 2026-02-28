# CLAUDE.md — BusinessCentral.Agent

## Project Overview

MCP (Model Context Protocol) server that gives AI agents access to Microsoft Dynamics 365 Business Central via its standard REST API v2.0. TypeScript/Node, ESM modules, stdio transport.

## Commands

```bash
npm run build       # TypeScript compilation → build/
npm test            # Run all tests (vitest)
npm run test:watch  # Tests in watch mode
npm start           # Start MCP server on stdio
npm run dev         # TypeScript watch mode
```

Run a single test file:
```bash
npx vitest run tests/unit/client/bc-client.test.ts
```

## Architecture

```
src/
  index.ts                    # Entry point — calls createServer()
  server.ts                   # MCP server wiring, tool registration, handler dispatch
  config.ts                   # Env var loading → BcConfig

  auth/                       # OAuth 2.0 Authorization Code + PKCE
    oauth.ts                  # OAuthClient: authenticate(), getAccessToken(), refresh
    pkce.ts                   # Code verifier/challenge generation (SHA-256)
    token-store.ts            # Token persistence to ~/.bc-agent/tokens.json
    callback-server.ts        # Local HTTP callback server (port 3847)

  client/                     # Business Central HTTP layer
    bc-client.ts              # BcClient: list/get/create/update/delete/action/count
    odata-query.ts            # Chainable OData query builder ($filter, $select, etc.)
    rate-limiter.ts           # Concurrent + sliding window rate limiting
    error-handler.ts          # BcError class, parseBcError() with user messages
    batch.ts                  # OData $batch build/parse for transactional ops

  entities/                   # Entity system (hybrid: static + runtime discovery)
    entity-types.ts           # Core interfaces: EntityDefinition, FieldDefinition, etc.
    registry.ts               # EntityRegistry: register/get/list entities
    tool-generator.ts         # Generates MCP tools (list/get/create/update/delete/count/action) per entity
    metadata-discovery.ts     # EDMX XML parser for custom API discovery
    definitions/              # 34 static entity files + index.ts barrel export

  utils/
    truncation.ts             # Smart truncation: full (≤50), paginated (51-500), summarized (>500)
    formatting.ts             # formatToolResponse(), formatListResponse() as markdown tables
```

## Key Conventions

- **ESM modules** — All imports use `.js` extensions (`import { foo } from "./bar.js"`)
- **TypeScript strict mode** — target ES2022, module Node16
- **vitest** — No globals (explicit `import { describe, it, expect, vi } from "vitest"`)
- **No client secrets** — OAuth uses PKCE (public client flow)
- **zod v3** — Input schema validation for MCP tools
- **fast-xml-parser** — EDMX $metadata parsing

## Testing

- Unit tests in `tests/unit/` mirror `src/` structure
- Integration tests in `tests/integration/`
- Mock `globalThis.fetch` for HTTP-level isolation — never call real BC APIs in tests
- Mock auth client: `{ getAccessToken: () => Promise.resolve("token"), authenticate: () => Promise.resolve() }`
- 113 tests across 14 test files

## Entity Definitions

Each entity in `src/entities/definitions/` exports an `EntityDefinition` with:
- `name` / `pluralName` / `apiPath` / `description`
- `fields[]` — each with type, readOnly, required, description
- `navigationProperties[]` — for $expand
- `boundActions[]` — POST actions like post, ship, cancel
- `isReadOnly` — read-only entities get no create/update/delete tools
- `parentEntity` — for line entities (e.g. salesOrderLines under salesOrders)

All definitions re-exported from `src/entities/definitions/index.ts` as `allStandardEntities`.

## Tool Naming

- `bc_list_{pluralName}` — List with OData params
- `bc_get_{name}` — Get by ID
- `bc_create_{name}` / `bc_update_{name}` / `bc_delete_{name}` — CRUD
- `bc_count_{pluralName}` — Count with optional filter
- `bc_{actionName}_{name}` — Bound actions
- Global: `bc_list_companies`, `bc_select_company`, `bc_discover_custom_apis`

## BC API Limits

- 6000 requests per 5-minute sliding window (per user)
- 5 concurrent requests max
- 20,000 entities max per response
- 8 minute timeout per request
- 100 operations per $batch

## Error Handling

`parseBcError(statusCode, body)` maps HTTP status to user-friendly messages:
- 400 → validation error with details
- 404 → not found with suggestions
- 409 → concurrency conflict, re-fetch advice
- 429 → rate limited, auto-retry with exponential backoff + jitter
- 504 → timeout, suggest smaller query
