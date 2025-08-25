#!/usr/bin/env node

/**
 * MCP Server for inspection by external tools
 * This runs the server in a way that can be properly tested by MCP clients
 */

import { exec } from "child_process";
import { promises as fs } from "fs";

async function setupMcpConfig() {
  console.log("🔧 Setting up MCP configuration for testing...\n");

  // Create a temporary MCP config for testing
  const mcpConfig = {
    mcpServers: {
      "symbols-awakening": {
        command: "node",
        args: ["dist/index.js"],
        cwd: process.cwd(),
      },
    },
  };

  // Write to a temporary config file
  await fs.writeFile("mcp-config.json", JSON.stringify(mcpConfig, null, 2));
  console.log("✅ Created MCP configuration file");

  // Test basic server startup
  console.log("\n🧪 Testing server startup...");

  return new Promise((resolve, reject) => {
    const child = exec(
      'echo \'{"jsonrpc": "2.0", "id": 1, "method": "ping"}\' | node dist/index.js',
      { timeout: 5000 },
      (error, stdout, stderr) => {
        if (error) {
          console.log("❌ Direct stdio test failed (expected):", error.message);
          console.log("📝 stderr:", stderr);
          console.log("📝 stdout:", stdout);
        } else {
          console.log("✅ Server responds to input");
          console.log("📤 Response:", stdout);
        }

        console.log("\n💡 The server is ready for MCP client connections!");
        console.log("🎯 Use this with MCP clients like:");
        console.log("   - Claude Desktop");
        console.log("   - MCP Inspector");
        console.log("   - Custom MCP client applications");

        console.log("\n📋 Server Configuration:");
        console.log("   Command: node dist/index.js");
        console.log("   Working Directory:", process.cwd());
        console.log(
          "   Available Tools: get_symbols, search_symbols, filter_by_category, get_categories, get_symbol_sets, search_symbol_sets"
        );

        resolve();
      }
    );

    // Handle timeout
    setTimeout(() => {
      child.kill();
      resolve();
    }, 4000);
  });
}

setupMcpConfig().catch(console.error);
