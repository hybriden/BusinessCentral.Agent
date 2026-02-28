import { describe, it, expect } from "vitest";
import { ODataQueryBuilder } from "../../../src/client/odata-query.js";

describe("ODataQueryBuilder", () => {
  it("should build empty query string for no params", () => {
    const builder = new ODataQueryBuilder();
    expect(builder.build()).toBe("");
  });

  it("should build $filter query", () => {
    const builder = new ODataQueryBuilder().filter("displayName eq 'Contoso'");
    expect(builder.build()).toBe("?$filter=displayName eq 'Contoso'");
  });

  it("should build $select query", () => {
    const builder = new ODataQueryBuilder().select(["id", "displayName", "email"]);
    expect(builder.build()).toBe("?$select=id,displayName,email");
  });

  it("should build $expand query", () => {
    const builder = new ODataQueryBuilder().expand(["salesOrderLines", "customer"]);
    expect(builder.build()).toBe("?$expand=salesOrderLines,customer");
  });

  it("should build nested $expand with inner filter", () => {
    const builder = new ODataQueryBuilder().expand(["salesOrderLines($filter=quantity gt 10)"]);
    expect(builder.build()).toBe("?$expand=salesOrderLines($filter=quantity gt 10)");
  });

  it("should build $top and $skip", () => {
    const builder = new ODataQueryBuilder().top(50).skip(100);
    expect(builder.build()).toBe("?$top=50&$skip=100");
  });

  it("should build $orderby", () => {
    const builder = new ODataQueryBuilder().orderBy("displayName asc");
    expect(builder.build()).toBe("?$orderby=displayName asc");
  });

  it("should build $count=true", () => {
    const builder = new ODataQueryBuilder().count();
    expect(builder.build()).toBe("?$count=true");
  });

  it("should combine multiple parameters", () => {
    const builder = new ODataQueryBuilder()
      .filter("city eq 'Oslo'")
      .select(["id", "displayName"])
      .top(20)
      .orderBy("displayName asc")
      .count();
    const query = builder.build();
    expect(query).toContain("$filter=city eq 'Oslo'");
    expect(query).toContain("$select=id,displayName");
    expect(query).toContain("$top=20");
    expect(query).toContain("$orderby=displayName asc");
    expect(query).toContain("$count=true");
  });
});
