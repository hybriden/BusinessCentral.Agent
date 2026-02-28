import type { BcConfig } from "../config.js";
import { RateLimiter } from "./rate-limiter.js";
import { ODataQueryBuilder } from "./odata-query.js";
import { BcError, parseBcError } from "./error-handler.js";

export interface OAuthClient {
  getAccessToken(): Promise<string>;
  authenticate(): Promise<void>;
}

export interface BcListResponse<T> {
  value: T[];
  nextLink?: string;
  count?: number;
}

interface RequestOptions {
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
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
      windowMs: 300000,
    });
  }

  setCompany(companyId: string): void {
    this.companyId = companyId;
  }

  getCompanyPath(): string {
    if (!this.companyId) {
      throw new Error("Please select a company first using setCompany()");
    }
    return `companies(${this.companyId})`;
  }

  buildUrl(path: string, query?: ODataQueryBuilder): string {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    const queryString = query ? query.build() : "";
    return `${base}/${path}${queryString}`;
  }

  async list<T = Record<string, unknown>>(
    path: string,
    query?: ODataQueryBuilder
  ): Promise<BcListResponse<T>> {
    const url = this.buildUrl(path, query);
    const response = await this.requestWithRetry({ method: "GET", url });
    const body = await response.json();
    return {
      value: body.value as T[],
      nextLink: body["@odata.nextLink"],
      count: body["@odata.count"],
    };
  }

  async listNextPage<T = Record<string, unknown>>(
    nextLink: string
  ): Promise<BcListResponse<T>> {
    const response = await this.requestWithRetry({ method: "GET", url: nextLink });
    const body = await response.json();
    return {
      value: body.value as T[],
      nextLink: body["@odata.nextLink"],
      count: body["@odata.count"],
    };
  }

  async get<T = Record<string, unknown>>(path: string): Promise<T> {
    const url = this.buildUrl(path);
    const response = await this.requestWithRetry({ method: "GET", url });
    return (await response.json()) as T;
  }

  async create<T = Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>
  ): Promise<T> {
    const url = this.buildUrl(path);
    const response = await this.requestWithRetry({
      method: "POST",
      url,
      body,
      headers: { "Content-Type": "application/json" },
    });
    return (await response.json()) as T;
  }

  async update<T = Record<string, unknown>>(
    path: string,
    body: Record<string, unknown>,
    etag?: string
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (etag) {
      headers["If-Match"] = etag;
    }
    const response = await this.requestWithRetry({
      method: "PATCH",
      url,
      body,
      headers,
    });
    return (await response.json()) as T;
  }

  async delete(path: string, etag?: string): Promise<void> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = {};
    if (etag) {
      headers["If-Match"] = etag;
    }
    await this.requestWithRetry({ method: "DELETE", url, headers });
  }

  async action(path: string, body?: Record<string, unknown>): Promise<void> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = {};
    if (body) {
      headers["Content-Type"] = "application/json";
    }
    await this.requestWithRetry({
      method: "POST",
      url,
      body,
      headers,
    });
  }

  async count(path: string, filter?: string): Promise<number> {
    const query = new ODataQueryBuilder().top(0).count();
    if (filter) {
      query.filter(filter);
    }
    const url = this.buildUrl(path, query);
    const response = await this.requestWithRetry({ method: "GET", url });
    const body = await response.json();
    return body["@odata.count"] as number;
  }

  async listCompanies(): Promise<Array<{ id: string; name: string; displayName: string }>> {
    const result = await this.list<{ id: string; name: string; displayName: string }>("companies");
    return result.value;
  }

  private async requestWithRetry(options: RequestOptions): Promise<Response> {
    const maxRetries = this.config.maxRetries;
    let lastError: BcError | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0 && lastError) {
        const retryAfterMs = lastError.statusCode === 429
          ? this.getRetryAfterMs(lastError)
          : undefined;
        const delayMs = retryAfterMs ?? RateLimiter.calculateBackoff(attempt - 1);
        await this.delay(delayMs);
      }

      try {
        const response = await this.rateLimiter.execute(async () => {
          const token = await this.auth.getAccessToken();
          const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            ...options.headers,
          };

          const fetchOptions: RequestInit = {
            method: options.method,
            headers,
            signal: AbortSignal.timeout(this.config.requestTimeoutMs),
          };

          if (options.body) {
            fetchOptions.body = JSON.stringify(options.body);
          }

          return fetch(options.url, fetchOptions);
        });

        if (response.status === 204) {
          return response;
        }

        if (response.ok) {
          return response;
        }

        // Parse error response
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          body = { error: { message: response.statusText } };
        }

        const bcError = parseBcError(response.status, body);

        if (!bcError.isRetryable || attempt === maxRetries) {
          throw bcError;
        }

        lastError = bcError;
      } catch (error) {
        if (error instanceof BcError) {
          if (!error.isRetryable || attempt === maxRetries) {
            throw error;
          }
          lastError = error;
        } else {
          throw error;
        }
      }
    }

    // Should not reach here, but just in case
    throw lastError ?? new Error("Request failed after retries");
  }

  private getRetryAfterMs(error: BcError): number | undefined {
    // The Retry-After header value is stored externally;
    // for 429 responses we use a default of 1000ms as minimum backoff
    return undefined;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
