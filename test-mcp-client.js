#!/usr/bin/env node

/**
 * MCP Client test for the Symbols Awakening MCP Server
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testMcpServer() {
  console.log("🧪 Testing MCP Server via MCP Protocol...\n");

  try {
    // Spawn the MCP server process
    const serverProcess = spawn("node", ["dist/index.js"], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    // Create MCP client with stdio transport
    const transport = new StdioClientTransport({
      command: "node",
      args: ["dist/index.js"],
    });

    const client = new Client(
      {
        name: "symbols-test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);

    console.log("✅ Connected to MCP server!");

    // Test server info
    console.log("\n1. Testing server info...");
    const serverInfo = await client.call("tools/call", {
      name: "get_server_info",
      arguments: {},
    });
    console.log("✅ Server info received");

    // Test get_symbols
    console.log("\n2. Testing get_symbols...");
    const symbols = await client.call("tools/call", {
      name: "get_symbols",
      arguments: { limit: 3 },
    });
    console.log(
      "✅ Symbols retrieved:",
      symbols.content[0].text.length,
      "characters of JSON"
    );

    // Test search_symbols
    console.log("\n3. Testing search_symbols...");
    const searchResults = await client.call("tools/call", {
      name: "search_symbols",
      arguments: { query: "infinity", limit: 2 },
    });
    console.log("✅ Search completed");

    // Test get_categories
    console.log("\n4. Testing get_categories...");
    const categories = await client.call("tools/call", {
      name: "get_categories",
      arguments: {},
    });
    console.log("✅ Categories retrieved");

    // Test filter_by_category
    console.log("\n5. Testing filter_by_category...");
    const filtered = await client.call("tools/call", {
      name: "filter_by_category",
      arguments: { category: "mathematical", limit: 2 },
    });
    console.log("✅ Category filter completed");

    // Test get_symbol_sets
    console.log("\n6. Testing get_symbol_sets...");
    const symbolSets = await client.call("tools/call", {
      name: "get_symbol_sets",
      arguments: { limit: 2 },
    });
    console.log("✅ Symbol sets retrieved");

    // Test search_symbol_sets
    console.log("\n7. Testing search_symbol_sets...");
    const symbolSetSearch = await client.call("tools/call", {
      name: "search_symbol_sets",
      arguments: { query: "wisdom", limit: 2 },
    });
    console.log("✅ Symbol set search completed");

    await client.close();
    serverProcess.kill();

    console.log("\n🎉 All MCP protocol tests passed!");
  } catch (error) {
    console.error("❌ MCP test failed:", error.message);
    process.exit(1);
  }
}

testMcpServer();
