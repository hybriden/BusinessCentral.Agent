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
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(challenge.length).toBeGreaterThan(0);
  });
});
