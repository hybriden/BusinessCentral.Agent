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
        } catch { return tokens.accessToken; }
      }
      return tokens.accessToken;
    }
    if (tokens?.refreshToken) {
      try {
        const refreshed = await this.refreshAccessToken(tokens.refreshToken);
        return refreshed.accessToken;
      } catch {}
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

    const callbackPromise = startCallbackServer(this.config.redirectPort, state);

    console.error(`\nPlease authenticate in your browser:\n${authUrl.toString()}\n`);
    try {
      const open = (await import("open")).default;
      await open(authUrl.toString());
    } catch {
      console.error("Could not open browser automatically. Please open the URL above manually.");
    }

    const { code } = await callbackPromise;

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

    if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`);

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
