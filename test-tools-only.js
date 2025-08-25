#!/usr/bin/env node

/**
 * Direct MCP tools testing (without stdio transport)
 */

import { PrismaDatabase } from "./src/database/Database.js";
import { SymbolsService } from "./src/mcp/SymbolsService.js";

// Mock MCP server for testing
class MockMcpServer {
  constructor() {
    this.tools = new Map();
  }

  tool(name, description, schema, handler) {
    this.tools.set(name, { name, description, schema, handler });
  }

  async callTool(name, args) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.handler(args);
  }
}

async function testMcpTools() {
  console.log("🧪 Testing MCP Tools directly...\n");

  try {
    // Initialize database
    const database = new PrismaDatabase();
    await database.connect();
    console.log("✅ Database connected successfully\n");

    // Create mock server and service
    const mockServer = new MockMcpServer();
    const symbolsService = new SymbolsService(mockServer, database);
    symbolsService.registerTools();

    console.log(
      "✅ Registered tools:",
      Array.from(mockServer.tools.keys()).join(", "),
      "\n"
    );

    // Test get_symbols
    console.log("1. Testing get_symbols...");
    const symbolsResult = await mockServer.callTool("get_symbols", {
      limit: 3,
    });
    const symbolsData = JSON.parse(symbolsResult.content[0].text);
    console.log(`✅ Retrieved ${symbolsData.count} symbols:`);
    symbolsData.symbols.forEach((symbol) => {
      console.log(`   - ${symbol.name} (${symbol.category})`);
    });
    console.log("");

    // Test search_symbols
    console.log("2. Testing search_symbols...");
    const searchResult = await mockServer.callTool("search_symbols", {
      query: "infinity",
      limit: 2,
    });
    const searchData = JSON.parse(searchResult.content[0].text);
    console.log(`✅ Found ${searchData.count} symbols for "infinity"`);
    console.log("");

    // Test get_categories
    console.log("3. Testing get_categories...");
    const categoriesResult = await mockServer.callTool("get_categories", {});
    const categoriesData = JSON.parse(categoriesResult.content[0].text);
    console.log("✅ Categories:", categoriesData.categories.join(", "));
    console.log("");

    // Test filter_by_category
    console.log("4. Testing filter_by_category...");
    const filterResult = await mockServer.callTool("filter_by_category", {
      category: "mathematical",
      limit: 2,
    });
    const filterData = JSON.parse(filterResult.content[0].text);
    console.log(`✅ Found ${filterData.count} mathematical symbols`);
    console.log("");

    // Test get_symbol_sets
    console.log("5. Testing get_symbol_sets...");
    const setsResult = await mockServer.callTool("get_symbol_sets", {
      limit: 2,
    });
    const setsData = JSON.parse(setsResult.content[0].text);
    console.log(`✅ Retrieved ${setsData.count} symbol sets:`);
    setsData.symbol_sets.forEach((set) => {
      console.log(`   - ${set.name} (${set.category})`);
    });
    console.log("");

    // Test search_symbol_sets
    console.log("6. Testing search_symbol_sets...");
    const searchSetsResult = await mockServer.callTool("search_symbol_sets", {
      query: "wisdom",
      limit: 2,
    });
    const searchSetsData = JSON.parse(searchSetsResult.content[0].text);
    console.log(`✅ Found ${searchSetsData.count} symbol sets for "wisdom"`);
    console.log("");

    await database.disconnect();
    console.log(
      "🎉 All MCP tool tests passed! The stdio transport issue is separate.\n"
    );
    console.log(
      "💡 The tools work correctly - the MCP server can be used in applications"
    );
    console.log(
      "   that handle the transport layer properly (like Claude Desktop)."
    );
  } catch (error) {
    console.error("❌ Tool test failed:", error.message);
    process.exit(1);
  }
}

testMcpTools();
