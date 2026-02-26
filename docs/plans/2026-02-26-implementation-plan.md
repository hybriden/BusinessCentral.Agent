# BusinessCentral.Agent MCP Server — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-grade MCP server that gives AI agents full CRUD access to Business Central via its standard REST API v2.0, with hybrid entity discovery, smart data handling for large datasets, and OAuth 2.0 PKCE authentication.

**Architecture:** TypeScript MCP server using `@modelcontextprotocol/sdk` over stdio transport. Statically-defined entity schemas for all ~35 standard BC API v2.0 entities with runtime discovery of custom APIs via OData $metadata. Context-window-aware response sizing with automatic pagination, truncation and summarization.

**Tech Stack:** TypeScript, Node.js (>=20), `@modelcontextprotocol/sdk`, `zod@3`, `vitest` for testing, `fast-xml-parser` for $metadata parsing, native `fetch` for HTTP.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/index.ts` (minimal entry point)

**Step 1: Initialize project and install dependencies**

```bash
cd /c/BusinessCentral.Agent
npm init -y
npm install @modelcontextprotocol/sdk zod@3 fast-xml-parser open
npm install -D typescript @types/node vitest
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "tests"]
}
```

**Step 3: Update package.json**

Set `"type": "module"`, add scripts:
```json
{
  "type": "module",
  "bin": {
    "bc-agent": "./build/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 4: Create .env.example**

```
BC_TENANT_ID=your-tenant-id
BC_ENVIRONMENT=sandbox
BC_CLIENT_ID=your-azure-app-client-id
BC_REDIRECT_PORT=3847
```

**Step 5: Create .gitignore**

```
node_modules/
build/
.env
*.js.map
```

**Step 6: Create minimal src/index.ts**

```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "business-central-agent",
  version: "0.1.0",
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BusinessCentral.Agent MCP server running on stdio");
}

main().catch(console.error);
```

**Step 7: Build and verify**

Run: `npm run build`
Expected: Clean compilation, `build/index.js` created.

**Step 8: Commit**

```bash
git add package.json tsconfig.json .env.example .gitignore src/index.ts
git commit -m "feat: scaffold MCP server project with TypeScript and dependencies"
```

---

## Task 2: Configuration Module

**Files:**
- Create: `src/config.ts`
- Create: `tests/unit/config.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/config.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/config.test.ts`
Expected: FAIL — module not found.

**Step 3: Write implementation**

```typescript
// src/config.ts
export interface BcConfig {
  tenantId: string;
  environment: string;
  clientId: string;
  redirectPort: number;
  apiVersion: string;
  baseUrl: string;
  authUrl: string;
  tokenUrl: string;
  maxPageSize: number;
  maxRetries: number;
  requestTimeoutMs: number;
  scopes: string[];
}

export function loadConfig(): BcConfig {
  const tenantId = requireEnv("BC_TENANT_ID");
  const environment = requireEnv("BC_ENVIRONMENT");
  const clientId = requireEnv("BC_CLIENT_ID");
  const redirectPort = parseInt(process.env.BC_REDIRECT_PORT || "3847", 10);
  const apiVersion = process.env.BC_API_VERSION || "v2.0";
  const maxPageSize = parseInt(process.env.BC_MAX_PAGE_SIZE || "50", 10);
  const maxRetries = parseInt(process.env.BC_MAX_RETRIES || "5", 10);
  const requestTimeoutMs = parseInt(process.env.BC_REQUEST_TIMEOUT_MS || "480000", 10);

  const baseUrl = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/api/${apiVersion}`;
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const scopes = ["https://api.businesscentral.dynamics.com/.default", "offline_access"];

  return {
    tenantId,
    environment,
    clientId,
    redirectPort,
    apiVersion,
    baseUrl,
    authUrl,
    tokenUrl,
    maxPageSize,
    maxRetries,
    requestTimeoutMs,
    scopes,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
```

**Step 4: Add vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
  },
});
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/config.test.ts`
Expected: All 4 tests PASS.

**Step 6: Commit**

```bash
git add src/config.ts tests/unit/config.test.ts vitest.config.ts
git commit -m "feat: add configuration module with env var loading and validation"
```

---

## Task 3: OAuth 2.0 Authorization Code + PKCE

**Files:**
- Create: `src/auth/pkce.ts`
- Create: `src/auth/callback-server.ts`
- Create: `src/auth/token-store.ts`
- Create: `src/auth/oauth.ts`
- Create: `tests/unit/auth/pkce.test.ts`
- Create: `tests/unit/auth/token-store.test.ts`

**Step 1: Write PKCE tests**

```typescript
// tests/unit/auth/pkce.test.ts
import { describe, it, expect } from "vitest";
import { generateCodeVerifier, generateCodeChallenge } from "../../../src/auth/pkce.js";

describe("PKCE", () => {
  it("should generate a code verifier of correct length", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  it("should generate different verifiers each time", () => {
    const v1 = generateCodeVerifier();
    const v2 = generateCodeVerifier();
    expect(v1).not.toBe(v2);
  });

  it("should generate a valid S256 code challenge", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await generateCodeChallenge(verifier);
    // S256 challenge is base64url-encoded SHA256 of verifier
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(challenge.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/auth/pkce.test.ts`
Expected: FAIL.

**Step 3: Implement PKCE**

```typescript
// src/auth/pkce.ts
import crypto from "node:crypto";

export function generateCodeVerifier(): string {
  const buffer = crypto.randomBytes(32);
  return buffer.toString("base64url");
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("base64url");
}
```

**Step 4: Run PKCE tests**

Run: `npx vitest run tests/unit/auth/pkce.test.ts`
Expected: PASS.

**Step 5: Write token store tests**

```typescript
// tests/unit/auth/token-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TokenStore, type TokenData } from "../../../src/auth/token-store.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("TokenStore", () => {
  let storePath: string;
  let store: TokenStore;

  beforeEach(() => {
    storePath = path.join(os.tmpdir(), `bc-agent-test-${Date.now()}`);
    store = new TokenStore(storePath);
  });

  afterEach(() => {
    if (fs.existsSync(path.join(storePath, "tokens.json"))) {
      fs.rmSync(storePath, { recursive: true });
    }
  });

  it("should return null when no tokens exist", async () => {
    const tokens = await store.load();
    expect(tokens).toBeNull();
  });

  it("should save and load tokens", async () => {
    const tokenData: TokenData = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresAt: Date.now() + 3600000,
    };

    await store.save(tokenData);
    const loaded = await store.load();

    expect(loaded).not.toBeNull();
    expect(loaded!.accessToken).toBe("test-access-token");
    expect(loaded!.refreshToken).toBe("test-refresh-token");
  });

  it("should detect expired tokens", () => {
    const expired: TokenData = {
      accessToken: "test",
      refreshToken: "test",
      expiresAt: Date.now() - 1000,
    };
    expect(TokenStore.isExpired(expired)).toBe(true);
  });

  it("should detect tokens expiring within buffer", () => {
    const expiringSoon: TokenData = {
      accessToken: "test",
      refreshToken: "test",
      expiresAt: Date.now() + 60000, // 1 minute
    };
    // With 5 minute buffer, should be considered expiring
    expect(TokenStore.isExpiringSoon(expiringSoon, 300000)).toBe(true);
  });

  it("should clear tokens", async () => {
    const tokenData: TokenData = {
      accessToken: "test",
      refreshToken: "test",
      expiresAt: Date.now() + 3600000,
    };

    await store.save(tokenData);
    await store.clear();
    const loaded = await store.load();
    expect(loaded).toBeNull();
  });
});
```

**Step 6: Implement token store**

```typescript
// src/auth/token-store.ts
import fs from "node:fs/promises";
import path from "node:path";

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenStore {
  private filePath: string;

  constructor(dirPath: string) {
    this.filePath = path.join(dirPath, "tokens.json");
  }

  async save(tokens: TokenData): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(tokens, null, 2), "utf-8");
  }

  async load(): Promise<TokenData | null> {
    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(content) as TokenData;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch {
      // File doesn't exist, that's fine
    }
  }

  static isExpired(tokens: TokenData): boolean {
    return Date.now() >= tokens.expiresAt;
  }

  static isExpiringSoon(tokens: TokenData, bufferMs: number = 300000): boolean {
    return Date.now() >= tokens.expiresAt - bufferMs;
  }
}
```

**Step 7: Run token store tests**

Run: `npx vitest run tests/unit/auth/token-store.test.ts`
Expected: PASS.

**Step 8: Implement callback server**

```typescript
// src/auth/callback-server.ts
import http from "node:http";
import { URL } from "node:url";

export interface AuthCallbackResult {
  code: string;
  state: string;
}

export function startCallbackServer(
  port: number,
  expectedState: string
): Promise<AuthCallbackResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${port}`);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        const errorDescription = url.searchParams.get("error_description") || error;
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<html><body><h1>Authentication Failed</h1><p>${errorDescription}</p></body></html>`);
        server.close();
        reject(new Error(`OAuth error: ${errorDescription}`));
        return;
      }

      if (!code || !state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<html><body><h1>Missing code or state parameter</h1></body></html>");
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<html><body><h1>State mismatch - possible CSRF attack</h1></body></html>");
        server.close();
        reject(new Error("OAuth state mismatch"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<html><body><h1>Authentication Successful</h1><p>You can close this window and return to your terminal.</p></body></html>"
      );
      server.close();
      resolve({ code, state });
    });

    server.listen(port, "127.0.0.1");
    server.on("error", reject);

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("OAuth callback timed out after 5 minutes"));
    }, 300000);
  });
}
```

**Step 9: Implement OAuth orchestrator**

```typescript
// src/auth/oauth.ts
import crypto from "node:crypto";
import { type BcConfig } from "../config.js";
import { generateCodeVerifier, generateCodeChallenge } from "./pkce.js";
import { startCallbackServer } from "./callback-server.js";
import { TokenStore, type TokenData } from "./token-store.js";
import os from "node:os";
import path from "node:path";

export class OAuthClient {
  private config: BcConfig;
  private tokenStore: TokenStore;

  constructor(config: BcConfig) {
    this.config = config;
    const storePath = path.join(os.homedir(), ".bc-agent");
    this.tokenStore = new TokenStore(storePath);
  }

  async getAccessToken(): Promise<string> {
    const tokens = await this.tokenStore.load();

    if (tokens && !TokenStore.isExpired(tokens)) {
      if (TokenStore.isExpiringSoon(tokens)) {
        try {
          const refreshed = await this.refreshAccessToken(tokens.refreshToken);
          return refreshed.accessToken;
        } catch {
          // Refresh failed, but token still valid
          return tokens.accessToken;
        }
      }
      return tokens.accessToken;
    }

    if (tokens?.refreshToken) {
      try {
        const refreshed = await this.refreshAccessToken(tokens.refreshToken);
        return refreshed.accessToken;
      } catch {
        // Refresh failed, need full re-auth
      }
    }

    const newTokens = await this.authenticate();
    return newTokens.accessToken;
  }

  async authenticate(): Promise<TokenData> {
    const state = crypto.randomBytes(16).toString("hex");
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const redirectUri = `http://localhost:${this.config.redirectPort}/callback`;

    const authUrl = new URL(this.config.authUrl);
    authUrl.searchParams.set("client_id", this.config.clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", this.config.scopes.join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    // Start callback server before opening browser
    const callbackPromise = startCallbackServer(this.config.redirectPort, state);

    // Open browser for user authentication
    console.error(`\nPlease authenticate in your browser:\n${authUrl.toString()}\n`);
    try {
      const open = (await import("open")).default;
      await open(authUrl.toString());
    } catch {
      console.error("Could not open browser automatically. Please open the URL above manually.");
    }

    // Wait for callback
    const { code } = await callbackPromise;

    // Exchange code for tokens
    const tokenResponse = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorBody}`);
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const tokens: TokenData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    await this.tokenStore.save(tokens);
    return tokens;
  }

  private async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: this.config.scopes.join(" "),
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const tokens: TokenData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    await this.tokenStore.save(tokens);
    return tokens;
  }
}
```

**Step 10: Run all auth tests**

Run: `npx vitest run tests/unit/auth/`
Expected: All tests PASS.

**Step 11: Commit**

```bash
git add src/auth/ tests/unit/auth/
git commit -m "feat: add OAuth 2.0 Authorization Code + PKCE authentication"
```

---

## Task 4: Rate Limiter

**Files:**
- Create: `src/client/rate-limiter.ts`
- Create: `tests/unit/client/rate-limiter.test.ts`

**Step 1: Write failing tests**

```typescript
// tests/unit/client/rate-limiter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimiter } from "../../../src/client/rate-limiter.js";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should allow requests within limits", async () => {
    const limiter = new RateLimiter({ maxConcurrent: 5, maxPerWindow: 100, windowMs: 60000 });
    const result = await limiter.execute(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("should track concurrent requests", async () => {
    const limiter = new RateLimiter({ maxConcurrent: 2, maxPerWindow: 100, windowMs: 60000 });

    let running = 0;
    let maxRunning = 0;

    const task = async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 100));
      running--;
      return "done";
    };

    vi.useRealTimers();
    const results = await Promise.all([
      limiter.execute(task),
      limiter.execute(task),
      limiter.execute(task),
    ]);

    expect(results).toEqual(["done", "done", "done"]);
    expect(maxRunning).toBeLessThanOrEqual(2);
  });

  it("should calculate exponential backoff with jitter", () => {
    const delay = RateLimiter.calculateBackoff(0);
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(2000);

    const delay2 = RateLimiter.calculateBackoff(3);
    expect(delay2).toBeGreaterThanOrEqual(8000);
    expect(delay2).toBeLessThanOrEqual(16000);
  });

  it("should cap backoff at max delay", () => {
    const delay = RateLimiter.calculateBackoff(10, 30000);
    expect(delay).toBeLessThanOrEqual(30000);
  });
});
```

**Step 2: Run to verify fail**

Run: `npx vitest run tests/unit/client/rate-limiter.test.ts`
Expected: FAIL.

**Step 3: Implement rate limiter**

```typescript
// src/client/rate-limiter.ts
export interface RateLimiterOptions {
  maxConcurrent: number;
  maxPerWindow: number;
  windowMs: number;
}

export class RateLimiter {
  private concurrent = 0;
  private queue: Array<() => void> = [];
  private windowRequests: number[] = [];
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    this.concurrent++;
    this.windowRequests.push(Date.now());
    try {
      return await fn();
    } finally {
      this.concurrent--;
      this.releaseNext();
    }
  }

  private async waitForSlot(): Promise<void> {
    // Clean old window entries
    const now = Date.now();
    this.windowRequests = this.windowRequests.filter(
      (t) => now - t < this.options.windowMs
    );

    // Wait if at concurrent limit
    if (this.concurrent >= this.options.maxConcurrent) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    // Wait if at window rate limit
    if (this.windowRequests.length >= this.options.maxPerWindow) {
      const oldest = this.windowRequests[0];
      const waitMs = oldest + this.options.windowMs - Date.now();
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  private releaseNext(): void {
    const next = this.queue.shift();
    if (next) next();
  }

  static calculateBackoff(attempt: number, maxDelayMs: number = 30000): number {
    const baseDelay = 1000;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * baseDelay;
    return Math.min(exponentialDelay + jitter, maxDelayMs);
  }
}
```

**Step 4: Run tests**

Run: `npx vitest run tests/unit/client/rate-limiter.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/client/rate-limiter.ts tests/unit/client/rate-limiter.test.ts
git commit -m "feat: add rate limiter with exponential backoff and jitter"
```

---

## Task 5: OData Query Builder

**Files:**
- Create: `src/client/odata-query.ts`
- Create: `tests/unit/client/odata-query.test.ts`

**Step 1: Write failing tests**

```typescript
// tests/unit/client/odata-query.test.ts
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
    const builder = new ODataQueryBuilder()
      .expand(["salesOrderLines($filter=quantity gt 10)"]);
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

  it("should URL-encode filter values", () => {
    const builder = new ODataQueryBuilder().filter("displayName eq 'O''Brien'");
    const query = builder.build();
    expect(query).toContain("$filter=");
  });
});
```

**Step 2: Run to verify fail**

Run: `npx vitest run tests/unit/client/odata-query.test.ts`
Expected: FAIL.

**Step 3: Implement OData query builder**

```typescript
// src/client/odata-query.ts
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
```

**Step 4: Run tests**

Run: `npx vitest run tests/unit/client/odata-query.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/client/odata-query.ts tests/unit/client/odata-query.test.ts
git commit -m "feat: add OData query builder with filter, select, expand, pagination"
```

---

## Task 6: Error Handler

**Files:**
- Create: `src/client/error-handler.ts`
- Create: `tests/unit/client/error-handler.test.ts`

**Step 1: Write failing tests**

```typescript
// tests/unit/client/error-handler.test.ts
import { describe, it, expect } from "vitest";
import { BcError, parseBcError } from "../../../src/client/error-handler.js";

describe("parseBcError", () => {
  it("should parse BC validation error", () => {
    const errorBody = {
      error: {
        code: "BadRequest_InvalidFieldValue",
        message: "'Invalid Type' is not an option. The existing options are: Inventory,Service,Non-Inventory",
      },
    };
    const err = parseBcError(400, errorBody);
    expect(err).toBeInstanceOf(BcError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BadRequest_InvalidFieldValue");
    expect(err.message).toContain("Invalid Type");
    expect(err.isRetryable).toBe(false);
  });

  it("should identify 429 as retryable", () => {
    const errorBody = { error: { code: "TooManyRequests", message: "Rate limited" } };
    const err = parseBcError(429, errorBody);
    expect(err.isRetryable).toBe(true);
  });

  it("should identify 503 as retryable", () => {
    const errorBody = { error: { code: "ServiceUnavailable", message: "Try later" } };
    const err = parseBcError(503, errorBody);
    expect(err.isRetryable).toBe(true);
  });

  it("should identify 404 as not retryable", () => {
    const errorBody = { error: { code: "NotFound", message: "Entity not found" } };
    const err = parseBcError(404, errorBody);
    expect(err.isRetryable).toBe(false);
    expect(err.userMessage).toContain("not found");
  });

  it("should handle 409 concurrency conflict", () => {
    const errorBody = { error: { code: "Conflict", message: "Record modified by another user" } };
    const err = parseBcError(409, errorBody);
    expect(err.isRetryable).toBe(false);
    expect(err.userMessage).toContain("modified");
  });

  it("should handle non-standard error format", () => {
    const errorBody = "Something went wrong";
    const err = parseBcError(500, errorBody);
    expect(err).toBeInstanceOf(BcError);
    expect(err.statusCode).toBe(500);
  });
});
```

**Step 2: Run to verify fail, then implement**

```typescript
// src/client/error-handler.ts
export class BcError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public userMessage: string,
    public isRetryable: boolean
  ) {
    super(message);
    this.name = "BcError";
  }
}

interface BcErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export function parseBcError(statusCode: number, body: unknown): BcError {
  const errorBody = body as BcErrorBody;
  const code = errorBody?.error?.code || `HTTP_${statusCode}`;
  const message = errorBody?.error?.message || String(body);
  const isRetryable = RETRYABLE_STATUS_CODES.has(statusCode);

  let userMessage: string;
  switch (statusCode) {
    case 400:
      userMessage = `Validation error: ${message}`;
      break;
    case 401:
      userMessage = "Authentication failed. Please re-authenticate with Business Central.";
      break;
    case 403:
      userMessage = "Access denied. Your account does not have permission for this operation.";
      break;
    case 404:
      userMessage = `Resource not found: ${message}. Verify the ID exists and you have access.`;
      break;
    case 409:
      userMessage = `Concurrency conflict: The record was modified by another user. Please re-fetch and try again. Details: ${message}`;
      break;
    case 429:
      userMessage = "Rate limit exceeded. The request will be retried automatically.";
      break;
    case 504:
      userMessage = "Request timed out. Try a smaller query with $filter or $top to reduce data.";
      break;
    default:
      userMessage = `Business Central error (${statusCode}): ${message}`;
  }

  return new BcError(statusCode, code, message, userMessage, isRetryable);
}
```

**Step 3: Run tests, commit**

Run: `npx vitest run tests/unit/client/error-handler.test.ts`
Expected: PASS.

```bash
git add src/client/error-handler.ts tests/unit/client/error-handler.test.ts
git commit -m "feat: add BC error handler with user-friendly messages and retry classification"
```

---

## Task 7: Business Central HTTP Client

**Files:**
- Create: `src/client/bc-client.ts`
- Create: `tests/unit/client/bc-client.test.ts`
- Create: `tests/fixtures/entity-responses/customers.json`

**Step 1: Write tests with mocked fetch**

```typescript
// tests/unit/client/bc-client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BcClient, type BcListResponse } from "../../../src/client/bc-client.js";
import type { BcConfig } from "../../../src/config.js";
import type { OAuthClient } from "../../../src/auth/oauth.js";

const mockConfig: BcConfig = {
  tenantId: "test",
  environment: "sandbox",
  clientId: "test",
  redirectPort: 3847,
  apiVersion: "v2.0",
  baseUrl: "https://api.businesscentral.dynamics.com/v2.0/test/sandbox/api/v2.0",
  authUrl: "",
  tokenUrl: "",
  maxPageSize: 50,
  maxRetries: 3,
  requestTimeoutMs: 480000,
  scopes: [],
};

function createMockAuth(): OAuthClient {
  return {
    getAccessToken: vi.fn().mockResolvedValue("test-token"),
    authenticate: vi.fn(),
  } as unknown as OAuthClient;
}

describe("BcClient", () => {
  let client: BcClient;
  let mockAuth: OAuthClient;

  beforeEach(() => {
    mockAuth = createMockAuth();
    client = new BcClient(mockConfig, mockAuth);
    vi.restoreAllMocks();
  });

  it("should construct correct URL for entity list", () => {
    const url = client.buildUrl("companies(abc-123)/customers");
    expect(url).toBe(
      "https://api.businesscentral.dynamics.com/v2.0/test/sandbox/api/v2.0/companies(abc-123)/customers"
    );
  });

  it("should include authorization header in requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: [] }), { status: 200 })
    );

    await client.list("companies(abc-123)/customers");

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("should handle paginated responses with @odata.nextLink", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          value: [{ id: "1", displayName: "Customer 1" }],
          "@odata.nextLink": "https://api.businesscentral.dynamics.com/next-page",
          "@odata.count": 100,
        }),
        { status: 200 }
      )
    );

    const result = await client.list("companies(abc-123)/customers");

    expect(result.value).toHaveLength(1);
    expect(result.nextLink).toBe("https://api.businesscentral.dynamics.com/next-page");
    expect(result.count).toBe(100);
  });

  it("should retry on 429 with backoff", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "TooManyRequests", message: "Rate limited" } }), {
          status: 429,
          headers: { "Retry-After": "1" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: [{ id: "1" }] }), { status: 200 })
      );

    const result = await client.list("companies(abc-123)/customers");
    expect(result.value).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: Create test fixture**

```json
// tests/fixtures/entity-responses/customers.json
{
  "@odata.context": "https://api.businesscentral.dynamics.com/v2.0/test/sandbox/api/v2.0/$metadata#companies(abc-123)/customers",
  "value": [
    {
      "id": "cust-001",
      "number": "10000",
      "displayName": "Adatum Corporation",
      "type": "Company",
      "addressLine1": "192 Market Square",
      "city": "Atlanta",
      "state": "GA",
      "country": "US",
      "postalCode": "31772",
      "phoneNumber": "555-0100",
      "email": "robert.townes@contoso.com",
      "balanceDue": 4757.87,
      "creditLimit": 100300,
      "taxLiable": true,
      "currencyCode": "USD",
      "blocked": " ",
      "lastModifiedDateTime": "2024-01-15T10:30:00Z"
    }
  ],
  "@odata.count": 1
}
```

**Step 3: Implement BC client**

```typescript
// src/client/bc-client.ts
import { type BcConfig } from "../config.js";
import { type OAuthClient } from "../auth/oauth.js";
import { ODataQueryBuilder } from "./odata-query.js";
import { RateLimiter } from "./rate-limiter.js";
import { parseBcError, BcError } from "./error-handler.js";

export interface BcListResponse<T = Record<string, unknown>> {
  value: T[];
  nextLink?: string;
  count?: number;
  context?: string;
}

export class BcClient {
  private config: BcConfig;
  private auth: OAuthClient;
  private rateLimiter: RateLimiter;
  private companyId: string | null = null;

  constructor(config: BcConfig, auth: OAuthClient) {
    this.config = config;
    this.auth = auth;
    this.rateLimiter = new RateLimiter({
      maxConcurrent: 5,
      maxPerWindow: 6000,
      windowMs: 300000, // 5 minutes
    });
  }

  setCompany(companyId: string): void {
    this.companyId = companyId;
  }

  getCompanyPath(): string {
    if (!this.companyId) {
      throw new BcError(400, "NoCompany", "No company selected", "Please select a company first using bc_select_company.", false);
    }
    return `companies(${this.companyId})`;
  }

  buildUrl(path: string, query?: ODataQueryBuilder): string {
    const queryString = query?.build() || "";
    return `${this.config.baseUrl}/${path}${queryString}`;
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      query?: ODataQueryBuilder;
      body?: unknown;
      etag?: string;
      rawUrl?: string;
    } = {}
  ): Promise<T> {
    return this.rateLimiter.execute(async () => {
      return this.requestWithRetry<T>(method, path, options, 0);
    });
  }

  private async requestWithRetry<T>(
    method: string,
    path: string,
    options: {
      query?: ODataQueryBuilder;
      body?: unknown;
      etag?: string;
      rawUrl?: string;
    },
    attempt: number
  ): Promise<T> {
    const token = await this.auth.getAccessToken();
    const url = options.rawUrl || this.buildUrl(path, options.query);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (options.etag) {
      headers["If-Match"] = options.etag;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.requestTimeoutMs),
    };

    if (options.body && (method === "POST" || method === "PATCH")) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    if (response.ok) {
      if (response.status === 204) {
        return undefined as T;
      }
      return (await response.json()) as T;
    }

    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const error = parseBcError(response.status, errorBody);

    if (error.isRetryable && attempt < this.config.maxRetries) {
      const retryAfter = response.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : RateLimiter.calculateBackoff(attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return this.requestWithRetry<T>(method, path, options, attempt + 1);
    }

    throw error;
  }

  async list<T = Record<string, unknown>>(
    path: string,
    query?: ODataQueryBuilder
  ): Promise<BcListResponse<T>> {
    const result = await this.request<{
      value: T[];
      "@odata.nextLink"?: string;
      "@odata.count"?: number;
      "@odata.context"?: string;
    }>("GET", path, { query });

    return {
      value: result.value,
      nextLink: result["@odata.nextLink"],
      count: result["@odata.count"],
      context: result["@odata.context"],
    };
  }

  async listNextPage<T = Record<string, unknown>>(
    nextLink: string
  ): Promise<BcListResponse<T>> {
    const result = await this.request<{
      value: T[];
      "@odata.nextLink"?: string;
      "@odata.count"?: number;
    }>("GET", "", { rawUrl: nextLink });

    return {
      value: result.value,
      nextLink: result["@odata.nextLink"],
      count: result["@odata.count"],
    };
  }

  async get<T = Record<string, unknown>>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async create<T = Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  async update<T = Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>,
    etag: string = "*"
  ): Promise<T> {
    return this.request<T>("PATCH", path, { body, etag });
  }

  async delete(path: string, etag: string = "*"): Promise<void> {
    await this.request<void>("DELETE", path, { etag });
  }

  async action(path: string, body?: Record<string, unknown>): Promise<void> {
    await this.request<void>("POST", path, { body });
  }

  async count(path: string, filter?: string): Promise<number> {
    const query = new ODataQueryBuilder().top(0).count();
    if (filter) query.filter(filter);
    const result = await this.request<{ "@odata.count": number }>("GET", path, { query });
    return result["@odata.count"];
  }

  async listCompanies(): Promise<Array<{ id: string; name: string; displayName: string }>> {
    const result = await this.list<{ id: string; name: string; displayName: string }>("companies");
    return result.value;
  }
}
```

**Step 4: Run tests**

Run: `npx vitest run tests/unit/client/bc-client.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/client/ tests/unit/client/bc-client.test.ts tests/fixtures/
git commit -m "feat: add Business Central HTTP client with retry, pagination, and CRUD operations"
```

---

## Task 8: Smart Data Truncation and Formatting

**Files:**
- Create: `src/utils/truncation.ts`
- Create: `src/utils/formatting.ts`
- Create: `tests/unit/utils/truncation.test.ts`
- Create: `tests/unit/utils/formatting.test.ts`

**Step 1: Write truncation tests**

```typescript
// tests/unit/utils/truncation.test.ts
import { describe, it, expect } from "vitest";
import { smartTruncate, type TruncationResult } from "../../src/utils/truncation.js";

describe("smartTruncate", () => {
  it("should return all rows when count <= threshold", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: `${i}`, name: `Item ${i}` }));
    const result = smartTruncate(rows, { totalCount: 10, pageSize: 50, threshold: 50 });
    expect(result.mode).toBe("full");
    expect(result.rows).toHaveLength(10);
  });

  it("should paginate when count is between threshold and largeThreshold", () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: `${i}`, name: `Item ${i}` }));
    const result = smartTruncate(rows, { totalCount: 200, pageSize: 50, threshold: 50, largeThreshold: 500 });
    expect(result.mode).toBe("paginated");
    expect(result.rows.length).toBeLessThanOrEqual(50);
    expect(result.metadata?.totalCount).toBe(200);
    expect(result.metadata?.hasMore).toBe(true);
  });

  it("should summarize when count > largeThreshold", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ id: `${i}`, name: `Item ${i}`, city: i % 2 === 0 ? "Oslo" : "Bergen" }));
    const result = smartTruncate(rows, { totalCount: 5000, pageSize: 50, threshold: 50, largeThreshold: 500 });
    expect(result.mode).toBe("summarized");
    expect(result.rows.length).toBeLessThanOrEqual(20);
    expect(result.metadata?.totalCount).toBe(5000);
    expect(result.summary).toBeDefined();
  });

  it("should truncate long string values", () => {
    const rows = [{ id: "1", description: "A".repeat(500) }];
    const result = smartTruncate(rows, { totalCount: 1, pageSize: 50, threshold: 50, maxStringLength: 200 });
    expect(result.rows[0].description.length).toBeLessThanOrEqual(203); // 200 + "..."
  });
});
```

**Step 2: Implement truncation**

```typescript
// src/utils/truncation.ts
export interface TruncationOptions {
  totalCount: number;
  pageSize: number;
  threshold?: number;
  largeThreshold?: number;
  maxStringLength?: number;
}

export interface TruncationMetadata {
  totalCount: number;
  returnedCount: number;
  hasMore: boolean;
  nextPageHint?: string;
}

export interface TruncationResult {
  mode: "full" | "paginated" | "summarized";
  rows: Record<string, unknown>[];
  metadata?: TruncationMetadata;
  summary?: string;
}

export function smartTruncate(
  rows: Record<string, unknown>[],
  options: TruncationOptions
): TruncationResult {
  const threshold = options.threshold ?? 50;
  const largeThreshold = options.largeThreshold ?? 500;
  const maxStringLength = options.maxStringLength ?? 200;

  // Truncate long strings in all rows
  const truncatedRows = rows.map((row) => truncateStrings(row, maxStringLength));

  if (options.totalCount <= threshold) {
    return { mode: "full", rows: truncatedRows };
  }

  if (options.totalCount <= largeThreshold) {
    const pagedRows = truncatedRows.slice(0, options.pageSize);
    return {
      mode: "paginated",
      rows: pagedRows,
      metadata: {
        totalCount: options.totalCount,
        returnedCount: pagedRows.length,
        hasMore: options.totalCount > pagedRows.length,
        nextPageHint: `Use $skip=${pagedRows.length} to get the next page.`,
      },
    };
  }

  // Large dataset — return summary + first few rows
  const previewRows = truncatedRows.slice(0, 20);
  const summary = generateSummary(truncatedRows, options.totalCount);
  return {
    mode: "summarized",
    rows: previewRows,
    metadata: {
      totalCount: options.totalCount,
      returnedCount: previewRows.length,
      hasMore: true,
      nextPageHint: "Use $filter to narrow results before fetching more data.",
    },
    summary,
  };
}

function truncateStrings(
  obj: Record<string, unknown>,
  maxLength: number
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > maxLength) {
      result[key] = value.substring(0, maxLength) + "...";
    } else {
      result[key] = value;
    }
  }
  return result;
}

function generateSummary(rows: Record<string, unknown>[], totalCount: number): string {
  const fields = Object.keys(rows[0] || {});
  const lines: string[] = [`Total records: ${totalCount}`, `Fields: ${fields.join(", ")}`];

  // Try to find groupable string fields
  for (const field of fields) {
    const values = rows.map((r) => r[field]).filter((v) => typeof v === "string");
    if (values.length > 0) {
      const counts = new Map<string, number>();
      for (const v of values as string[]) {
        counts.set(v, (counts.get(v) || 0) + 1);
      }
      if (counts.size > 1 && counts.size <= 20) {
        const distribution = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k}(${v})`)
          .join(", ");
        lines.push(`${field} distribution (sample): ${distribution}`);
      }
    }
  }

  return lines.join("\n");
}
```

**Step 3: Write formatting tests and implement**

```typescript
// tests/unit/utils/formatting.test.ts
import { describe, it, expect } from "vitest";
import { formatToolResponse, formatListResponse } from "../../src/utils/formatting.js";

describe("formatToolResponse", () => {
  it("should format a single entity as readable text", () => {
    const entity = { id: "abc-123", displayName: "Contoso", city: "Oslo", balanceDue: 5000 };
    const result = formatToolResponse(entity, "customer");
    expect(result).toContain("Contoso");
    expect(result).toContain("Oslo");
  });

  it("should format list response with metadata", () => {
    const result = formatListResponse(
      [{ id: "1", displayName: "A" }, { id: "2", displayName: "B" }],
      { mode: "paginated", totalCount: 100, returnedCount: 2, hasMore: true }
    );
    expect(result).toContain("Showing 2 of 100");
    expect(result).toContain("displayName");
  });
});
```

```typescript
// src/utils/formatting.ts
export function formatToolResponse(
  entity: Record<string, unknown>,
  entityType: string
): string {
  const lines: string[] = [`--- ${entityType} ---`];
  for (const [key, value] of Object.entries(entity)) {
    if (value !== null && value !== undefined && value !== "") {
      lines.push(`${key}: ${formatValue(value)}`);
    }
  }
  return lines.join("\n");
}

export function formatListResponse(
  rows: Record<string, unknown>[],
  meta?: { mode: string; totalCount: number; returnedCount: number; hasMore: boolean; summary?: string }
): string {
  if (rows.length === 0) {
    return "No records found.";
  }

  const lines: string[] = [];

  if (meta) {
    lines.push(`Showing ${meta.returnedCount} of ${meta.totalCount} records.`);
    if (meta.hasMore) {
      lines.push("Use $filter, $top, or $skip to navigate more data.\n");
    }
    if (meta.summary) {
      lines.push(meta.summary + "\n");
    }
  }

  // Format as a simple table
  const keys = Object.keys(rows[0]);
  lines.push(keys.join(" | "));
  lines.push(keys.map(() => "---").join(" | "));
  for (const row of rows) {
    lines.push(keys.map((k) => formatValue(row[k])).join(" | "));
  }

  return lines.join("\n");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
```

**Step 4: Run tests, commit**

Run: `npx vitest run tests/unit/utils/`
Expected: PASS.

```bash
git add src/utils/ tests/unit/utils/
git commit -m "feat: add smart truncation and formatting for context-window-aware responses"
```

---

## Task 9: Entity Type System and Registry

**Files:**
- Create: `src/entities/entity-types.ts`
- Create: `src/entities/registry.ts`
- Create: `tests/unit/entities/registry.test.ts`

**Step 1: Write entity type definitions**

```typescript
// src/entities/entity-types.ts
export type FieldType = "string" | "number" | "boolean" | "date" | "datetime" | "guid" | "decimal" | "enum";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  readOnly?: boolean;
  required?: boolean;
  description: string;
  enumValues?: string[];
  maxLength?: number;
}

export interface NavigationProperty {
  name: string;
  targetEntity: string;
  isCollection: boolean;
  description: string;
}

export interface BoundAction {
  name: string;
  description: string;
  httpMethod: "POST";
  navPath: string; // e.g. "Microsoft.NAV.post"
  hasRequestBody?: boolean;
}

export interface EntityDefinition {
  name: string;
  pluralName: string;
  apiPath: string; // e.g. "customers"
  description: string;
  fields: FieldDefinition[];
  navigationProperties: NavigationProperty[];
  boundActions: BoundAction[];
  isReadOnly?: boolean;
  parentEntity?: string; // for sub-entities like salesOrderLines -> salesOrders
  parentNavigationProperty?: string;
}
```

**Step 2: Write registry tests**

```typescript
// tests/unit/entities/registry.test.ts
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
    expect(writable).toHaveLength(1);
    expect(writable[0].name).toBe("displayName");
  });

  it("should get required fields", () => {
    const registry = new EntityRegistry();
    registry.register(testEntity);
    const required = registry.getRequiredFields("customer");
    expect(required).toHaveLength(1);
    expect(required[0].name).toBe("displayName");
  });
});
```

**Step 3: Implement registry**

```typescript
// src/entities/registry.ts
import type { EntityDefinition, FieldDefinition } from "./entity-types.js";

export class EntityRegistry {
  private entities = new Map<string, EntityDefinition>();

  register(entity: EntityDefinition): void {
    this.entities.set(entity.name, entity);
  }

  get(name: string): EntityDefinition | undefined {
    return this.entities.get(name);
  }

  getByPluralName(pluralName: string): EntityDefinition | undefined {
    for (const entity of this.entities.values()) {
      if (entity.pluralName === pluralName) return entity;
    }
    return undefined;
  }

  listAll(): EntityDefinition[] {
    return [...this.entities.values()];
  }

  getWritableFields(name: string): FieldDefinition[] {
    const entity = this.entities.get(name);
    if (!entity) return [];
    return entity.fields.filter((f) => !f.readOnly);
  }

  getRequiredFields(name: string): FieldDefinition[] {
    const entity = this.entities.get(name);
    if (!entity) return [];
    return entity.fields.filter((f) => f.required);
  }

  getFilterableFields(name: string): FieldDefinition[] {
    const entity = this.entities.get(name);
    if (!entity) return [];
    return entity.fields.filter((f) => f.type !== "guid" || f.name === "id");
  }
}
```

**Step 4: Run tests, commit**

Run: `npx vitest run tests/unit/entities/registry.test.ts`
Expected: PASS.

```bash
git add src/entities/entity-types.ts src/entities/registry.ts tests/unit/entities/registry.test.ts
git commit -m "feat: add entity type system and registry"
```

---

## Task 10: Static Entity Definitions (All ~35 Standard Entities)

**Files:**
- Create: `src/entities/definitions/customers.ts`
- Create: `src/entities/definitions/vendors.ts`
- Create: `src/entities/definitions/items.ts`
- Create: `src/entities/definitions/sales-orders.ts`
- Create: `src/entities/definitions/sales-order-lines.ts`
- Create: `src/entities/definitions/sales-invoices.ts`
- Create: `src/entities/definitions/sales-invoice-lines.ts`
- Create: `src/entities/definitions/sales-quotes.ts`
- Create: `src/entities/definitions/sales-quote-lines.ts`
- Create: `src/entities/definitions/sales-credit-memos.ts`
- Create: `src/entities/definitions/sales-credit-memo-lines.ts`
- Create: `src/entities/definitions/purchase-orders.ts`
- Create: `src/entities/definitions/purchase-order-lines.ts`
- Create: `src/entities/definitions/purchase-invoices.ts`
- Create: `src/entities/definitions/purchase-invoice-lines.ts`
- Create: `src/entities/definitions/general-ledger-entries.ts`
- Create: `src/entities/definitions/journals.ts`
- Create: `src/entities/definitions/journal-lines.ts`
- Create: `src/entities/definitions/accounts.ts`
- Create: `src/entities/definitions/dimensions.ts`
- Create: `src/entities/definitions/dimension-values.ts`
- Create: `src/entities/definitions/employees.ts`
- Create: `src/entities/definitions/currencies.ts`
- Create: `src/entities/definitions/payment-terms.ts`
- Create: `src/entities/definitions/payment-methods.ts`
- Create: `src/entities/definitions/shipment-methods.ts`
- Create: `src/entities/definitions/units-of-measure.ts`
- Create: `src/entities/definitions/item-categories.ts`
- Create: `src/entities/definitions/countries-regions.ts`
- Create: `src/entities/definitions/company-information.ts`
- Create: `src/entities/definitions/tax-groups.ts`
- Create: `src/entities/definitions/contacts.ts`
- Create: `src/entities/definitions/bank-accounts.ts`
- Create: `src/entities/definitions/aged-accounts-receivable.ts`
- Create: `src/entities/definitions/aged-accounts-payable.ts`
- Create: `src/entities/definitions/index.ts`

Each entity definition file follows this exact pattern (example for customers — all others follow the same structure with their respective fields from the BC API v2.0 docs):

```typescript
// src/entities/definitions/customers.ts
import type { EntityDefinition } from "../entity-types.js";

export const customerEntity: EntityDefinition = {
  name: "customer",
  pluralName: "customers",
  apiPath: "customers",
  description: "Represents a customer (debtor) in Business Central. Customers have sales documents, outstanding balances, and payment history.",
  fields: [
    { name: "id", type: "guid", readOnly: true, description: "Unique ID of the customer." },
    { name: "number", type: "string", description: "Customer number (e.g. '10000')." },
    { name: "displayName", type: "string", required: true, description: "Customer name. Appears on all sales documents." },
    { name: "type", type: "enum", enumValues: ["Company", "Person"], description: "Contact type." },
    { name: "addressLine1", type: "string", description: "Primary address line." },
    { name: "addressLine2", type: "string", description: "Secondary address line." },
    { name: "city", type: "string", description: "City." },
    { name: "state", type: "string", description: "State/province." },
    { name: "country", type: "string", description: "Country/region code." },
    { name: "postalCode", type: "string", description: "Postal/ZIP code." },
    { name: "phoneNumber", type: "string", description: "Phone number." },
    { name: "email", type: "string", description: "Email address." },
    { name: "website", type: "string", description: "Website URL." },
    { name: "salespersonCode", type: "string", description: "Assigned salesperson code." },
    { name: "balanceDue", type: "decimal", readOnly: true, description: "Total outstanding balance." },
    { name: "creditLimit", type: "decimal", description: "Credit limit." },
    { name: "taxLiable", type: "boolean", description: "Whether customer is tax liable." },
    { name: "taxAreaId", type: "guid", description: "Tax area ID." },
    { name: "taxAreaDisplayName", type: "string", readOnly: true, description: "Tax area name." },
    { name: "taxRegistrationNumber", type: "string", description: "Tax/VAT registration number." },
    { name: "currencyId", type: "guid", description: "Currency ID." },
    { name: "currencyCode", type: "string", description: "Currency code (e.g. 'USD', 'NOK')." },
    { name: "paymentTermsId", type: "guid", description: "Payment terms ID." },
    { name: "shipmentMethodId", type: "guid", description: "Shipment method ID." },
    { name: "paymentMethodId", type: "guid", description: "Payment method ID." },
    { name: "blocked", type: "enum", enumValues: [" ", "Ship", "Invoice", "All"], description: "Blocked status. Empty means not blocked." },
    { name: "lastModifiedDateTime", type: "datetime", readOnly: true, description: "Last modification timestamp." },
  ],
  navigationProperties: [
    { name: "currency", targetEntity: "currency", isCollection: false, description: "Customer's currency." },
    { name: "paymentTerm", targetEntity: "paymentTerm", isCollection: false, description: "Payment terms." },
    { name: "shipmentMethod", targetEntity: "shipmentMethod", isCollection: false, description: "Shipment method." },
    { name: "paymentMethod", targetEntity: "paymentMethod", isCollection: false, description: "Payment method." },
    { name: "customerFinancialDetail", targetEntity: "customerFinancialDetail", isCollection: false, description: "Financial details." },
    { name: "picture", targetEntity: "picture", isCollection: false, description: "Customer picture." },
    { name: "defaultDimensions", targetEntity: "defaultDimension", isCollection: true, description: "Default dimensions." },
    { name: "agedAccountsReceivable", targetEntity: "agedAccountsReceivable", isCollection: false, description: "Aged receivables." },
    { name: "contactsInformation", targetEntity: "contactInformation", isCollection: true, description: "Contact information." },
  ],
  boundActions: [],
};
```

**For all other entities**: Follow the same pattern. Reference the BC API v2.0 documentation at `https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/resources/dynamics_{entityName}` for the exact fields, types, navigation properties, and bound actions for each entity.

Key entities with bound actions:
- **salesInvoice**: `post`, `postAndSend`, `send`, `cancel`, `cancelAndSend`, `makeCorrectiveCreditMemo`
- **salesOrder**: `shipAndInvoice`
- **salesQuote**: `makeInvoice`, `makeOrder`, `send`
- **salesCreditMemo**: `post`, `postAndSend`, `send`, `cancel`, `cancelAndSend`
- **purchaseInvoice**: `post`

**Index file:**

```typescript
// src/entities/definitions/index.ts
export { customerEntity } from "./customers.js";
export { vendorEntity } from "./vendors.js";
export { itemEntity } from "./items.js";
// ... export all entities
// Import them all and export as array:
import { customerEntity } from "./customers.js";
import { vendorEntity } from "./vendors.js";
import { itemEntity } from "./items.js";
// ... all imports

export const allStandardEntities = [
  customerEntity,
  vendorEntity,
  itemEntity,
  // ... all entities
];
```

**Commit after every 5-7 entity files:**

```bash
git add src/entities/definitions/
git commit -m "feat: add static entity definitions for all BC API v2.0 standard entities"
```

---

## Task 11: Tool Generator

**Files:**
- Create: `src/entities/tool-generator.ts`
- Create: `tests/unit/entities/tool-generator.test.ts`

**Step 1: Write failing tests**

```typescript
// tests/unit/entities/tool-generator.test.ts
import { describe, it, expect } from "vitest";
import { generateToolsForEntity, type GeneratedTool } from "../../../src/entities/tool-generator.js";
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
  ],
  navigationProperties: [
    { name: "paymentTerm", targetEntity: "paymentTerm", isCollection: false, description: "Payment terms" },
  ],
  boundActions: [
    { name: "post", description: "Post the document", httpMethod: "POST", navPath: "Microsoft.NAV.post" },
  ],
};

describe("generateToolsForEntity", () => {
  it("should generate list, get, create, update, delete tools", () => {
    const tools = generateToolsForEntity(testEntity);
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("bc_list_customers");
    expect(toolNames).toContain("bc_get_customer");
    expect(toolNames).toContain("bc_create_customer");
    expect(toolNames).toContain("bc_update_customer");
    expect(toolNames).toContain("bc_delete_customer");
    expect(toolNames).toContain("bc_count_customers");
  });

  it("should generate action tools for bound actions", () => {
    const tools = generateToolsForEntity(testEntity);
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("bc_post_customer");
  });

  it("should include $filter, $top, $skip, $expand, $select, $orderby in list tool schema", () => {
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

  it("should not generate create/update/delete for read-only entities", () => {
    const readOnlyEntity = { ...testEntity, isReadOnly: true };
    const tools = generateToolsForEntity(readOnlyEntity);
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain("bc_list_customers");
    expect(toolNames).toContain("bc_get_customer");
    expect(toolNames).not.toContain("bc_create_customer");
    expect(toolNames).not.toContain("bc_update_customer");
    expect(toolNames).not.toContain("bc_delete_customer");
  });

  it("should include AI-optimized description with field hints", () => {
    const tools = generateToolsForEntity(testEntity);
    const listTool = tools.find((t) => t.name === "bc_list_customers")!;
    expect(listTool.description).toContain("customer");
    expect(listTool.description.length).toBeGreaterThan(20);
  });
});
```

**Step 2: Implement tool generator**

```typescript
// src/entities/tool-generator.ts
import { z, type ZodTypeAny } from "zod";
import type { EntityDefinition, FieldDefinition, FieldType } from "./entity-types.js";

export interface GeneratedTool {
  name: string;
  description: string;
  inputSchema: Record<string, ZodTypeAny>;
  handler: string; // "list" | "get" | "create" | "update" | "delete" | "count" | "action"
  entityName: string;
  actionNavPath?: string;
}

function fieldTypeToZod(field: FieldDefinition): ZodTypeAny {
  const zodMap: Record<FieldType, () => ZodTypeAny> = {
    string: () => z.string(),
    number: () => z.number(),
    boolean: () => z.boolean(),
    date: () => z.string(),
    datetime: () => z.string(),
    guid: () => z.string(),
    decimal: () => z.number(),
    enum: () => field.enumValues ? z.enum(field.enumValues as [string, ...string[]]) : z.string(),
  };
  return (zodMap[field.type] || zodMap.string)().describe(field.description);
}

export function generateToolsForEntity(entity: EntityDefinition): GeneratedTool[] {
  const tools: GeneratedTool[] = [];

  // 1. List tool
  const expandableNames = entity.navigationProperties.map((n) => n.name);
  const filterableFieldNames = entity.fields
    .filter((f) => f.type !== "guid" || f.name === "id")
    .map((f) => f.name);

  tools.push({
    name: `bc_list_${entity.pluralName}`,
    description: `List ${entity.pluralName} from Business Central. ${entity.description} Filterable fields: ${filterableFieldNames.join(", ")}. Expandable: ${expandableNames.join(", ") || "none"}.`,
    inputSchema: {
      filter: z.string().optional().describe(`OData $filter expression. Examples: "displayName eq 'Contoso'", "balanceDue gt 1000", "lastModifiedDateTime gt 2024-01-01T00:00:00Z". Filterable fields: ${filterableFieldNames.join(", ")}`),
      select: z.string().optional().describe(`Comma-separated field names to return. Available: ${entity.fields.map((f) => f.name).join(", ")}`),
      expand: z.string().optional().describe(`Comma-separated navigation properties to expand. Available: ${expandableNames.join(", ") || "none"}`),
      top: z.number().optional().describe("Maximum number of records to return (default 50, max 20000)."),
      skip: z.number().optional().describe("Number of records to skip for pagination."),
      orderBy: z.string().optional().describe("Sort expression. Example: 'displayName asc' or 'balanceDue desc'."),
    },
    handler: "list",
    entityName: entity.name,
  });

  // 2. Get tool
  tools.push({
    name: `bc_get_${entity.name}`,
    description: `Get a single ${entity.name} by ID from Business Central. ${entity.description}`,
    inputSchema: {
      id: z.string().describe(`The unique GUID of the ${entity.name}.`),
      expand: z.string().optional().describe(`Comma-separated navigation properties to expand. Available: ${expandableNames.join(", ") || "none"}`),
    },
    handler: "get",
    entityName: entity.name,
  });

  // 3. Count tool
  tools.push({
    name: `bc_count_${entity.pluralName}`,
    description: `Count ${entity.pluralName} in Business Central, optionally with a filter.`,
    inputSchema: {
      filter: z.string().optional().describe(`OData $filter expression to count a subset.`),
    },
    handler: "count",
    entityName: entity.name,
  });

  // Only generate mutation tools for non-read-only entities
  if (!entity.isReadOnly) {
    // 4. Create tool
    const createSchema: Record<string, ZodTypeAny> = {};
    for (const field of entity.fields) {
      if (field.readOnly) continue;
      const zodField = fieldTypeToZod(field);
      createSchema[field.name] = field.required ? zodField : zodField.optional();
    }

    tools.push({
      name: `bc_create_${entity.name}`,
      description: `Create a new ${entity.name} in Business Central. Required fields: ${entity.fields.filter((f) => f.required).map((f) => f.name).join(", ") || "none"}.`,
      inputSchema: createSchema,
      handler: "create",
      entityName: entity.name,
    });

    // 5. Update tool
    const updateSchema: Record<string, ZodTypeAny> = {
      id: z.string().describe(`The unique GUID of the ${entity.name} to update.`),
    };
    for (const field of entity.fields) {
      if (field.readOnly || field.name === "id") continue;
      updateSchema[field.name] = fieldTypeToZod(field).optional();
    }

    tools.push({
      name: `bc_update_${entity.name}`,
      description: `Update an existing ${entity.name} in Business Central. Provide the ID and any fields to change.`,
      inputSchema: updateSchema,
      handler: "update",
      entityName: entity.name,
    });

    // 6. Delete tool
    tools.push({
      name: `bc_delete_${entity.name}`,
      description: `Delete a ${entity.name} from Business Central by ID. This action cannot be undone.`,
      inputSchema: {
        id: z.string().describe(`The unique GUID of the ${entity.name} to delete.`),
      },
      handler: "delete",
      entityName: entity.name,
    });
  }

  // 7. Bound action tools
  for (const action of entity.boundActions) {
    tools.push({
      name: `bc_${toSnakeCase(action.name)}_${entity.name}`,
      description: `${action.description} for a ${entity.name} in Business Central.`,
      inputSchema: {
        id: z.string().describe(`The unique GUID of the ${entity.name}.`),
      },
      handler: "action",
      entityName: entity.name,
      actionNavPath: action.navPath,
    });
  }

  return tools;
}

function toSnakeCase(s: string): string {
  return s.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}
```

**Step 3: Run tests, commit**

Run: `npx vitest run tests/unit/entities/tool-generator.test.ts`
Expected: PASS.

```bash
git add src/entities/tool-generator.ts tests/unit/entities/tool-generator.test.ts
git commit -m "feat: add MCP tool generator from entity definitions"
```

---

## Task 12: Metadata Discovery (Custom API Runtime Detection)

**Files:**
- Create: `src/entities/metadata-discovery.ts`
- Create: `tests/unit/entities/metadata-discovery.test.ts`
- Create: `tests/fixtures/metadata-sample.xml`

**Step 1: Create test fixture**

Create `tests/fixtures/metadata-sample.xml` with a minimal OData $metadata document containing a sample EntityType and EntitySet to test parsing.

**Step 2: Write failing tests**

Tests should verify:
- Parsing an EDMX XML document into EntityDefinition objects
- Extracting field names, types, and key properties
- Extracting navigation properties
- Handling unknown property types gracefully

**Step 3: Implement metadata parser**

Use `fast-xml-parser` to parse EDMX XML. Map OData types (`Edm.String`, `Edm.Int32`, `Edm.Decimal`, `Edm.DateTimeOffset`, `Edm.Boolean`, `Edm.Guid`) to `FieldType`. Generate generic tool descriptions for discovered entities.

**Step 4: Run tests, commit**

```bash
git add src/entities/metadata-discovery.ts tests/unit/entities/metadata-discovery.test.ts tests/fixtures/metadata-sample.xml
git commit -m "feat: add runtime metadata discovery for custom BC API pages"
```

---

## Task 13: MCP Server Integration — Tool Registration and Handler Dispatch

**Files:**
- Modify: `src/index.ts`
- Create: `src/server.ts`
- Create: `src/tools/company-tools.ts`
- Create: `src/tools/action-tools.ts`

**Step 1: Implement server.ts**

This is the core integration file that:
1. Loads config
2. Creates OAuth client
3. Creates BC client
4. Creates entity registry and registers all static entities
5. Uses tool-generator to create MCP tools for all entities
6. Registers each tool with the McpServer via `server.registerTool()`
7. Each tool handler dispatches to the BC client based on `handler` type (list, get, create, update, delete, count, action)
8. Applies smart truncation to list responses
9. Registers global tools (bc_list_companies, bc_select_company, bc_discover_custom_apis, bc_batch)

**Step 2: Implement tool handler dispatch**

The handler receives the tool's `GeneratedTool` metadata and input params, then:
- `list` → calls `bcClient.list()` with ODataQueryBuilder, applies smartTruncate
- `get` → calls `bcClient.get()` with ID
- `create` → calls `bcClient.create()` with body from params
- `update` → calls `bcClient.update()` with ID and body
- `delete` → calls `bcClient.delete()` with ID
- `count` → calls `bcClient.count()` with filter
- `action` → calls `bcClient.action()` with ID and navPath

**Step 3: Implement company tools**

`bc_list_companies` — lists available companies
`bc_select_company` — sets active company on bcClient

**Step 4: Update src/index.ts**

```typescript
#!/usr/bin/env node
import { createServer } from "./server.js";

async function main() {
  const server = await createServer();
  console.error("BusinessCentral.Agent MCP server running on stdio");
}

main().catch(console.error);
```

**Step 5: Build and verify compilation**

Run: `npm run build`
Expected: Clean compilation.

**Step 6: Commit**

```bash
git add src/server.ts src/index.ts src/tools/
git commit -m "feat: integrate MCP server with entity tools, handler dispatch, and company selection"
```

---

## Task 14: OData $batch Support

**Files:**
- Create: `src/client/batch.ts`
- Create: `tests/unit/client/batch.test.ts`

Implement transactional batch support per BC docs:
- `POST /$batch` with `Isolation: snapshot` header
- Build batch request body with multiple operations
- Parse batch response, map results back to individual operations
- Register `bc_batch` tool

**Commit:**
```bash
git add src/client/batch.ts tests/unit/client/batch.test.ts
git commit -m "feat: add OData $batch support for transactional multi-operation requests"
```

---

## Task 15: Integration Tests

**Files:**
- Create: `tests/integration/bc-client.test.ts`
- Create: `tests/integration/tool-flow.test.ts`

Write integration tests that:
1. Test the full tool registration flow (registry → tool-generator → tool list)
2. Test handler dispatch with mocked BC responses
3. Test smart truncation for different response sizes
4. Test error handling flow end-to-end

These tests mock `fetch` at the HTTP level but exercise the full stack from tool input → handler → BC client → response formatting.

**Commit:**
```bash
git add tests/integration/
git commit -m "test: add integration tests for full tool flow and error handling"
```

---

## Task 16: README and Configuration Docs

**Files:**
- Create: `README.md` (only because this is a new repo and needs usage docs)

Document:
1. What the server does
2. Prerequisites (Azure AD app registration, BC API access)
3. Installation and configuration
4. How to use with Claude Desktop (claude_desktop_config.json)
5. Available tools (auto-generated from entity list)
6. How to add custom API support

**Commit:**
```bash
git add README.md
git commit -m "docs: add README with setup, configuration, and usage instructions"
```

---

## Task 17: Final Build, Test, and Push

**Step 1:** Run full test suite: `npm test`
**Step 2:** Run build: `npm run build`
**Step 3:** Verify entry point: `node build/index.js --help` (should start and connect on stdio)
**Step 4:** Push to GitHub: `git push origin main`
