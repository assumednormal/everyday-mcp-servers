/**
 * Base error class for HEB MCP server
 */
export class HEBError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HEBError';
  }
}

/**
 * Authentication error - thrown when cookies are invalid or expired
 */
export class AuthenticationError extends HEBError {
  constructor(message: string = 'Authentication failed. Please update your HEB cookies in the Claude Desktop configuration.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Network error - thrown when HEB API is unreachable
 */
export class NetworkError extends HEBError {
  constructor(message: string = 'Unable to connect to HEB API. Please check your internet connection and try again.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Validation error - thrown when input validation fails
 */
export class ValidationError extends HEBError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error - thrown when a resource (product, list) is not found
 */
export class NotFoundError extends HEBError {
  constructor(resource: string, identifier?: string) {
    const id = identifier ? ` with ID "${identifier}"` : '';
    super(`${resource}${id} not found. Please verify and try again.`);
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error - thrown when too many requests are made
 */
export class RateLimitError extends HEBError {
  constructor(message: string = 'Rate limit exceeded. Please wait a moment before trying again.') {
    super(message);
    this.name = 'RateLimitError';
  }
}
