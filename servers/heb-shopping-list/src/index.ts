#!/usr/bin/env node

import { runServer } from './server.js';
import { loadEnvironment } from './config/environment.js';

/**
 * Main entry point for the HEB Shopping List MCP server
 */
async function main(): Promise<void> {
  try {
    // Validate environment variables on startup
    loadEnvironment();

    // Start the MCP server
    await runServer();
  } catch (error) {
    // Log errors to stderr
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
