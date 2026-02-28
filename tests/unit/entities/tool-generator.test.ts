import { describe, it, expect } from "vitest";
import { generateToolsForEntity } from "../../../src/entities/tool-generator.js";
import type { EntityDefinition } from "../../../src/entities/entity-types.js";

const testEntity: EntityDefinition = {
  name: "customer",
  pluralName: "customers",
  apiPath: "customers",
  description: "A customer in Business Central",
  fields: [
    { name: "id", type: "guid", readOnly: true, description: "Unique ID" },
    { name: "displayName", type: "string", required: true, description: "Customer name" },
    { name: "city", type: "string", description: "City" },
    { name: "balanceDue", type: "decimal", readOnly: true, description: "Outstanding balance" },
    { name: "type", type: "enum", enumValues: ["Company", "Person"], description: "Contact type" },
  ],
  navigationProperties: [
    { name: "paymentTerm", targetEntity: "paymentTerm", isCollection: false, description: "Payment terms" },
    { name: "salesOrderLines", targetEntity: "salesOrderLine", isCollection: true, description: "Order lines" },
  ],
  boundActions: [
    { name: "post", description: "Post the document", httpMethod: "POST", navPath: "Microsoft.NAV.post" },
  ],
};

const readOnlyEntity: EntityDefinition = {
  ...testEntity,
  name: "glEntry",
  pluralName: "generalLedgerEntries",
  isReadOnly: true,
  boundActions: [],
};

describe("generateToolsForEntity", () => {
  it("should generate list, get, create, update, delete, count tools", () => {
    const tools = generateToolsForEntity(testEntity);
    const names = tools.map((t) => t.name);
    expect(names).toContain("bc_list_customers");
    expect(names).toContain("bc_get_customer");
    expect(names).toContain("bc_create_customer");
    expect(names).toContain("bc_update_customer");
    expect(names).toContain("bc_delete_customer");
    expect(names).toContain("bc_count_customers");
  });

  it("should generate action tools for bound actions", () => {
    const tools = generateToolsForEntity(testEntity);
    const names = tools.map((t) => t.name);
    expect(names).toContain("bc_post_customer");
  });

  it("should include filter, top, skip, expand, select, orderBy in list tool schema", () => {
    const tools = generateToolsForEntity(testEntity);
    const listTool = tools.find((t) => t.name === "bc_list_customers")!;
    const schemaKeys = Object.keys(listTool.inputSchema);
    expect(schemaKeys).toContain("filter");
    expect(schemaKeys).toContain("top");
    expect(schemaKeys).toContain("skip");
    expect(schemaKeys).toContain("expand");
    expect(schemaKeys).toContain("select");
    expect(schemaKeys).toContain("orderBy");
  });

  it("should include only writable fields in create tool schema", () => {
    const tools = generateToolsForEntity(testEntity);
    const createTool = tools.find((t) => t.name === "bc_create_customer")!;
    const schemaKeys = Object.keys(createTool.inputSchema);
    expect(schemaKeys).toContain("displayName");
    expect(schemaKeys).toContain("city");
    expect(schemaKeys).not.toContain("id");
    expect(schemaKeys).not.toContain("balanceDue");
  });

  it("should not generate mutation tools for read-only entities", () => {
    const tools = generateToolsForEntity(readOnlyEntity);
    const names = tools.map((t) => t.name);
    expect(names).toContain("bc_list_generalLedgerEntries");
    expect(names).toContain("bc_get_glEntry");
    expect(names).not.toContain("bc_create_glEntry");
    expect(names).not.toContain("bc_update_glEntry");
    expect(names).not.toContain("bc_delete_glEntry");
  });

  it("should have meaningful descriptions", () => {
    const tools = generateToolsForEntity(testEntity);
    const listTool = tools.find((t) => t.name === "bc_list_customers")!;
    expect(listTool.description).toContain("customer");
    expect(listTool.description.length).toBeGreaterThan(20);
  });

  it("should set handler type correctly", () => {
    const tools = generateToolsForEntity(testEntity);
    expect(tools.find((t) => t.name === "bc_list_customers")!.handler).toBe("list");
    expect(tools.find((t) => t.name === "bc_get_customer")!.handler).toBe("get");
    expect(tools.find((t) => t.name === "bc_create_customer")!.handler).toBe("create");
    expect(tools.find((t) => t.name === "bc_update_customer")!.handler).toBe("update");
    expect(tools.find((t) => t.name === "bc_delete_customer")!.handler).toBe("delete");
    expect(tools.find((t) => t.name === "bc_count_customers")!.handler).toBe("count");
    expect(tools.find((t) => t.name === "bc_post_customer")!.handler).toBe("action");
  });

  it("should store actionNavPath for action tools", () => {
    const tools = generateToolsForEntity(testEntity);
    const actionTool = tools.find((t) => t.name === "bc_post_customer")!;
    expect(actionTool.actionNavPath).toBe("Microsoft.NAV.post");
  });
});
