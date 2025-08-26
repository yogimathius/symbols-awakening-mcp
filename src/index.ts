/**
 * Symbols Awakening MCP Server
 * CLI entry point for the symbolic ontology MCP server
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { PrismaDatabase } from "@/database/Database.js";
import { SymbolsService } from "@/mcp/SymbolsService.js";
import { CsvService } from "@/services/CsvService.js";
import path from "path";

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
  ${SERVER_NAME}                           Start the MCP server
  ${SERVER_NAME} --help                    Show this help message
  ${SERVER_NAME} --version                 Show version information
  
  CSV Import/Export:
  ${SERVER_NAME} import <file.csv>         Import symbols from CSV file
  ${SERVER_NAME} export <file.csv>         Export all symbols to CSV file
  ${SERVER_NAME} export <file.csv> --category <name>  Export by category
  ${SERVER_NAME} sample-csv <file.csv>     Create sample CSV file

Environment Variables:
  DATABASE_URL               PostgreSQL connection string
  NODE_ENV                  Environment (development, production, test)

MCP Tools Available:
  Read-only tools:
  • get_symbols              List symbols with optional limit
  • search_symbols           Search symbols by text query
  • filter_by_category       Filter symbols by category
  • get_categories          Get all available categories
  • get_symbol_sets         List symbol sets with optional limit
  • search_symbol_sets      Search symbol sets by text query
  
  Symbol management tools:
  • create_symbol           Create a new symbol
  • update_symbol           Update an existing symbol
  • delete_symbol           Delete a symbol (with optional cascade)
  • create_symbol_set       Create a new symbol set
  • update_symbol_set       Update an existing symbol set

For more information, visit: https://github.com/yogimathius/symbols-awakening-mcp
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
async function handleCliArgs(): Promise<boolean> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return false;
  }

  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    return false;
  }

  // Handle CSV commands
  if (args.length > 0) {
    const command = args[0];
    
    if (command === "import" && args.length >= 2) {
      await handleImportCommand(args.slice(1));
      return false;
    }
    
    if (command === "export" && args.length >= 2) {
      await handleExportCommand(args.slice(1));
      return false;
    }
    
    if (command === "sample-csv" && args.length >= 2) {
      await handleSampleCsvCommand(args.slice(1));
      return false;
    }
  }

  return true;
}

/**
 * Handle CSV import command
 */
async function handleImportCommand(args: string[]): Promise<void> {
  const filePath = args[0];
  
  if (!filePath) {
    console.error('❌ Error: CSV file path is required');
    process.exit(1);
  }
  
  if (!filePath.endsWith('.csv')) {
    console.error('❌ Error: File must have .csv extension');
    process.exit(1);
  }

  console.log(`📥 Importing symbols from ${filePath}...`);
  
  try {
    const database = new PrismaDatabase();
    await database.connect();
    
    const csvService = new CsvService(database);
    
    const result = await csvService.importSymbols(filePath, {
      skipDuplicates: true,
      onProgress: (processed, total) => {
        if (total > 10) { // Only show progress for larger files
          process.stdout.write(`\r📊 Progress: ${processed}/${total} (${Math.round((processed/total)*100)}%)`);
        }
      },
    });
    
    console.log('\n'); // New line after progress
    
    if (result.success) {
      console.log(`✅ Import completed successfully!`);
      console.log(`📈 Summary:`);
      console.log(`   • Processed: ${result.processed} rows`);
      console.log(`   • Created: ${result.created} symbols`);
      console.log(`   • Skipped: ${result.skipped} duplicates`);
      
      if (result.errors.length > 0) {
        console.log(`   • Errors: ${result.errors.length}`);
        result.errors.slice(0, 5).forEach(err => {
          console.log(`     Row ${err.row}: ${err.error}`);
        });
        if (result.errors.length > 5) {
          console.log(`     ... and ${result.errors.length - 5} more errors`);
        }
      }
    } else {
      console.error('❌ Import failed!');
      result.errors.forEach(err => {
        console.error(`   Row ${err.row}: ${err.error}`);
      });
    }
    
    await database.disconnect();
  } catch (error) {
    console.error(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Handle CSV export command
 */
async function handleExportCommand(args: string[]): Promise<void> {
  const filePath = args[0];
  const categoryIndex = args.indexOf('--category');
  const category = categoryIndex !== -1 && categoryIndex + 1 < args.length ? args[categoryIndex + 1] : undefined;
  
  if (!filePath) {
    console.error('❌ Error: CSV file path is required');
    process.exit(1);
  }
  
  if (!filePath.endsWith('.csv')) {
    console.error('❌ Error: File must have .csv extension');
    process.exit(1);
  }

  console.log(`📤 Exporting symbols to ${filePath}...`);
  if (category) {
    console.log(`🏷️  Filtering by category: ${category}`);
  }
  
  try {
    const database = new PrismaDatabase();
    await database.connect();
    
    const csvService = new CsvService(database);
    
    const result = await csvService.exportSymbols({
      filePath: path.resolve(filePath),
      ...(category && { category }),
      onProgress: (exported, total) => {
        if (total > 10) {
          process.stdout.write(`\r📊 Progress: ${exported}/${total} (${Math.round((exported/total)*100)}%)`);
        }
      },
    });
    
    console.log('\n'); // New line after progress
    
    if (result.success) {
      console.log(`✅ Export completed successfully!`);
      console.log(`📄 Exported ${result.exported} symbols to ${result.filePath}`);
    } else {
      console.error(`❌ Export failed: ${result.error}`);
      process.exit(1);
    }
    
    await database.disconnect();
  } catch (error) {
    console.error(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Handle sample CSV creation command
 */
async function handleSampleCsvCommand(args: string[]): Promise<void> {
  const filePath = args[0];
  
  if (!filePath) {
    console.error('❌ Error: CSV file path is required');
    process.exit(1);
  }
  
  if (!filePath.endsWith('.csv')) {
    console.error('❌ Error: File must have .csv extension');
    process.exit(1);
  }

  console.log(`📝 Creating sample CSV file at ${filePath}...`);
  
  try {
    const database = new PrismaDatabase(); // Not used but needed for service
    const csvService = new CsvService(database);
    
    const success = await csvService.createSampleCsv(path.resolve(filePath));
    
    if (success) {
      console.log(`✅ Sample CSV file created successfully!`);
      console.log(`📄 File location: ${path.resolve(filePath)}`);
      console.log(`💡 Use this file as a template for importing your own symbols.`);
    } else {
      console.error(`❌ Failed to create sample CSV file`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Sample creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Main server function
 */
async function main(): Promise<void> {
  try {
    // Handle CLI arguments
    if (!(await handleCliArgs())) {
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

    // Initialize database with Prisma
    const database = new PrismaDatabase();

    // Try to connect to database (graceful degradation if not available)
    try {
      await database.connect();
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
      {},
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
                    "create_symbol",
                    "update_symbol",
                    "delete_symbol",
                    "create_symbol_set",
                    "update_symbol_set",
                  ],
                  message:
                    "Symbols Awakening MCP Server is operational with Prisma",
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
    // Ensure stdio streams are properly configured for MCP
    if (!process.stdin || !process.stdout) {
      throw new Error(
        "stdio streams not available - MCP server requires stdin/stdout"
      );
    }

    // Critical: Set up stdio streams for MCP protocol
    process.stdin.setEncoding("utf8");
    process.stdout.setEncoding("utf8");

    // Ensure stdin is in the correct mode for MCP
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
    }

    // Resume stdin if it's paused
    if (
      !process.stdin.readable ||
      (process.stdin as any).readableState?.ended
    ) {
      process.stdin.resume();
    }

    // Handle any stream errors
    process.stdin.on("error", (err) => {
      console.error("stdin error:", err);
    });

    process.stdout.on("error", (err) => {
      console.error("stdout error:", err);
    });

    try {
      // Create and connect the transport
      const transport = new StdioServerTransport();
      await server.connect(transport);

      // eslint-disable-next-line no-console, no-undef
      console.error(`✓ MCP server started successfully on stdio transport`);
      // eslint-disable-next-line no-console, no-undef
      console.error(
        `✓ Available tools: get_symbols, search_symbols, filter_by_category, get_categories, get_symbol_sets, search_symbol_sets`
      );

      // Keep the process alive
      process.stdin.resume();
    } catch (transportError) {
      console.error("Failed to start stdio transport:", transportError);
      console.error(
        "Transport error details:",
        (transportError as Error).stack
      );
      throw new Error(
        `MCP transport error: ${(transportError as Error).message}`
      );
    }

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
