#!/usr/bin/env node

/**
 * Test script for the MCP server functionality
 */

import { PrismaDatabase } from "./src/database/Database.js";

async function testServer() {
  console.log("🧪 Testing MCP Server functionality...\n");

  try {
    // Test database connection
    console.log("1. Testing database connection...");
    const database = new PrismaDatabase();
    await database.connect();
    console.log("✅ Database connected successfully\n");

    // Test health check
    console.log("2. Testing health check...");
    const health = await database.healthCheck();
    console.log("✅ Health check:", health.success ? "HEALTHY" : "UNHEALTHY");
    if (health.data) {
      console.log("   Status:", health.data.status);
      console.log("   Timestamp:", health.data.timestamp);
    }
    console.log("");

    // Test get symbols
    console.log("3. Testing get symbols...");
    const symbols = await database.getSymbols({ limit: 3 });
    if (symbols.success && symbols.data) {
      console.log("✅ Retrieved", symbols.data.length, "symbols:");
      symbols.data.forEach((symbol) => {
        console.log(`   - ${symbol.name} (${symbol.category})`);
      });
    } else {
      console.log("❌ Failed to get symbols:", symbols.error?.message);
    }
    console.log("");

    // Test search symbols
    console.log("4. Testing search symbols...");
    const searchResults = await database.searchSymbols("infinity", {
      limit: 2,
    });
    if (searchResults.success && searchResults.data) {
      console.log("✅ Search results for 'infinity':");
      searchResults.data.forEach((symbol) => {
        console.log(
          `   - ${symbol.name}: ${symbol.description?.substring(0, 100)}...`
        );
      });
    } else {
      console.log("❌ Search failed:", searchResults.error?.message);
    }
    console.log("");

    // Test get categories
    console.log("5. Testing get categories...");
    const categories = await database.getCategories();
    if (categories.success && categories.data) {
      console.log("✅ Available categories:", categories.data.join(", "));
    } else {
      console.log("❌ Failed to get categories:", categories.error?.message);
    }
    console.log("");

    // Test get symbol sets
    console.log("6. Testing get symbol sets...");
    const symbolSets = await database.getSymbolSets({ limit: 2 });
    if (symbolSets.success && symbolSets.data) {
      console.log("✅ Retrieved", symbolSets.data.length, "symbol sets:");
      symbolSets.data.forEach((set) => {
        console.log(`   - ${set.name} (${set.category})`);
      });
    } else {
      console.log("❌ Failed to get symbol sets:", symbolSets.error?.message);
    }

    await database.disconnect();
    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testServer();
