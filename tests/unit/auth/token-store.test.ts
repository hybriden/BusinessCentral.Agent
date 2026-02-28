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
    try { fs.rmSync(storePath, { recursive: true }); } catch {}
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
    const expired: TokenData = { accessToken: "test", refreshToken: "test", expiresAt: Date.now() - 1000 };
    expect(TokenStore.isExpired(expired)).toBe(true);
  });

  it("should detect tokens expiring within buffer", () => {
    const expiringSoon: TokenData = { accessToken: "test", refreshToken: "test", expiresAt: Date.now() + 60000 };
    expect(TokenStore.isExpiringSoon(expiringSoon, 300000)).toBe(true);
  });

  it("should clear tokens", async () => {
    const tokenData: TokenData = { accessToken: "test", refreshToken: "test", expiresAt: Date.now() + 3600000 };
    await store.save(tokenData);
    await store.clear();
    const loaded = await store.load();
    expect(loaded).toBeNull();
  });
});
