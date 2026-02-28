import http from "node:http";
import { URL } from "node:url";

export interface AuthCallbackResult {
  code: string;
  state: string;
}

export function startCallbackServer(port: number, expectedState: string): Promise<AuthCallbackResult> {
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
        res.end("<html><body><h1>State mismatch</h1></body></html>");
        server.close();
        reject(new Error("OAuth state mismatch"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body><h1>Authentication Successful</h1><p>You can close this window.</p></body></html>");
      server.close();
      resolve({ code, state });
    });

    server.listen(port, "127.0.0.1");
    server.on("error", reject);
    setTimeout(() => { server.close(); reject(new Error("OAuth callback timed out after 5 minutes")); }, 300000);
  });
}
