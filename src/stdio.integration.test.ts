import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { describe, expect, it } from "vitest";

describe("MCP stdio server", () => {
  it("initializes and searches demo symbols", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", "src/index.ts", "--demo"],
      cwd: process.cwd(),
    });
    const client = new Client({ name: "stdio-test", version: "1.0.0" });

    try {
      await client.connect(transport);
      expect(client.getServerVersion()?.name).toBe("symbols-awakening-mcp");

      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toContain("search_symbols");

      const response = CallToolResultSchema.parse(
        await client.callTool({
          name: "search_symbols",
          arguments: { query: "Ouroboros", limit: 5 },
        })
      );
      const text = response.content.find((item) => item.type === "text");
      if (text?.type !== "text") throw new Error("Expected a text result");
      const payload = JSON.parse(text.text);
      expect(payload.symbols[0].name).toBe("Ouroboros");
      expect(payload.count).toBe(1);
    } finally {
      await client.close();
    }
  }, 10000);
});
