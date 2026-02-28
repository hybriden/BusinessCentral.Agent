import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, type BcConfig } from "../../src/config.js";

describe("loadConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should load config from environment variables", () => {
    process.env.BC_TENANT_ID = "test-tenant";
    process.env.BC_ENVIRONMENT = "sandbox";
    process.env.BC_CLIENT_ID = "test-client-id";
    const config = loadConfig();
    expect(config.tenantId).toBe("test-tenant");
    expect(config.environment).toBe("sandbox");
    expect(config.clientId).toBe("test-client-id");
    expect(config.redirectPort).toBe(3847);
    expect(config.apiVersion).toBe("v2.0");
  });

  it("should use default values for optional fields", () => {
    process.env.BC_TENANT_ID = "test-tenant";
    process.env.BC_ENVIRONMENT = "production";
    process.env.BC_CLIENT_ID = "test-client-id";
    const config = loadConfig();
    expect(config.redirectPort).toBe(3847);
    expect(config.apiVersion).toBe("v2.0");
    expect(config.maxPageSize).toBe(50);
    expect(config.maxRetries).toBe(5);
  });

  it("should throw if required fields are missing", () => {
    delete process.env.BC_TENANT_ID;
    delete process.env.BC_ENVIRONMENT;
    delete process.env.BC_CLIENT_ID;
    expect(() => loadConfig()).toThrow();
  });

  it("should construct base URL correctly", () => {
    process.env.BC_TENANT_ID = "my-tenant";
    process.env.BC_ENVIRONMENT = "production";
    process.env.BC_CLIENT_ID = "test-client-id";
    const config = loadConfig();
    expect(config.baseUrl).toBe(
      "https://api.businesscentral.dynamics.com/v2.0/my-tenant/production/api/v2.0"
    );
  });
});
