#!/usr/bin/env node
import { createServer } from "./server.js";

async function main() {
  await createServer();
  console.error("BusinessCentral.Agent MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
