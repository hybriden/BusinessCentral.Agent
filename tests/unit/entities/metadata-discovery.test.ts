import { describe, it, expect } from "vitest";
import { parseMetadata } from "../../../src/entities/metadata-discovery.js";
import fs from "node:fs";
import path from "node:path";

const fixtureXml = fs.readFileSync(
  path.join(import.meta.dirname, "../../fixtures/metadata-sample.xml"),
  "utf-8"
);

describe("parseMetadata", () => {
  it("should parse entity types from EDMX XML", () => {
    const entities = parseMetadata(fixtureXml);
    expect(entities.length).toBeGreaterThanOrEqual(2);
  });

  it("should extract entity name and plural name from EntitySet", () => {
    const entities = parseMetadata(fixtureXml);
    const customer = entities.find((e) => e.name === "customer");
    expect(customer).toBeDefined();
    expect(customer!.pluralName).toBe("customers");
    expect(customer!.apiPath).toBe("customers");
  });

  it("should extract fields with correct types", () => {
    const entities = parseMetadata(fixtureXml);
    const customer = entities.find((e) => e.name === "customer")!;

    const idField = customer.fields.find((f) => f.name === "id");
    expect(idField?.type).toBe("guid");

    const nameField = customer.fields.find((f) => f.name === "displayName");
    expect(nameField?.type).toBe("string");

    const balanceField = customer.fields.find((f) => f.name === "balanceDue");
    expect(balanceField?.type).toBe("decimal");

    const taxField = customer.fields.find((f) => f.name === "taxLiable");
    expect(taxField?.type).toBe("boolean");

    const dateField = customer.fields.find((f) => f.name === "lastModifiedDateTime");
    expect(dateField?.type).toBe("datetime");
  });

  it("should mark key fields as readOnly", () => {
    const entities = parseMetadata(fixtureXml);
    const customer = entities.find((e) => e.name === "customer")!;
    const idField = customer.fields.find((f) => f.name === "id");
    expect(idField?.readOnly).toBe(true);
  });

  it("should extract navigation properties", () => {
    const entities = parseMetadata(fixtureXml);
    const customer = entities.find((e) => e.name === "customer")!;
    expect(customer.navigationProperties.length).toBeGreaterThanOrEqual(1);
    const salesOrders = customer.navigationProperties.find((n) => n.name === "salesOrders");
    expect(salesOrders?.isCollection).toBe(true);
    const currency = customer.navigationProperties.find((n) => n.name === "currency");
    expect(currency?.isCollection).toBe(false);
  });

  it("should handle custom entity types", () => {
    const entities = parseMetadata(fixtureXml);
    const custom = entities.find((e) => e.pluralName === "customApiEntities");
    expect(custom).toBeDefined();
    expect(custom!.fields.length).toBeGreaterThanOrEqual(5);
  });

  it("should map Edm.Int32 to number", () => {
    const entities = parseMetadata(fixtureXml);
    const custom = entities.find((e) => e.pluralName === "customApiEntities")!;
    const qty = custom.fields.find((f) => f.name === "quantity");
    expect(qty?.type).toBe("number");
  });

  it("should map Edm.Date to date", () => {
    const entities = parseMetadata(fixtureXml);
    const custom = entities.find((e) => e.pluralName === "customApiEntities")!;
    const dateField = custom.fields.find((f) => f.name === "createdDate");
    expect(dateField?.type).toBe("date");
  });
});
