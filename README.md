# BusinessCentral.Agent

A [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that gives AI agents -- such as Claude -- full access to Microsoft Dynamics 365 Business Central through its standard REST API v2.0.

With this server, an AI assistant can query, create, update, and delete Business Central data using natural language. The server translates each request into the appropriate OData v4 call, handles authentication, pagination, rate limiting, and response formatting automatically.

## Features

- **OAuth 2.0 Authorization Code + PKCE** -- Secure, interactive authentication with no client secret required
- **35+ standard entity definitions** with full field metadata (types, descriptions, required/read-only flags)
- **Runtime discovery of custom API pages** via OData `$metadata` parsing
- **OData query building** -- `$filter`, `$select`, `$expand`, `$top`, `$skip`, `$orderby`
- **Context-window-aware smart truncation** -- Automatically adapts response size (full / paginated / summarized)
- **Rate limiting** that respects Business Central operational limits
- **OData `$batch`** support for transactional multi-operation requests
- **Comprehensive error handling** with user-friendly messages

## Prerequisites

- **Node.js 18+**
- **An Azure AD / Entra ID app registration** configured as follows:
  - **Redirect URI:** `http://localhost:3847/callback`
  - **API permissions:** `https://api.businesscentral.dynamics.com/.default`
  - **Public client flows enabled** (required for PKCE -- found under *Authentication > Advanced settings* in the Azure portal)
- **A Business Central environment** with API access enabled (SaaS Production or Sandbox)

## Installation

```bash
git clone https://github.com/hybriden/BusinessCentral.Agent.git
cd BusinessCentral.Agent
npm install
npm run build
```

## Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
BC_TENANT_ID=your-azure-tenant-id
BC_ENVIRONMENT=sandbox
BC_CLIENT_ID=your-azure-app-client-id
BC_REDIRECT_PORT=3847
```

| Variable           | Required | Default | Description                                          |
| ------------------ | -------- | ------- | ---------------------------------------------------- |
| `BC_TENANT_ID`     | Yes      | --      | Azure AD tenant ID (GUID)                            |
| `BC_ENVIRONMENT`   | Yes      | --      | Business Central environment name (e.g. `Production` or `Sandbox`) |
| `BC_CLIENT_ID`     | Yes      | --      | Application (client) ID from Azure app registration  |
| `BC_REDIRECT_PORT` | No       | `3847`  | Local port for the OAuth callback server             |

## Using with Claude Desktop

Add the server to your Claude Desktop configuration. Open or create the file at:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "business-central": {
      "command": "node",
      "args": ["path/to/BusinessCentral.Agent/build/index.js"]
    }
  }
}
```

Replace `path/to/BusinessCentral.Agent` with the actual absolute path to this repository on your machine.

On first use, the server will open a browser window for Azure AD login. After authenticating, the token is cached and refreshed automatically.

## Available Tools

The server exposes tools following a consistent naming convention. For each registered entity, the following tool patterns are generated:

| Tool Pattern               | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `bc_list_{entities}`       | List records with OData filtering, sorting, and pagination |
| `bc_get_{entity}`          | Get a single record by ID                                |
| `bc_create_{entity}`       | Create a new record                                      |
| `bc_update_{entity}`       | Update an existing record by ID                          |
| `bc_delete_{entity}`       | Delete a record by ID                                    |
| `bc_{action}_{entity}`     | Execute a bound action (e.g. post, ship, cancel)         |
| `bc_count_{entities}`      | Count records, optionally with an OData filter           |

### Global Tools

These tools are always available regardless of entity registration:

| Tool                        | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| `bc_list_companies`         | List all companies in the Business Central environment   |
| `bc_select_company`         | Select the active company (required before accessing data) |
| `bc_discover_custom_apis`   | Scan `$metadata` and register custom API pages as new tools |

### Supported Standard Entities

The server ships with built-in definitions for 34 standard Business Central API v2.0 entities:

**Core:**
customers, vendors, items

**Sales:**
salesOrders, salesOrderLines, salesInvoices, salesInvoiceLines, salesQuotes, salesQuoteLines, salesCreditMemos, salesCreditMemoLines

**Purchasing:**
purchaseOrders, purchaseOrderLines, purchaseInvoices, purchaseInvoiceLines

**Finance:**
generalLedgerEntries, journals, journalLines, accounts, dimensions, dimensionValues

**Setup and Reference:**
employees, currencies, paymentTerms, paymentMethods, shipmentMethods, unitsOfMeasure, itemCategories, countriesRegions, companyInformation, taxGroups, contacts, bankAccounts, agedAccountsReceivable, agedAccountsPayable

## Custom API Discovery

Business Central supports custom API pages built with AL extensions. To discover and register them at runtime:

1. Call `bc_discover_custom_apis` -- the server fetches the OData `$metadata` document from your environment.
2. The XML is parsed and any entity types not already in the registry are registered as new entities.
3. Full CRUD tools are generated automatically for each discovered entity, following the same naming conventions as the standard entities.

This means any custom API page published to your Business Central environment is accessible without code changes.

## Smart Data Handling

To prevent large result sets from overwhelming the AI context window, the server applies automatic truncation in three tiers:

| Tier         | Row Count  | Behavior                                                        |
| ------------ | ---------- | --------------------------------------------------------------- |
| **Full**     | 1 -- 50     | All rows returned as-is                                         |
| **Paginated**| 51 -- 500   | First page of results returned with total count and pagination metadata |
| **Summarized**| > 500     | Summary statistics + 20 preview rows + recommendation to add `$filter` |

Long string values within individual records are also truncated to keep responses concise.

## Usage Examples

Once connected, you can ask the AI assistant questions like:

**Listing and filtering:**
> "Show me all customers in Business Central"
> "List sales orders created after 2025-01-01 with amount greater than 10000"
> "How many open purchase orders do we have?"

**Reading details:**
> "Get the details of customer with number C10000"
> "Show me the lines on sales order SO-001234"

**Creating records:**
> "Create a new customer named Contoso Ltd with address in Seattle"
> "Add a line to purchase order PO-005678 for 100 units of item 1000"

**Updating and actions:**
> "Update the unit price on sales order line to 49.99"
> "Post sales invoice INV-002345"

The AI agent handles the mapping from natural language to the correct tool calls, OData filters, and field names.

## Development

### Scripts

```bash
npm run build     # Compile TypeScript to build/
npm run dev       # Watch mode -- recompile on changes
npm test          # Run test suite (vitest)
npm run test:watch # Run tests in watch mode
npm start         # Start the MCP server
```

### Project Structure

```
BusinessCentral.Agent/
  src/
    index.ts                  # Entry point
    server.ts                 # MCP server setup and tool registration
    config.ts                 # Environment variable loading and config
    auth/
      oauth.ts                # OAuth 2.0 Authorization Code + PKCE flow
      pkce.ts                 # PKCE code verifier/challenge generation
      token-store.ts          # Token persistence and refresh
      callback-server.ts      # Local HTTP server for OAuth redirect
    client/
      bc-client.ts            # Business Central REST API client
      odata-query.ts          # OData query string builder
      rate-limiter.ts         # Rate limiting for BC operational limits
      error-handler.ts        # Error parsing and user-friendly messages
      batch.ts                # OData $batch request support
    entities/
      entity-types.ts         # TypeScript types for entity definitions
      registry.ts             # Entity registry (add/lookup/list)
      tool-generator.ts       # Generates MCP tools from entity definitions
      metadata-discovery.ts   # OData $metadata XML parsing
      definitions/            # One file per standard entity (34 files)
    utils/
      truncation.ts           # Smart context-window-aware truncation
      formatting.ts           # Response formatting helpers
  tests/                      # Test suite
  build/                      # Compiled output (generated)
```

## License

This project is licensed under the ISC License. See the `package.json` for details.
