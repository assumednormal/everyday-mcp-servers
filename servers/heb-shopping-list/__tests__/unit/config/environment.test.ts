import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('loadEnvironment', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear all HEB-related env vars before each test
    delete process.env.HEB_SAT_COOKIE;
    delete process.env.HEB_JSESSIONID;
    delete process.env.HEB_REESE84;
    delete process.env.HEB_STORE_ID;
    delete process.env.HEB_DEFAULT_LIST_ID;
  });

  it('should return validated environment with all required vars set', async () => {
    process.env.HEB_SAT_COOKIE = 'test-sat';
    process.env.HEB_JSESSIONID = 'test-session';
    process.env.HEB_REESE84 = 'test-reese';
    process.env.HEB_STORE_ID = '123';

    const { loadEnvironment } = await import('../../../src/config/environment.js');
    const env = loadEnvironment();

    expect(env.HEB_SAT_COOKIE).toBe('test-sat');
    expect(env.HEB_JSESSIONID).toBe('test-session');
    expect(env.HEB_REESE84).toBe('test-reese');
    expect(env.HEB_STORE_ID).toBe('123');
  });

  it('should include optional HEB_DEFAULT_LIST_ID when provided', async () => {
    process.env.HEB_SAT_COOKIE = 'test-sat';
    process.env.HEB_JSESSIONID = 'test-session';
    process.env.HEB_REESE84 = 'test-reese';
    process.env.HEB_STORE_ID = '123';
    process.env.HEB_DEFAULT_LIST_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    const { loadEnvironment } = await import('../../../src/config/environment.js');
    const env = loadEnvironment();

    expect(env.HEB_DEFAULT_LIST_ID).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });

  it('should throw error when a required var is missing', async () => {
    process.env.HEB_JSESSIONID = 'test-session';
    process.env.HEB_REESE84 = 'test-reese';
    process.env.HEB_STORE_ID = '123';

    const { loadEnvironment } = await import('../../../src/config/environment.js');

    expect(() => loadEnvironment()).toThrow('Environment validation failed');
  });

  it('should include helpful message about Claude Desktop configuration', async () => {
    const { loadEnvironment } = await import('../../../src/config/environment.js');

    expect(() => loadEnvironment()).toThrow('Claude Desktop configuration');
  });
});
