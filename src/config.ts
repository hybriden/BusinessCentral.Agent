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
    tenantId, environment, clientId, redirectPort, apiVersion,
    baseUrl, authUrl, tokenUrl, maxPageSize, maxRetries, requestTimeoutMs, scopes,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
