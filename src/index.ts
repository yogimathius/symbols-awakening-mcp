/**
 * Symbols Awakening MCP Server
 * CLI entry point for the symbolic ontology MCP server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PostgreSQLDatabase } from "@/database/Database.js";
import { SymbolsService } from "@/mcp/SymbolsService.js";

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

MCP Tools Available:
  • get_symbols              List symbols with optional limit
  • search_symbols           Search symbols by text query
  • filter_by_category       Filter symbols by category
  • get_categories          Get all available categories
  • get_symbol_sets         List symbol sets with optional limit
  • search_symbol_sets      Search symbol sets by text query

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

    // Initialize database
    const database = new PostgreSQLDatabase();

    // Try to connect to database (graceful degradation if not available)
    try {
      await database.connect();
      console.error(`✓ Database connected successfully`);
    } catch (error) {
      console.error(
        `⚠ Database connection failed: ${(error as Error).message}`
      );
      console.error(
        `⚠ MCP server will start but tools may not function without database`
      );
    }

    // Set up symbols service with all MCP tools
    const symbolsService = new SymbolsService(server, database);
    symbolsService.registerTools();

    // Add server info tool for debugging
    server.tool(
      "get_server_info",
      "Get information about the symbols ontology server",
      {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      async () => {
        const healthCheck = await database.healthCheck();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  name: SERVER_NAME,
                  version: VERSION,
                  status: "running",
                  database_status: healthCheck.success
                    ? "connected"
                    : "disconnected",
                  database_error: healthCheck.error?.message,
                  capabilities: [
                    "get_symbols",
                    "search_symbols",
                    "filter_by_category",
                    "get_categories",
                    "get_symbol_sets",
                    "search_symbol_sets",
                  ],
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

    console.error(`✓ MCP server started successfully on stdio transport`);
    console.error(
      `✓ Available tools: get_symbols, search_symbols, filter_by_category, get_categories, get_symbol_sets, search_symbol_sets`
    );

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
  const shutdown = async (signal: string): Promise<void> => {
    console.error(`\nReceived ${signal}, shutting down gracefully...`);

    // Here we would close database connections, but since our database
    // is created locally in main(), we'll rely on process termination
    // for cleanup. In a larger application, we'd pass the database
    // instance to this handler for proper cleanup.

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
