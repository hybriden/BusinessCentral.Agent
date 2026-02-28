export class ODataQueryBuilder {
  private params: Map<string, string> = new Map();

  filter(expression: string): this {
    this.params.set("$filter", expression);
    return this;
  }

  select(fields: string[]): this {
    this.params.set("$select", fields.join(","));
    return this;
  }

  expand(navigations: string[]): this {
    this.params.set("$expand", navigations.join(","));
    return this;
  }

  top(n: number): this {
    this.params.set("$top", n.toString());
    return this;
  }

  skip(n: number): this {
    this.params.set("$skip", n.toString());
    return this;
  }

  orderBy(expression: string): this {
    this.params.set("$orderby", expression);
    return this;
  }

  count(): this {
    this.params.set("$count", "true");
    return this;
  }

  build(): string {
    if (this.params.size === 0) return "";
    const parts: string[] = [];
    for (const [key, value] of this.params) {
      parts.push(`${key}=${value}`);
    }
    return "?" + parts.join("&");
  }
}
