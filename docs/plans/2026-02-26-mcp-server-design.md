# BusinessCentral.Agent — MCP Server Design

## Overview

A Model Context Protocol (MCP) server that provides AI agents with full access to Microsoft Dynamics 365 Business Central via its standard REST API v2.0. Hybrid architecture: statically-defined standard entities with runtime discovery of custom APIs.

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────┐     ┌──────────────────┐
│  Claude /    │     │   MCP Server (TypeScript/Node)   │     │  Business Central│
│  AI Client   │◄──►│                                  │◄──►│  REST API v2.0   │
│  (stdio)    │     │  ┌──────────┐  ┌──────────────┐  │     │                  │
│             │     │  │ Auth     │  │ Entity       │  │     │  Azure AD/Entra  │
│             │     │  │ (PKCE)   │  │ Registry     │  │     │                  │
│             │     │  ├──────────┤  ├──────────────┤  │     └──────────────────┘
│             │     │  │ BC Client│  │ Tool         │  │
│             │     │  │ (OData)  │  │ Generator    │  │
│             │     │  ├──────────┤  ├──────────────┤  │
│             │     │  │ Rate     │  │ Smart        │  │
│             │     │  │ Limiter  │  │ Truncation   │  │
│             │     │  └──────────┘  └──────────────┘  │
│             │     └──────────────────────────────────┘
└─────────────┘
```

## Authentication

- OAuth 2.0 Authorization Code flow with PKCE
- Local callback server on port 3847
- Token persistence in `~/.bc-agent/tokens.json`
- Automatic refresh 5 minutes before expiry
- Scopes: `https://api.businesscentral.dynamics.com/.default offline_access`

## Entity System (Hybrid)

### Static Definitions (~30 standard entities)

Each entity defined with:
- Full TypeScript types for all fields
- Field metadata (type, readOnly, required, description)
- Navigation properties (related entities for $expand)
- Bound actions (post, ship, cancel, etc.)
- AI-optimized descriptions

Standard entities: customers, vendors, items, salesOrders, salesOrderLines, salesInvoices, salesInvoiceLines, salesQuotes, salesQuoteLines, salesCreditMemos, salesCreditMemoLines, purchaseOrders, purchaseOrderLines, purchaseInvoices, purchaseInvoiceLines, generalLedgerEntries, journals, journalLines, accounts, dimensions, dimensionValues, employees, currencies, paymentTerms, paymentMethods, shipmentMethods, unitsOfMeasure, itemCategories, countriesRegions, companyInformation, taxGroups, customerPaymentJournals, contacts, bankAccounts, agedAccountsReceivable, agedAccountsPayable

### Runtime Discovery

- Parse OData $metadata (EDMX XML) for custom API pages
- Auto-register discovered entities with generic tool descriptions
- Cached for session lifetime

## Tool Generation

Per entity:
| Tool Pattern | Description |
|---|---|
| `bc_list_{entity}` | List with $filter, $top, $skip, $expand, $select, $orderby |
| `bc_get_{entity}` | Get single by ID |
| `bc_create_{entity}` | Create new record (with deep insert support) |
| `bc_update_{entity}` | Update existing record (PATCH with If-Match) |
| `bc_delete_{entity}` | Delete record |
| `bc_{action}_{entity}` | Bound actions (post, ship, cancel, etc.) |
| `bc_count_{entity}` | Count with $filter |
| `bc_summarize_{entity}` | Aggregation/summary for large datasets |

Global tools:
- `bc_list_companies` — List available companies
- `bc_select_company` — Set active company
- `bc_search` — Cross-entity search
- `bc_discover_custom_apis` — Find and register custom API pages
- `bc_batch` — Execute multiple operations in one transaction

## Smart Data Handling

Context-window-aware response sizing:
- ≤50 rows: Return all data directly
- 51-500 rows: Return page 1 (50 rows) + pagination metadata
- >500 rows: Return summary/aggregation + first 20 rows + filter recommendation

Additional strategies:
- Smart field selection (omit irrelevant fields)
- Automatic text truncation (long descriptions capped at 200 chars)
- OData $select to minimize payload from BC

## Rate Limiting

Respecting BC operational limits:
- 6000 requests per 5-minute sliding window (per user)
- 5 concurrent requests max
- 20,000 entities max per response
- 8 minute timeout per request
- 100 operations per $batch

Strategy: Exponential backoff with jitter on 429, respect Retry-After header, max 5 retries.

## Error Handling

BC error responses mapped to clear, actionable messages:
- Validation errors → specific field/value guidance
- 404 → entity/ID not found with suggestions
- 409 → concurrency conflict, suggest re-fetch
- 429 → rate limited, auto-retry with backoff
- 504 → timeout, suggest smaller query

## Testing

- Unit tests for all modules (vitest)
- Integration tests with BC API fixtures
- Test fixtures for entity responses and $metadata
