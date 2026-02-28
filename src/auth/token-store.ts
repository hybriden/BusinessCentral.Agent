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
    try { await fs.unlink(this.filePath); } catch {}
  }

  static isExpired(tokens: TokenData): boolean {
    return Date.now() >= tokens.expiresAt;
  }

  static isExpiringSoon(tokens: TokenData, bufferMs: number = 300000): boolean {
    return Date.now() >= tokens.expiresAt - bufferMs;
  }
}
