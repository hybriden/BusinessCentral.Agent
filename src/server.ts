import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { ZodTypeAny } from "zod";
import { loadConfig, type BcConfig } from "./config.js";
import { OAuthClient } from "./auth/oauth.js";
import { BcClient, type OAuthClient as OAuthClientInterface } from "./client/bc-client.js";
import { ODataQueryBuilder } from "./client/odata-query.js";
import { EntityRegistry } from "./entities/registry.js";
import { generateToolsForEntity, type GeneratedTool } from "./entities/tool-generator.js";
import { allStandardEntities } from "./entities/definitions/index.js";
import { parseMetadata } from "./entities/metadata-discovery.js";
import { smartTruncate } from "./utils/truncation.js";
import { formatToolResponse, formatListResponse } from "./utils/formatting.js";

export async function createServer(): Promise<void> {
  const config = loadConfig();
  const auth = new OAuthClient(config);
  // The OAuthClient class's authenticate() returns Promise<TokenData> rather than Promise<void>,
  // but BcClient only uses getAccessToken(), so the cast is safe.
  const client = new BcClient(config, auth as unknown as OAuthClientInterface);
  const registry = new EntityRegistry();

  // Register all standard entities
  for (const entity of allStandardEntities) {
    registry.register(entity);
  }

  const server = new McpServer({
    name: "business-central-agent",
    version: "0.1.0",
  });

  // Register global tools first

  // bc_list_companies
  server.registerTool(
    "bc_list_companies",
    {
      description: "List all available companies in Business Central. You must select a company before accessing any other data.",
    },
    async () => {
      try {
        const companies = await client.listCompanies();
        return {
          content: [{ type: "text" as const, text: formatListResponse(companies as Record<string, unknown>[]) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const userMessage = (error as { userMessage?: string })?.userMessage || message;
        return { content: [{ type: "text" as const, text: `Error: ${userMessage}` }], isError: true };
      }
    }
  );

  // bc_select_company
  server.registerTool(
    "bc_select_company",
    {
      description: "Select the active company to work with. Required before using any entity tools. Use bc_list_companies first to see available companies.",
      inputSchema: {
        companyId: z.string().describe("The GUID of the company to select."),
      },
    },
    async ({ companyId }) => {
      client.setCompany(companyId);
      return {
        content: [{ type: "text" as const, text: `Company selected: ${companyId}` }],
      };
    }
  );

  // bc_discover_custom_apis
  server.registerTool(
    "bc_discover_custom_apis",
    {
      description: "Discover custom API pages in Business Central by reading the OData $metadata. Registers any new entities found as additional tools.",
    },
    async () => {
      try {
        const metadataUrl = `${config.baseUrl}/$metadata`;
        const token = await auth.getAccessToken();
        const response = await fetch(metadataUrl, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/xml" },
        });
        if (!response.ok) {
          return { content: [{ type: "text" as const, text: `Failed to fetch metadata: ${response.status}` }] };
        }
        const xml = await response.text();
        const discovered = parseMetadata(xml);

        // Register entities not already in registry
        let newCount = 0;
        for (const entity of discovered) {
          if (!registry.get(entity.name)) {
            registry.register(entity);
            const tools = generateToolsForEntity(entity);
            for (const tool of tools) {
              registerEntityTool(server, client, registry, config, tool);
            }
            newCount++;
          }
        }

        return {
          content: [{ type: "text" as const, text: `Discovered ${discovered.length} entities. Registered ${newCount} new custom entities.` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Metadata discovery failed: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Register all entity tools
  for (const entity of registry.listAll()) {
    const tools = generateToolsForEntity(entity);
    for (const tool of tools) {
      registerEntityTool(server, client, registry, config, tool);
    }
  }

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function registerEntityTool(
  server: McpServer,
  client: BcClient,
  registry: EntityRegistry,
  config: BcConfig,
  tool: GeneratedTool
): void {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    async (params: Record<string, unknown>) => {
      try {
        const entity = registry.get(tool.entityName) || registry.getByPluralName(tool.entityName);
        if (!entity) {
          return { content: [{ type: "text" as const, text: `Entity '${tool.entityName}' not found in registry.` }] };
        }

        const companyPath = client.getCompanyPath();
        const entityPath = entity.parentEntity
          ? `${companyPath}/${entity.parentEntity}(${(params as Record<string, unknown>).parentId || ""})/${entity.apiPath}`
          : `${companyPath}/${entity.apiPath}`;

        switch (tool.handler) {
          case "list": {
            const query = new ODataQueryBuilder();
            if (params.filter) query.filter(params.filter as string);
            if (params.select) query.select((params.select as string).split(",").map((s: string) => s.trim()));
            if (params.expand) query.expand((params.expand as string).split(",").map((s: string) => s.trim()));
            if (params.top) query.top(params.top as number);
            if (params.skip) query.skip(params.skip as number);
            if (params.orderBy) query.orderBy(params.orderBy as string);
            query.count();

            const result = await client.list(entityPath, query);
            const totalCount = result.count ?? result.value.length;
            const truncated = smartTruncate(result.value as Record<string, unknown>[], {
              totalCount,
              pageSize: config.maxPageSize,
            });

            const text = formatListResponse(truncated.rows, truncated.metadata ? {
              mode: truncated.mode,
              totalCount: truncated.metadata.totalCount,
              returnedCount: truncated.metadata.returnedCount,
              hasMore: truncated.metadata.hasMore,
              summary: truncated.summary,
            } : undefined);

            return { content: [{ type: "text" as const, text }] };
          }

          case "get": {
            let getPath = `${entityPath}(${params.id as string})`;
            if (params.expand) {
              const query = new ODataQueryBuilder();
              query.expand((params.expand as string).split(",").map((s: string) => s.trim()));
              getPath += query.build();
            }
            const item = await client.get<Record<string, unknown>>(getPath);
            return { content: [{ type: "text" as const, text: formatToolResponse(item, entity.name) }] };
          }

          case "create": {
            const body: Record<string, unknown> = {};
            for (const field of entity.fields) {
              if (!field.readOnly && params[field.name] !== undefined) {
                body[field.name] = params[field.name];
              }
            }
            const created = await client.create<Record<string, unknown>>(entityPath, body);
            return { content: [{ type: "text" as const, text: `Created ${entity.name}:\n${formatToolResponse(created, entity.name)}` }] };
          }

          case "update": {
            const updateBody: Record<string, unknown> = {};
            for (const field of entity.fields) {
              if (!field.readOnly && field.name !== "id" && params[field.name] !== undefined) {
                updateBody[field.name] = params[field.name];
              }
            }
            const updated = await client.update<Record<string, unknown>>(`${entityPath}(${params.id as string})`, updateBody);
            return { content: [{ type: "text" as const, text: `Updated ${entity.name}:\n${formatToolResponse(updated, entity.name)}` }] };
          }

          case "delete": {
            await client.delete(`${entityPath}(${params.id as string})`);
            return { content: [{ type: "text" as const, text: `Deleted ${entity.name} with ID ${params.id as string}.` }] };
          }

          case "count": {
            const count = await client.count(entityPath, params.filter as string | undefined);
            return { content: [{ type: "text" as const, text: `Count: ${count} ${entity.pluralName}${params.filter ? ` matching filter: ${params.filter as string}` : ""}` }] };
          }

          case "action": {
            const actionPath = `${entityPath}(${params.id as string})/${tool.actionNavPath}`;
            await client.action(actionPath);
            return { content: [{ type: "text" as const, text: `Action '${tool.actionNavPath}' executed successfully on ${entity.name} ${params.id as string}.` }] };
          }

          default:
            return { content: [{ type: "text" as const, text: `Unknown handler type: ${tool.handler}` }] };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const userMessage = (error as { userMessage?: string })?.userMessage || message;
        return { content: [{ type: "text" as const, text: `Error: ${userMessage}` }], isError: true };
      }
    }
  );
}
