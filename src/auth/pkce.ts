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
