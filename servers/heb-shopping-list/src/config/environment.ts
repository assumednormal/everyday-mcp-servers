import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  HEB_SAT_COOKIE: z.string().min(1, 'HEB_SAT_COOKIE is required'),
  HEB_JSESSIONID: z.string().min(1, 'HEB_JSESSIONID is required'),
  HEB_REESE84: z.string().min(1, 'HEB_REESE84 is required'),
  HEB_STORE_ID: z.string().min(1, 'HEB_STORE_ID is required'),
  HEB_DEFAULT_LIST_ID: z.string().optional(),
});

export type Environment = z.infer<typeof envSchema>;

/**
 * Load and validate environment variables
 * @throws {Error} If required environment variables are missing or invalid
 */
export function loadEnvironment(): Environment {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errors}\n\nPlease ensure all required environment variables are set in your Claude Desktop configuration.`);
  }

  return result.data;
}

/**
 * Get the current environment configuration
 */
export function getEnvironment(): Environment {
  return loadEnvironment();
}
