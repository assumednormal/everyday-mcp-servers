import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the environment module before importing the client
vi.mock('../../../src/config/environment.js', () => ({
  getEnvironment: () => ({
    HEB_SAT_COOKIE: 'test-sat',
    HEB_JSESSIONID: 'test-session',
    HEB_REESE84: 'test-reese',
    HEB_STORE_ID: '123',
  }),
  loadEnvironment: () => ({
    HEB_SAT_COOKIE: 'test-sat',
    HEB_JSESSIONID: 'test-session',
    HEB_REESE84: 'test-reese',
    HEB_STORE_ID: '123',
  }),
}));

import { HEBGraphQLClient } from '../../../src/api/client.js';
import {
  AuthenticationError,
  NetworkError,
  RateLimitError,
  HEBError,
} from '../../../src/utils/errors.js';
import type { GraphQLRequest } from '../../../src/api/types.js';

const mockRequest: GraphQLRequest = {
  operationName: 'testOperation',
  variables: { key: 'value' },
  extensions: {
    persistedQuery: {
      version: 1,
      sha256Hash: 'abc123',
    },
  },
};

describe('HEBGraphQLClient', () => {
  let client: HEBGraphQLClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    client = new HEBGraphQLClient();
  });

  it('should return data from a successful GraphQL response', async () => {
    const responseData = { productSearchItems: { searchGrid: { items: [] } } };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: responseData }),
    });

    const result = await client.execute(mockRequest);
    expect(result).toEqual(responseData);
  });

  it('should send correct headers including cookies', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: {} }),
    });

    await client.execute(mockRequest);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.heb.com/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'cookie': 'sat=test-sat; JSESSIONID=test-session; reese84=test-reese; CURR_SESSION_STORE=123',
        }),
        body: JSON.stringify(mockRequest),
      })
    );
  });

  it('should throw AuthenticationError on HTTP 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(client.execute(mockRequest)).rejects.toThrow(AuthenticationError);
    await expect(client.execute(mockRequest)).rejects.toThrow('Invalid or expired authentication');
  });

  it('should throw AuthenticationError on HTTP 403', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    await expect(client.execute(mockRequest)).rejects.toThrow(AuthenticationError);
  });

  it('should throw RateLimitError on HTTP 429', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(client.execute(mockRequest)).rejects.toThrow(RateLimitError);
  });

  it('should throw NetworkError on HTTP 500', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(client.execute(mockRequest)).rejects.toThrow(NetworkError);
    await expect(client.execute(mockRequest)).rejects.toThrow('HTTP error 500');
  });

  it('should throw NetworkError on HTTP 503', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(client.execute(mockRequest)).rejects.toThrow(NetworkError);
  });

  it('should throw HEBError when GraphQL response contains errors', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: null,
        errors: [{ message: 'Something went wrong' }],
      }),
    });

    await expect(client.execute(mockRequest)).rejects.toThrow(HEBError);
    await expect(client.execute(mockRequest)).rejects.toThrow('GraphQL error: Something went wrong');
  });

  it('should throw AuthenticationError when GraphQL errors contain "unauthorized"', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: null,
        errors: [{ message: 'Unauthorized access to resource' }],
      }),
    });

    await expect(client.execute(mockRequest)).rejects.toThrow(AuthenticationError);
    await expect(client.execute(mockRequest)).rejects.toThrow('Authentication failed');
  });

  it('should throw AuthenticationError when GraphQL errors contain "unauthenticated"', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: null,
        errors: [{ message: 'User is unauthenticated' }],
      }),
    });

    await expect(client.execute(mockRequest)).rejects.toThrow(AuthenticationError);
  });

  it('should join multiple GraphQL error messages', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: null,
        errors: [
          { message: 'Error one' },
          { message: 'Error two' },
        ],
      }),
    });

    await expect(client.execute(mockRequest)).rejects.toThrow('GraphQL error: Error one, Error two');
  });

  it('should throw HEBError when response has no data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await expect(client.execute(mockRequest)).rejects.toThrow(HEBError);
    await expect(client.execute(mockRequest)).rejects.toThrow('No data returned from HEB API');
  });

  it('should throw NetworkError on timeout (AbortError)', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    await expect(client.execute(mockRequest)).rejects.toThrow(NetworkError);
    await expect(client.execute(mockRequest)).rejects.toThrow('Request timed out');
  });

  it('should throw NetworkError on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed'));

    await expect(client.execute(mockRequest)).rejects.toThrow(NetworkError);
    await expect(client.execute(mockRequest)).rejects.toThrow('Network error');
  });

  it('should throw NetworkError on generic network error', async () => {
    mockFetch.mockRejectedValue(new Error('network error occurred'));

    await expect(client.execute(mockRequest)).rejects.toThrow(NetworkError);
  });

  it('should throw HEBError for unexpected non-network errors', async () => {
    mockFetch.mockRejectedValue(new Error('something completely unexpected'));

    await expect(client.execute(mockRequest)).rejects.toThrow(HEBError);
    await expect(client.execute(mockRequest)).rejects.toThrow('Unexpected error');
  });

  it('should handle non-Error thrown values', async () => {
    mockFetch.mockRejectedValue('string error');

    await expect(client.execute(mockRequest)).rejects.toThrow(HEBError);
    await expect(client.execute(mockRequest)).rejects.toThrow('Unexpected error: string error');
  });

  it('should pass abort signal to fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { test: true } }),
    });

    await client.execute(mockRequest);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });
});
