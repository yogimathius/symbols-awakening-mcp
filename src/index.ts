/**
 * Symbols Awakening MCP Server
 * CLI entry point for the symbolic ontology MCP server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Version info
const VERSION = "0.1.0";
const SERVER_NAME = "symbols-awakening-mcp";

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
${SERVER_NAME} v${VERSION}

A symbolic reasoning engine that serves as an MCP server for symbolic ontology operations.

Usage:
  ${SERVER_NAME}              Start the MCP server
  ${SERVER_NAME} --help       Show this help message
  ${SERVER_NAME} --version    Show version information

Environment Variables:
  DATABASE_URL               PostgreSQL connection string
  NODE_ENV                  Environment (development, production, test)

For more information, visit: https://github.com/your-username/symbols-awakening-mcp
`);
}

/**
 * Display version information
 */
function showVersion(): void {
  console.log(`${SERVER_NAME} v${VERSION}`);
}

/**
 * Handle command line arguments
 */
function handleCliArgs(): boolean {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return false;
  }

  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    return false;
  }

  return true;
}

/**
 * Main server function
 */
async function main(): Promise<void> {
  try {
    // Handle CLI arguments
    if (!handleCliArgs()) {
      process.exit(0);
    }

    // Create MCP Server
    const server = new McpServer(
      {
        name: SERVER_NAME,
        version: VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Add a simple test tool for now
    server.tool(
      "get_server_info",
      "Get information about the symbols ontology server",
      {},
      async () => {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  name: SERVER_NAME,
                  version: VERSION,
                  status: "running",
                  capabilities: ["symbols", "ontology", "search"],
                  message: "Symbols Awakening MCP Server is operational",
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );

    // Connect via stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Server is now running and will handle MCP protocol messages
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
function setupShutdownHandlers(): void {
  const shutdown = (signal: string): void => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// Set up shutdown handlers
setupShutdownHandlers();

// Start the server
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
