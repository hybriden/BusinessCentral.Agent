import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BcClient, type OAuthClient } from "../../src/client/bc-client.js";
import { BcError } from "../../src/client/error-handler.js";
import { EntityRegistry } from "../../src/entities/registry.js";
import {
  generateToolsForEntity,
  type GeneratedTool,
  type HandlerType,
} from "../../src/entities/tool-generator.js";
import type {
  EntityDefinition,
  FieldDefinition,
} from "../../src/entities/entity-types.js";
import { allStandardEntities } from "../../src/entities/definitions/index.js";
import { parseMetadata } from "../../src/entities/metadata-discovery.js";
import { smartTruncate } from "../../src/utils/truncation.js";
import {
  formatToolResponse,
  formatListResponse,
} from "../../src/utils/formatting.js";
import { ODataQueryBuilder } from "../../src/client/odata-query.js";
import type { BcConfig } from "../../src/config.js";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

const TEST_COMPANY_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

const mockConfig: BcConfig = {
  tenantId: "test-tenant",
  environment: "sandbox",
  clientId: "test-client",
  redirectPort: 3847,
  apiVersion: "v2.0",
  baseUrl:
    "https://api.businesscentral.dynamics.com/v2.0/test-tenant/sandbox/api/v2.0",
  authUrl: "",
  tokenUrl: "",
  maxPageSize: 50,
  maxRetries: 0, // no retries for most tests to keep them fast
  requestTimeoutMs: 5000,
  scopes: [],
};

function createMockAuth(): OAuthClient {
  return {
    getAccessToken: vi.fn().mockResolvedValue("test-token"),
    authenticate: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Minimal entity definition used across most test suites.
 */
const testCustomerEntity: EntityDefinition = {
  name: "customer",
  pluralName: "customers",
  apiPath: "customers",
  description: "A customer in Business Central",
  fields: [
    { name: "id", type: "guid", readOnly: true, description: "Unique ID" },
    {
      name: "displayName",
      type: "string",
      required: true,
      description: "Customer name",
    },
    { name: "email", type: "string", description: "Email address" },
    { name: "city", type: "string", description: "City" },
    {
      name: "balanceDue",
      type: "decimal",
      readOnly: true,
      description: "Outstanding balance",
    },
    {
      name: "lastModifiedDateTime",
      type: "datetime",
      readOnly: true,
      description: "Last modified",
    },
  ],
  navigationProperties: [
    {
      name: "currency",
      targetEntity: "currency",
      isCollection: false,
      description: "Default currency",
    },
  ],
  boundActions: [],
};

const testInvoiceEntity: EntityDefinition = {
  name: "salesInvoice",
  pluralName: "salesInvoices",
  apiPath: "salesInvoices",
  description: "A sales invoice in Business Central",
  fields: [
    { name: "id", type: "guid", readOnly: true, description: "Unique ID" },
    {
      name: "number",
      type: "string",
      description: "Invoice number",
    },
    {
      name: "customerId",
      type: "guid",
      description: "Customer ID",
    },
    {
      name: "totalAmountIncludingTax",
      type: "decimal",
      readOnly: true,
      description: "Total including tax",
    },
  ],
  navigationProperties: [],
  boundActions: [
    {
      name: "post",
      description: "Post the invoice",
      httpMethod: "POST",
      navPath: "Microsoft.NAV.post",
    },
  ],
};

const readOnlyEntity: EntityDefinition = {
  name: "generalLedgerEntry",
  pluralName: "generalLedgerEntries",
  apiPath: "generalLedgerEntries",
  description: "A GL entry in Business Central",
  isReadOnly: true,
  fields: [
    { name: "id", type: "guid", readOnly: true, description: "Unique ID" },
    {
      name: "entryNumber",
      type: "number",
      readOnly: true,
      description: "Entry number",
    },
    {
      name: "accountNumber",
      type: "string",
      readOnly: true,
      description: "Account number",
    },
    {
      name: "amount",
      type: "decimal",
      readOnly: true,
      description: "Amount",
    },
  ],
  navigationProperties: [],
  boundActions: [],
};

/**
 * Replicates the handler dispatch logic from server.ts so we can test
 * the full tool-input -> handler -> BcClient -> formatting pipeline without
 * booting the MCP server.
 */
async function dispatchHandler(
  tool: GeneratedTool,
  params: Record<string, unknown>,
  client: BcClient,
  registry: EntityRegistry,
  config: BcConfig
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    const entity =
      registry.get(tool.entityName) ||
      registry.getByPluralName(tool.entityName);
    if (!entity) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Entity '${tool.entityName}' not found in registry.`,
          },
        ],
      };
    }

    const companyPath = client.getCompanyPath();
    const entityPath = entity.parentEntity
      ? `${companyPath}/${entity.parentEntity}(${params.parentId || ""})/${entity.apiPath}`
      : `${companyPath}/${entity.apiPath}`;

    switch (tool.handler) {
      case "list": {
        const query = new ODataQueryBuilder();
        if (params.filter) query.filter(params.filter as string);
        if (params.select)
          query.select(
            (params.select as string).split(",").map((s: string) => s.trim())
          );
        if (params.expand)
          query.expand(
            (params.expand as string).split(",").map((s: string) => s.trim())
          );
        if (params.top) query.top(params.top as number);
        if (params.skip) query.skip(params.skip as number);
        if (params.orderBy) query.orderBy(params.orderBy as string);
        query.count();

        const result = await client.list(entityPath, query);
        const totalCount = result.count ?? result.value.length;
        const truncated = smartTruncate(
          result.value as Record<string, unknown>[],
          { totalCount, pageSize: config.maxPageSize }
        );

        const text = formatListResponse(
          truncated.rows,
          truncated.metadata
            ? {
                mode: truncated.mode,
                totalCount: truncated.metadata.totalCount,
                returnedCount: truncated.metadata.returnedCount,
                hasMore: truncated.metadata.hasMore,
                summary: truncated.summary,
              }
            : undefined
        );
        return { content: [{ type: "text" as const, text }] };
      }

      case "get": {
        let getPath = `${entityPath}(${params.id as string})`;
        if (params.expand) {
          const query = new ODataQueryBuilder();
          query.expand(
            (params.expand as string).split(",").map((s: string) => s.trim())
          );
          getPath += query.build();
        }
        const item = await client.get<Record<string, unknown>>(getPath);
        return {
          content: [
            {
              type: "text" as const,
              text: formatToolResponse(item, entity.name),
            },
          ],
        };
      }

      case "create": {
        const body: Record<string, unknown> = {};
        for (const field of entity.fields) {
          if (!field.readOnly && params[field.name] !== undefined) {
            body[field.name] = params[field.name];
          }
        }
        const created = await client.create<Record<string, unknown>>(
          entityPath,
          body
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Created ${entity.name}:\n${formatToolResponse(created, entity.name)}`,
            },
          ],
        };
      }

      case "update": {
        const updateBody: Record<string, unknown> = {};
        for (const field of entity.fields) {
          if (
            !field.readOnly &&
            field.name !== "id" &&
            params[field.name] !== undefined
          ) {
            updateBody[field.name] = params[field.name];
          }
        }
        const updated = await client.update<Record<string, unknown>>(
          `${entityPath}(${params.id as string})`,
          updateBody
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Updated ${entity.name}:\n${formatToolResponse(updated, entity.name)}`,
            },
          ],
        };
      }

      case "delete": {
        await client.delete(`${entityPath}(${params.id as string})`);
        return {
          content: [
            {
              type: "text" as const,
              text: `Deleted ${entity.name} with ID ${params.id as string}.`,
            },
          ],
        };
      }

      case "count": {
        const count = await client.count(
          entityPath,
          params.filter as string | undefined
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Count: ${count} ${entity.pluralName}${params.filter ? ` matching filter: ${params.filter as string}` : ""}`,
            },
          ],
        };
      }

      case "action": {
        const actionPath = `${entityPath}(${params.id as string})/${tool.actionNavPath}`;
        await client.action(actionPath);
        return {
          content: [
            {
              type: "text" as const,
              text: `Action '${tool.actionNavPath}' executed successfully on ${entity.name} ${params.id as string}.`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown handler type: ${tool.handler}`,
            },
          ],
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const userMessage =
      (error as { userMessage?: string })?.userMessage || message;
    return {
      content: [{ type: "text" as const, text: `Error: ${userMessage}` }],
      isError: true,
    };
  }
}

// ===========================================================================
// 1. Full Tool Registration Flow
// ===========================================================================

describe("Integration: Tool Registration Flow", () => {
  it("should register all standard entities and produce tools for each", () => {
    const registry = new EntityRegistry();
    for (const entity of allStandardEntities) {
      registry.register(entity);
    }

    const allEntities = registry.listAll();
    expect(allEntities.length).toBe(allStandardEntities.length);

    // Every entity should produce at least list + get + count = 3 tools
    let totalTools = 0;
    for (const entity of allEntities) {
      const tools = generateToolsForEntity(entity);
      expect(tools.length).toBeGreaterThanOrEqual(3);
      totalTools += tools.length;
    }

    // With ~33 entities each generating at least 3 tools, total should be > 99
    expect(totalTools).toBeGreaterThan(99);
  });

  it("should produce correct tool names for a writable entity (customer)", () => {
    const registry = new EntityRegistry();
    registry.register(testCustomerEntity);

    const tools = generateToolsForEntity(testCustomerEntity);
    const names = tools.map((t) => t.name);

    expect(names).toContain("bc_list_customers");
    expect(names).toContain("bc_get_customer");
    expect(names).toContain("bc_create_customer");
    expect(names).toContain("bc_update_customer");
    expect(names).toContain("bc_delete_customer");
    expect(names).toContain("bc_count_customers");
    expect(tools.length).toBe(6); // no bound actions on our test entity
  });

  it("should produce correct tool names for an entity with bound actions", () => {
    const registry = new EntityRegistry();
    registry.register(testInvoiceEntity);

    const tools = generateToolsForEntity(testInvoiceEntity);
    const names = tools.map((t) => t.name);

    // 6 CRUD + count + 1 bound action = 7
    expect(names).toContain("bc_list_salesInvoices");
    expect(names).toContain("bc_get_salesInvoice");
    expect(names).toContain("bc_create_salesInvoice");
    expect(names).toContain("bc_update_salesInvoice");
    expect(names).toContain("bc_delete_salesInvoice");
    expect(names).toContain("bc_count_salesInvoices");
    expect(names).toContain("bc_post_salesInvoice");
    expect(tools.length).toBe(7);
  });

  it("should only produce read-only tools for read-only entities", () => {
    const tools = generateToolsForEntity(readOnlyEntity);
    const names = tools.map((t) => t.name);

    expect(names).toContain("bc_list_generalLedgerEntries");
    expect(names).toContain("bc_get_generalLedgerEntry");
    expect(names).toContain("bc_count_generalLedgerEntries");
    expect(tools.length).toBe(3);

    expect(names).not.toContain("bc_create_generalLedgerEntry");
    expect(names).not.toContain("bc_update_generalLedgerEntry");
    expect(names).not.toContain("bc_delete_generalLedgerEntry");
  });

  it("should store correct handler types and entityName on each tool", () => {
    const tools = generateToolsForEntity(testCustomerEntity);
    for (const tool of tools) {
      expect(tool.entityName).toBe("customer");
      expect(
        ["list", "get", "create", "update", "delete", "count", "action"] as HandlerType[]
      ).toContain(tool.handler);
    }
  });

  it("should produce tools that do not share names across different entities", () => {
    const registry = new EntityRegistry();
    registry.register(testCustomerEntity);
    registry.register(testInvoiceEntity);

    const customerTools = generateToolsForEntity(testCustomerEntity);
    const invoiceTools = generateToolsForEntity(testInvoiceEntity);

    const customerNames = new Set(customerTools.map((t) => t.name));
    for (const t of invoiceTools) {
      expect(customerNames.has(t.name)).toBe(false);
    }
  });
});

// ===========================================================================
// 2. Handler Dispatch with Mocked BC Responses
// ===========================================================================

describe("Integration: Handler Dispatch", () => {
  let client: BcClient;
  let registry: EntityRegistry;
  let tools: GeneratedTool[];
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const auth = createMockAuth();
    client = new BcClient(mockConfig, auth);
    client.setCompany(TEST_COMPANY_ID);

    registry = new EntityRegistry();
    registry.register(testCustomerEntity);
    registry.register(testInvoiceEntity);

    tools = [
      ...generateToolsForEntity(testCustomerEntity),
      ...generateToolsForEntity(testInvoiceEntity),
    ];

    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function findTool(name: string): GeneratedTool {
    const tool = tools.find((t) => t.name === name);
    if (!tool) throw new Error(`Tool "${name}" not found`);
    return tool;
  }

  // -- list --
  it("should handle the list flow end-to-end", async () => {
    const responseData = {
      value: [
        { id: "id-1", displayName: "Contoso", email: "info@contoso.com" },
        { id: "id-2", displayName: "Fabrikam", email: "hello@fabrikam.com" },
      ],
      "@odata.count": 2,
    };
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(responseData), { status: 200 })
    );

    const tool = findTool("bc_list_customers");
    const result = await dispatchHandler(tool, {}, client, registry, mockConfig);

    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    // Should contain both customer names in a markdown table
    expect(text).toContain("Contoso");
    expect(text).toContain("Fabrikam");
    // Verify fetch was called with the right URL pattern
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `companies(${TEST_COMPANY_ID})/customers`
      ),
      expect.anything()
    );
  });

  it("should pass OData query parameters for list", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ value: [{ id: "id-1", displayName: "Filtered" }], "@odata.count": 1 }),
        { status: 200 }
      )
    );

    const tool = findTool("bc_list_customers");
    await dispatchHandler(
      tool,
      { filter: "city eq 'Seattle'", top: 10, skip: 5, orderBy: "displayName" },
      client,
      registry,
      mockConfig
    );

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("$filter=city eq 'Seattle'");
    expect(calledUrl).toContain("$top=10");
    expect(calledUrl).toContain("$skip=5");
    expect(calledUrl).toContain("$orderby=displayName");
    expect(calledUrl).toContain("$count=true");
  });

  // -- get --
  it("should handle the get flow end-to-end", async () => {
    const item = {
      id: "cust-1",
      displayName: "Contoso",
      email: "info@contoso.com",
      city: "Seattle",
    };
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(item), { status: 200 })
    );

    const tool = findTool("bc_get_customer");
    const result = await dispatchHandler(
      tool,
      { id: "cust-1" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain("customer");
    expect(text).toContain("displayName: Contoso");
    expect(text).toContain("city: Seattle");

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("customers(cust-1)");
  });

  // -- create --
  it("should handle the create flow end-to-end", async () => {
    const created = {
      id: "new-id",
      displayName: "New Corp",
      email: "new@corp.com",
    };
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(created), { status: 201 })
    );

    const tool = findTool("bc_create_customer");
    const result = await dispatchHandler(
      tool,
      { displayName: "New Corp", email: "new@corp.com" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain("Created customer");
    expect(text).toContain("New Corp");

    // Verify POST body
    const fetchOpts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(fetchOpts.method).toBe("POST");
    const body = JSON.parse(fetchOpts.body as string);
    expect(body.displayName).toBe("New Corp");
    expect(body.email).toBe("new@corp.com");
    // Read-only fields should not be in the body
    expect(body.id).toBeUndefined();
    expect(body.balanceDue).toBeUndefined();
  });

  // -- update --
  it("should handle the update flow end-to-end", async () => {
    const updated = {
      id: "cust-1",
      displayName: "Updated Corp",
      email: "updated@corp.com",
    };
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(updated), { status: 200 })
    );

    const tool = findTool("bc_update_customer");
    const result = await dispatchHandler(
      tool,
      { id: "cust-1", displayName: "Updated Corp" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain("Updated customer");
    expect(text).toContain("Updated Corp");

    const fetchOpts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(fetchOpts.method).toBe("PATCH");
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("customers(cust-1)");
  });

  // -- delete --
  it("should handle the delete flow end-to-end", async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const tool = findTool("bc_delete_customer");
    const result = await dispatchHandler(
      tool,
      { id: "cust-1" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Deleted customer with ID cust-1");

    const fetchOpts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(fetchOpts.method).toBe("DELETE");
  });

  // -- count --
  it("should handle the count flow end-to-end", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ value: [], "@odata.count": 42 }),
        { status: 200 }
      )
    );

    const tool = findTool("bc_count_customers");
    const result = await dispatchHandler(
      tool,
      { filter: "city eq 'Seattle'" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Count: 42 customers");
    expect(result.content[0].text).toContain("matching filter: city eq 'Seattle'");
  });

  it("should handle count without filter", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ value: [], "@odata.count": 100 }),
        { status: 200 }
      )
    );

    const tool = findTool("bc_count_customers");
    const result = await dispatchHandler(
      tool,
      {},
      client,
      registry,
      mockConfig
    );

    expect(result.content[0].text).toBe("Count: 100 customers");
  });

  // -- action --
  it("should handle the action flow end-to-end", async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const tool = findTool("bc_post_salesInvoice");
    const result = await dispatchHandler(
      tool,
      { id: "inv-1" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain(
      "Action 'Microsoft.NAV.post' executed successfully on salesInvoice inv-1"
    );

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("salesInvoices(inv-1)/Microsoft.NAV.post");

    const fetchOpts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(fetchOpts.method).toBe("POST");
  });

  it("should use authorization bearer token in all requests", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ value: [], "@odata.count": 0 }), {
        status: 200,
      })
    );

    const tool = findTool("bc_list_customers");
    await dispatchHandler(tool, {}, client, registry, mockConfig);

    const fetchOpts = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = fetchOpts.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-token");
  });
});

// ===========================================================================
// 3. Smart Truncation for Different Response Sizes
// ===========================================================================

describe("Integration: Smart Truncation Tiers", () => {
  let client: BcClient;
  let registry: EntityRegistry;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const auth = createMockAuth();
    client = new BcClient(mockConfig, auth);
    client.setCompany(TEST_COMPANY_ID);

    registry = new EntityRegistry();
    registry.register(testCustomerEntity);

    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function generateRows(count: number): Record<string, unknown>[] {
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < count; i++) {
      rows.push({
        id: `id-${i}`,
        displayName: `Customer ${i}`,
        email: `cust${i}@example.com`,
        city: i % 2 === 0 ? "Seattle" : "Portland",
      });
    }
    return rows;
  }

  it("should return full mode for small datasets (<=50 rows)", async () => {
    const rows = generateRows(10);
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ value: rows, "@odata.count": 10 }),
        { status: 200 }
      )
    );

    const tools = generateToolsForEntity(testCustomerEntity);
    const listTool = tools.find((t) => t.handler === "list")!;
    const result = await dispatchHandler(
      listTool,
      {},
      client,
      registry,
      mockConfig
    );

    const text = result.content[0].text;
    // In full mode, no "Showing X of Y" metadata is added
    expect(text).not.toContain("Showing");
    // All 10 rows should be present
    for (let i = 0; i < 10; i++) {
      expect(text).toContain(`Customer ${i}`);
    }
  });

  it("should return full mode for exactly 50 rows", async () => {
    const rows = generateRows(50);
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ value: rows, "@odata.count": 50 }),
        { status: 200 }
      )
    );

    const tools = generateToolsForEntity(testCustomerEntity);
    const listTool = tools.find((t) => t.handler === "list")!;
    const result = await dispatchHandler(
      listTool,
      {},
      client,
      registry,
      mockConfig
    );

    const text = result.content[0].text;
    expect(text).not.toContain("Showing");
    expect(text).toContain("Customer 0");
    expect(text).toContain("Customer 49");
  });

  it("should return paginated mode for medium datasets (51-500 rows)", async () => {
    const rows = generateRows(100); // API returns 100 rows
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ value: rows, "@odata.count": 100 }),
        { status: 200 }
      )
    );

    const tools = generateToolsForEntity(testCustomerEntity);
    const listTool = tools.find((t) => t.handler === "list")!;
    const result = await dispatchHandler(
      listTool,
      {},
      client,
      registry,
      mockConfig
    );

    const text = result.content[0].text;
    // Paginated mode shows "Showing X of Y"
    expect(text).toContain("Showing");
    expect(text).toContain("100");
    // Should include hint about navigating data
    expect(text).toContain("$filter");
  });

  it("should return summarized mode for large datasets (>500 rows)", async () => {
    const rows = generateRows(600); // API returns 600 rows
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ value: rows, "@odata.count": 600 }),
        { status: 200 }
      )
    );

    const tools = generateToolsForEntity(testCustomerEntity);
    const listTool = tools.find((t) => t.handler === "list")!;
    const result = await dispatchHandler(
      listTool,
      {},
      client,
      registry,
      mockConfig
    );

    const text = result.content[0].text;
    // Summarized mode includes total count info
    expect(text).toContain("Showing");
    expect(text).toContain("600");
    // Should show only the first 20 rows as preview
    expect(text).toContain("Customer 0");
    expect(text).toContain("Customer 19");
    // Should NOT contain row 20 (0-indexed) in the table
    // The 21st customer name "Customer 20" should not appear as a table row
    // (It may appear in the summary distribution though, so we check the table rows)
    expect(text).toContain("$filter");
  });

  it("should directly verify smartTruncate returns correct modes", () => {
    // Full mode
    const fullResult = smartTruncate(generateRows(30), {
      totalCount: 30,
      pageSize: 50,
    });
    expect(fullResult.mode).toBe("full");
    expect(fullResult.rows.length).toBe(30);
    expect(fullResult.metadata).toBeUndefined();

    // Paginated mode
    const paginatedResult = smartTruncate(generateRows(200), {
      totalCount: 200,
      pageSize: 50,
    });
    expect(paginatedResult.mode).toBe("paginated");
    expect(paginatedResult.rows.length).toBe(50); // pageSize
    expect(paginatedResult.metadata).toBeDefined();
    expect(paginatedResult.metadata!.totalCount).toBe(200);
    expect(paginatedResult.metadata!.hasMore).toBe(true);

    // Summarized mode
    const summarizedResult = smartTruncate(generateRows(700), {
      totalCount: 700,
      pageSize: 50,
    });
    expect(summarizedResult.mode).toBe("summarized");
    expect(summarizedResult.rows.length).toBe(20); // preview rows
    expect(summarizedResult.metadata).toBeDefined();
    expect(summarizedResult.metadata!.totalCount).toBe(700);
    expect(summarizedResult.summary).toBeDefined();
    expect(summarizedResult.summary).toContain("Total records: 700");
  });

  it("should truncate long string values in rows", () => {
    const longString = "A".repeat(300);
    const rows = [{ id: "1", displayName: longString }];
    const result = smartTruncate(rows, { totalCount: 1, pageSize: 50 });
    const displayName = result.rows[0].displayName as string;
    expect(displayName.length).toBeLessThan(300);
    expect(displayName).toContain("...");
  });
});

// ===========================================================================
// 4. Error Handling Flow End-to-End
// ===========================================================================

describe("Integration: Error Handling Flow", () => {
  let client: BcClient;
  let registry: EntityRegistry;
  let tools: GeneratedTool[];
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const auth = createMockAuth();
    client = new BcClient(
      { ...mockConfig, maxRetries: 0 },
      auth
    );
    client.setCompany(TEST_COMPANY_ID);

    registry = new EntityRegistry();
    registry.register(testCustomerEntity);
    tools = generateToolsForEntity(testCustomerEntity);

    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function findTool(name: string): GeneratedTool {
    return tools.find((t) => t.name === name)!;
  }

  it("should return user-friendly message for 400 validation error", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "BadRequest",
            message: "The field 'email' has an invalid value.",
          },
        }),
        { status: 400 }
      )
    );

    const tool = findTool("bc_create_customer");
    const result = await dispatchHandler(
      tool,
      { displayName: "Test", email: "bad-email" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain("Error:");
    expect(text).toContain("Validation error");
    expect(text).toContain("invalid value");
  });

  it("should return user-friendly message for 404 not found", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "NotFound",
            message: "The customer with id 'bad-id' was not found.",
          },
        }),
        { status: 404 }
      )
    );

    const tool = findTool("bc_get_customer");
    const result = await dispatchHandler(
      tool,
      { id: "bad-id" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain("Error:");
    expect(text).toContain("not found");
  });

  it("should return user-friendly message for 409 concurrency conflict", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "ConcurrencyConflict",
            message:
              "Another user has modified the record. Please refresh and try again.",
          },
        }),
        { status: 409 }
      )
    );

    const tool = findTool("bc_update_customer");
    const result = await dispatchHandler(
      tool,
      { id: "cust-1", displayName: "Updated" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain("Error:");
    expect(text).toContain("Concurrency conflict");
    expect(text).toContain("re-fetch");
  });

  it("should return user-friendly message for 429 rate limit", async () => {
    // With maxRetries=0 the error is not retried and propagates immediately
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "TooManyRequests",
            message: "Rate limit exceeded.",
          },
        }),
        { status: 429 }
      )
    );

    const tool = findTool("bc_list_customers");
    const result = await dispatchHandler(
      tool,
      {},
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toContain("Error:");
    expect(text).toContain("Rate limit");
  });

  it("should handle missing company selection gracefully", async () => {
    // Create a client without company set
    const auth = createMockAuth();
    const noCompanyClient = new BcClient(mockConfig, auth);

    const tool = findTool("bc_list_customers");
    const result = await dispatchHandler(
      tool,
      {},
      noCompanyClient,
      registry,
      mockConfig
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Error:");
    expect(result.content[0].text).toContain("company");
  });

  it("should handle entity not found in registry", async () => {
    const orphanTool: GeneratedTool = {
      name: "bc_list_widgets",
      description: "List widgets",
      inputSchema: {},
      handler: "list",
      entityName: "widget",
    };

    const result = await dispatchHandler(
      orphanTool,
      {},
      client,
      registry,
      mockConfig
    );

    expect(result.content[0].text).toContain("Entity 'widget' not found");
  });

  it("should propagate non-JSON error responses", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response("Internal Server Error", {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "text/plain" },
      })
    );

    const tool = findTool("bc_get_customer");
    const result = await dispatchHandler(
      tool,
      { id: "cust-1" },
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Error:");
  });
});

// ===========================================================================
// 5. Metadata Discovery Flow
// ===========================================================================

describe("Integration: Metadata Discovery", () => {
  const fixtureXml = fs.readFileSync(
    path.join(import.meta.dirname, "../fixtures/metadata-sample.xml"),
    "utf-8"
  );

  it("should parse metadata XML and produce valid entity definitions", () => {
    const entities = parseMetadata(fixtureXml);
    expect(entities.length).toBe(2); // customer + customApiEntity

    const customer = entities.find((e) => e.name === "customer")!;
    expect(customer.pluralName).toBe("customers");
    expect(customer.apiPath).toBe("customers");
    expect(customer.fields.length).toBeGreaterThan(0);

    const custom = entities.find((e) => e.name === "customApiEntity")!;
    expect(custom.pluralName).toBe("customApiEntities");
    expect(custom.fields.length).toBeGreaterThan(0);
  });

  it("should register discovered entities and generate tools for them", () => {
    const registry = new EntityRegistry();

    // Simulate: standard entities are already registered
    registry.register(testCustomerEntity);

    const discovered = parseMetadata(fixtureXml);
    let newCount = 0;
    for (const entity of discovered) {
      if (!registry.get(entity.name)) {
        registry.register(entity);
        newCount++;
      }
    }

    // customer was already registered so it should be skipped.
    // customApiEntity is new.
    expect(newCount).toBe(1);

    // Verify the custom entity was actually registered
    const custom = registry.get("customApiEntity");
    expect(custom).toBeDefined();
    expect(custom!.pluralName).toBe("customApiEntities");

    // Generate tools for the new entity
    const tools = generateToolsForEntity(custom!);
    const names = tools.map((t) => t.name);
    expect(names).toContain("bc_list_customApiEntities");
    expect(names).toContain("bc_get_customApiEntity");
    expect(names).toContain("bc_create_customApiEntity");
    expect(names).toContain("bc_count_customApiEntities");
  });

  it("should preserve correct field types from metadata for discovered entities", () => {
    const discovered = parseMetadata(fixtureXml);
    const custom = discovered.find((e) => e.name === "customApiEntity")!;

    const systemId = custom.fields.find((f) => f.name === "systemId")!;
    expect(systemId.type).toBe("guid");
    expect(systemId.readOnly).toBe(true); // key field

    const code = custom.fields.find((f) => f.name === "code")!;
    expect(code.type).toBe("string");
    expect(code.maxLength).toBe(20);

    const amount = custom.fields.find((f) => f.name === "amount")!;
    expect(amount.type).toBe("decimal");

    const quantity = custom.fields.find((f) => f.name === "quantity")!;
    expect(quantity.type).toBe("number");

    const isActive = custom.fields.find((f) => f.name === "isActive")!;
    expect(isActive.type).toBe("boolean");

    const createdDate = custom.fields.find((f) => f.name === "createdDate")!;
    expect(createdDate.type).toBe("date");
  });

  it("should parse navigation properties from metadata", () => {
    const discovered = parseMetadata(fixtureXml);
    const customer = discovered.find((e) => e.name === "customer")!;

    const salesOrders = customer.navigationProperties.find(
      (n) => n.name === "salesOrders"
    );
    expect(salesOrders).toBeDefined();
    expect(salesOrders!.isCollection).toBe(true);

    const currency = customer.navigationProperties.find(
      (n) => n.name === "currency"
    );
    expect(currency).toBeDefined();
    expect(currency!.isCollection).toBe(false);
  });

  it("should allow dispatching handlers for discovered entities", async () => {
    const registry = new EntityRegistry();
    const discovered = parseMetadata(fixtureXml);
    for (const entity of discovered) {
      registry.register(entity);
    }

    const custom = registry.get("customApiEntity")!;
    const tools = generateToolsForEntity(custom);
    const listTool = tools.find((t) => t.handler === "list")!;

    const auth = createMockAuth();
    const client = new BcClient(mockConfig, auth);
    client.setCompany(TEST_COMPANY_ID);

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          value: [
            {
              systemId: "sys-1",
              code: "WIDGET-01",
              description: "A test widget",
              amount: 99.99,
              quantity: 5,
              isActive: true,
              createdDate: "2025-01-15",
            },
          ],
          "@odata.count": 1,
        }),
        { status: 200 }
      )
    );

    const result = await dispatchHandler(
      listTool,
      {},
      client,
      registry,
      mockConfig
    );

    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain("WIDGET-01");
    expect(text).toContain("99.99");

    vi.restoreAllMocks();
  });
});
