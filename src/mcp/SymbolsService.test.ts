import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IDatabase } from "@/database/Database.js";
import type { Symbol, SymbolSet } from "@/types/Symbol.js";

import { SymbolsService, TOOL_SCHEMAS } from "./SymbolsService.js";

// Mock MCP server
const mockServer = {
  tool: vi.fn(),
};

// Mock database
const mockDatabase: IDatabase = {
  initializeSchema: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSymbols: vi.fn(),
  searchSymbols: vi.fn(),
  filterByCategory: vi.fn(),
  getCategories: vi.fn(),
  getSymbolSets: vi.fn(),
  searchSymbolSets: vi.fn(),
  healthCheck: vi.fn(),
};

describe("SymbolsService", () => {
  let service: SymbolsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SymbolsService(mockServer as any, mockDatabase);
  });

  describe("Tool Schemas", () => {
    it("should have valid Zod schema for get_symbols", () => {
      const schema = TOOL_SCHEMAS.get_symbols;

      expect(schema.limit).toBeDefined();
      expect(typeof schema.limit).toBe("object");
    });

    it("should have valid Zod schema for search_symbols", () => {
      const schema = TOOL_SCHEMAS.search_symbols;

      expect(schema.query).toBeDefined();
      expect(schema.limit).toBeDefined();
      expect(typeof schema.query).toBe("object");
      expect(typeof schema.limit).toBe("object");
    });

    it("should have valid Zod schema for filter_by_category", () => {
      const schema = TOOL_SCHEMAS.filter_by_category;

      expect(schema.category).toBeDefined();
      expect(schema.limit).toBeDefined();
      expect(typeof schema.category).toBe("object");
      expect(typeof schema.limit).toBe("object");
    });

    it("should have valid Zod schema for get_categories", () => {
      const schema = TOOL_SCHEMAS.get_categories;

      expect(typeof schema).toBe("object");
    });

    it("should have valid Zod schema for get_symbol_sets", () => {
      const schema = TOOL_SCHEMAS.get_symbol_sets;

      expect(schema.limit).toBeDefined();
      expect(typeof schema.limit).toBe("object");
    });

    it("should have valid Zod schema for search_symbol_sets", () => {
      const schema = TOOL_SCHEMAS.search_symbol_sets;

      expect(schema.query).toBeDefined();
      expect(schema.limit).toBeDefined();
      expect(typeof schema.query).toBe("object");
      expect(typeof schema.limit).toBe("object");
    });
  });

  describe("registerTools", () => {
    it("should register all 6 required tools", () => {
      service.registerTools();

      expect(mockServer.tool).toHaveBeenCalledTimes(6);

      // Verify all tool names are registered
      const registeredTools = mockServer.tool.mock.calls.map((call) => call[0]);
      expect(registeredTools).toContain("get_symbols");
      expect(registeredTools).toContain("search_symbols");
      expect(registeredTools).toContain("filter_by_category");
      expect(registeredTools).toContain("get_categories");
      expect(registeredTools).toContain("get_symbol_sets");
      expect(registeredTools).toContain("search_symbol_sets");
    });

    it("should register tools with correct descriptions", () => {
      service.registerTools();

      const toolCalls = mockServer.tool.mock.calls;
      const getSymbolsCall = toolCalls.find(
        (call) => call[0] === "get_symbols"
      );
      const searchSymbolsCall = toolCalls.find(
        (call) => call[0] === "search_symbols"
      );

      expect(getSymbolsCall?.[1]).toBe("List symbols with optional limit");
      expect(searchSymbolsCall?.[1]).toContain("Search symbols by text query");
    });

    it("should register tools with correct schemas", () => {
      service.registerTools();

      const toolCalls = mockServer.tool.mock.calls;
      const getSymbolsCall = toolCalls.find(
        (call) => call[0] === "get_symbols"
      );
      const searchSymbolsCall = toolCalls.find(
        (call) => call[0] === "search_symbols"
      );

      expect(getSymbolsCall?.[2]).toEqual(TOOL_SCHEMAS.get_symbols);
      expect(searchSymbolsCall?.[2]).toEqual(TOOL_SCHEMAS.search_symbols);
    });
  });

  describe("Tool Implementations", () => {
    const fixedDate = new Date("2025-08-25T05:38:43.884Z");

    const mockSymbol: Symbol = {
      id: "test-symbol-1",
      name: "Test Symbol",
      category: "test",
      description: "A test symbol",
      interpretations: { test: "test interpretation" },
      related_symbols: ["test-symbol-2"],
      properties: { test: true },
      created_at: fixedDate,
      updated_at: fixedDate,
    };

    const mockSymbolSet: SymbolSet = {
      id: "test-set-1",
      name: "Test Set",
      category: "test",
      description: "A test symbol set",
      symbols: { "test-symbol-1": { weight: 1.0 } },
      created_at: fixedDate,
      updated_at: fixedDate,
    };

    // Serialized versions for comparison (dates become ISO strings after JSON.stringify/parse)
    const expectedSymbol = {
      ...mockSymbol,
      created_at: fixedDate.toISOString(),
      updated_at: fixedDate.toISOString(),
    };

    const expectedSymbolSet = {
      ...mockSymbolSet,
      created_at: fixedDate.toISOString(),
      updated_at: fixedDate.toISOString(),
    };

    beforeEach(() => {
      service.registerTools();
    });

    describe("get_symbols tool", () => {
      it("should return symbols successfully", async () => {
        vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
          success: true,
          data: [mockSymbol],
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "get_symbols"
        )?.[3];
        const result = await toolHandler?.({ limit: 10 });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.symbols).toEqual([expectedSymbol]);
        expect(responseData.count).toBe(1);
        expect(responseData.message).toContain("Retrieved 1 symbols");
        expect(mockDatabase.getSymbols).toHaveBeenCalledWith({
          limit: 10,
          offset: 0,
        });
      });

      it("should handle database errors", async () => {
        vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
          success: false,
          error: new Error("Database connection failed"),
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "get_symbols"
        )?.[3];
        const result = await toolHandler?.({});

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.error).toBe(
          "Internal error while retrieving symbols"
        );
        expect(responseData.details).toBe("Database connection failed");
      });

      it("should use default limit when not provided", async () => {
        vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
          success: true,
          data: [],
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "get_symbols"
        )?.[3];
        await toolHandler?.({});

        expect(mockDatabase.getSymbols).toHaveBeenCalledWith({
          limit: 50,
          offset: 0,
        });
      });
    });

    describe("search_symbols tool", () => {
      it("should search symbols successfully", async () => {
        vi.mocked(mockDatabase.searchSymbols).mockResolvedValue({
          success: true,
          data: [mockSymbol],
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "search_symbols"
        )?.[3];
        const result = await toolHandler?.({ query: "test", limit: 10 });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.symbols).toEqual([expectedSymbol]);
        expect(responseData.count).toBe(1);
        expect(responseData.query).toBe("test");
        expect(responseData.message).toContain(
          'Found 1 symbols matching "test"'
        );
        expect(mockDatabase.searchSymbols).toHaveBeenCalledWith("test", {
          limit: 10,
          offset: 0,
        });
      });

      it("should reject empty query", async () => {
        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "search_symbols"
        )?.[3];
        const result = await toolHandler?.({ query: "   " });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.error).toBe("Search query cannot be empty");
      });

      it("should handle search errors", async () => {
        vi.mocked(mockDatabase.searchSymbols).mockResolvedValue({
          success: false,
          error: new Error("Search failed"),
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "search_symbols"
        )?.[3];
        const result = await toolHandler?.({ query: "test" });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.error).toBe(
          "Internal error while searching symbols"
        );
        expect(responseData.details).toBe("Search failed");
      });
    });

    describe("filter_by_category tool", () => {
      it("should filter symbols by category", async () => {
        vi.mocked(mockDatabase.filterByCategory).mockResolvedValue({
          success: true,
          data: [mockSymbol],
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "filter_by_category"
        )?.[3];
        const result = await toolHandler?.({ category: "test", limit: 10 });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.symbols).toEqual([expectedSymbol]);
        expect(responseData.count).toBe(1);
        expect(responseData.category).toBe("test");
        expect(responseData.message).toContain(
          'Found 1 symbols in category "test"'
        );
        expect(mockDatabase.filterByCategory).toHaveBeenCalledWith("test", {
          limit: 10,
          offset: 0,
        });
      });

      it("should reject empty category", async () => {
        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "filter_by_category"
        )?.[3];
        const result = await toolHandler?.({ category: "   " });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.error).toBe("Category name cannot be empty");
      });
    });

    describe("get_categories tool", () => {
      it("should return categories successfully", async () => {
        vi.mocked(mockDatabase.getCategories).mockResolvedValue({
          success: true,
          data: ["test", "demo"],
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "get_categories"
        )?.[3];
        const result = await toolHandler?.({});

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.categories).toEqual(["test", "demo"]);
        expect(responseData.count).toBe(2);
        expect(responseData.message).toContain("Retrieved 2 categories");
      });

      it("should handle categories fetch errors", async () => {
        vi.mocked(mockDatabase.getCategories).mockResolvedValue({
          success: false,
          error: new Error("Categories fetch failed"),
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "get_categories"
        )?.[3];
        const result = await toolHandler?.({});

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.error).toBe(
          "Internal error while retrieving categories"
        );
        expect(responseData.details).toBe("Categories fetch failed");
      });
    });

    describe("get_symbol_sets tool", () => {
      it("should return symbol sets successfully", async () => {
        vi.mocked(mockDatabase.getSymbolSets).mockResolvedValue({
          success: true,
          data: [mockSymbolSet],
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "get_symbol_sets"
        )?.[3];
        const result = await toolHandler?.({ limit: 10 });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.symbol_sets).toEqual([expectedSymbolSet]);
        expect(responseData.count).toBe(1);
        expect(responseData.message).toContain("Retrieved 1 symbol sets");
        expect(mockDatabase.getSymbolSets).toHaveBeenCalledWith({
          limit: 10,
          offset: 0,
        });
      });
    });

    describe("search_symbol_sets tool", () => {
      it("should search symbol sets successfully", async () => {
        vi.mocked(mockDatabase.searchSymbolSets).mockResolvedValue({
          success: true,
          data: [mockSymbolSet],
        });

        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "search_symbol_sets"
        )?.[3];
        const result = await toolHandler?.({ query: "test", limit: 10 });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.symbol_sets).toEqual([expectedSymbolSet]);
        expect(responseData.count).toBe(1);
        expect(responseData.query).toBe("test");
        expect(responseData.message).toContain(
          'Found 1 symbol sets matching "test"'
        );
        expect(mockDatabase.searchSymbolSets).toHaveBeenCalledWith("test", {
          limit: 10,
          offset: 0,
        });
      });

      it("should reject empty query for symbol sets search", async () => {
        const toolHandler = mockServer.tool.mock.calls.find(
          (call) => call[0] === "search_symbol_sets"
        )?.[3];
        const result = await toolHandler?.({ query: "" });

        const responseData = JSON.parse(result.content[0].text);
        expect(responseData.error).toBe("Search query cannot be empty");
      });
    });
  });
});
