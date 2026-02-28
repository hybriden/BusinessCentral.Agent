import { describe, it, expect } from "vitest";
import { EntityRegistry } from "../../../src/entities/registry.js";
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
  ],
  navigationProperties: [],
  boundActions: [],
};

describe("EntityRegistry", () => {
  it("should register and retrieve entities", () => {
    const registry = new EntityRegistry();
    registry.register(testEntity);
    expect(registry.get("customer")).toBe(testEntity);
  });

  it("should list all registered entities", () => {
    const registry = new EntityRegistry();
    registry.register(testEntity);
    const all = registry.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("customer");
  });

  it("should return undefined for unknown entity", () => {
    const registry = new EntityRegistry();
    expect(registry.get("unknown")).toBeUndefined();
  });

  it("should get writable fields (excluding readOnly)", () => {
    const registry = new EntityRegistry();
    registry.register(testEntity);
    const writable = registry.getWritableFields("customer");
    expect(writable).toHaveLength(2);
    expect(writable.map(f => f.name)).toContain("displayName");
    expect(writable.map(f => f.name)).toContain("city");
    expect(writable.map(f => f.name)).not.toContain("id");
  });

  it("should get required fields", () => {
    const registry = new EntityRegistry();
    registry.register(testEntity);
    const required = registry.getRequiredFields("customer");
    expect(required).toHaveLength(1);
    expect(required[0].name).toBe("displayName");
  });

  it("should find entity by plural name", () => {
    const registry = new EntityRegistry();
    registry.register(testEntity);
    const found = registry.getByPluralName("customers");
    expect(found?.name).toBe("customer");
  });
});
