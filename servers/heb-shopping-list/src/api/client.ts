import { getEnvironment } from '../config/environment.js';
import {
  AuthenticationError,
  NetworkError,
  RateLimitError,
  HEBError,
} from '../utils/errors.js';
import type { GraphQLRequest, GraphQLResponse } from './types.js';

const HEB_GRAPHQL_ENDPOINT = 'https://www.heb.com/graphql';
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

/**
 * GraphQL client for HEB API with cookie-based authentication
 */
export class HEBGraphQLClient {
  private cookieString: string;

  constructor() {
    const env = getEnvironment();

    // Build cookie string from environment variables
    this.cookieString = [
      `sat=${env.HEB_SAT_COOKIE}`,
      `JSESSIONID=${env.HEB_JSESSIONID}`,
      `reese84=${env.HEB_REESE84}`,
      `CURR_SESSION_STORE=${env.HEB_STORE_ID}`,
    ].join('; ');
  }

  /**
   * Execute a GraphQL query
   */
  async execute<T = unknown>(request: GraphQLRequest): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(HEB_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'accept': '*/*',
          'accept-language': 'en',
          'apollographql-client-name': 'WebPlatform-Solar (Production)',
          'apollographql-client-version': '1.0.0',
          'cookie': this.cookieString,
          'origin': 'https://www.heb.com',
          'referer': 'https://www.heb.com/',
          'user-agent': 'Mozilla/5.0 (compatible; MCP-HEB-Client/1.0)',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError('Invalid or expired authentication. Please update your HEB cookies.');
      }

      if (response.status === 429) {
        throw new RateLimitError();
      }

      if (!response.ok) {
        throw new NetworkError(`HTTP error ${response.status}: ${response.statusText}`);
      }

      // Parse GraphQL response
      const result = await response.json() as GraphQLResponse<T>;

      // Handle GraphQL errors
      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e) => e.message).join(', ');

        // Check for authentication-related errors
        if (errorMessages.toLowerCase().includes('unauthorized') ||
            errorMessages.toLowerCase().includes('unauthenticated')) {
          throw new AuthenticationError('Authentication failed. Please update your HEB cookies.');
        }

        throw new HEBError(`GraphQL error: ${errorMessages}`);
      }

      if (!result.data) {
        throw new HEBError('No data returned from HEB API');
      }

      return result.data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw known errors
      if (error instanceof AuthenticationError ||
          error instanceof RateLimitError ||
          error instanceof NetworkError ||
          error instanceof HEBError) {
        throw error;
      }

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timed out. Please try again.');
      }

      // Handle network errors
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        throw new NetworkError('Network error. Please check your internet connection.');
      }

      // Generic error
      throw new HEBError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Singleton instance of the GraphQL client
 */
let clientInstance: HEBGraphQLClient | null = null;

/**
 * Get the GraphQL client instance
 */
export function getClient(): HEBGraphQLClient {
  if (!clientInstance) {
    clientInstance = new HEBGraphQLClient();
  }
  return clientInstance;
}
