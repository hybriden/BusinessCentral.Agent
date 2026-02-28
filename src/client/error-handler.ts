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
