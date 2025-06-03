import { describe, it, expect, beforeEach, vi } from "vitest";
import { SymbolsService, TOOL_SCHEMAS } from "./SymbolsService.js";
import type { IDatabase } from "@/database/Database.js";
import type { Symbol, SymbolSet } from "@/types/Symbol.js";

// Mock MCP server
const mockServer = {
  tool: vi.fn(),
};

// Mock database
const mockDatabase: IDatabase = {
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
    it("should have valid schema for get_symbols", () => {
      const schema = TOOL_SCHEMAS.get_symbols;

      expect(schema.type).toBe("object");
      expect(schema.properties.limit).toBeDefined();
      expect(schema.properties.limit.type).toBe("number");
      expect(schema.properties.limit.default).toBe(50);
      expect(schema.additionalProperties).toBe(false);
    });

    it("should have valid schema for search_symbols", () => {
      const schema = TOOL_SCHEMAS.search_symbols;

      expect(schema.type).toBe("object");
      expect(schema.properties.query).toBeDefined();
      expect(schema.properties.query.type).toBe("string");
      expect(schema.required).toContain("query");
      expect(schema.additionalProperties).toBe(false);
    });

    it("should have valid schema for filter_by_category", () => {
      const schema = TOOL_SCHEMAS.filter_by_category;

      expect(schema.type).toBe("object");
      expect(schema.properties.category).toBeDefined();
      expect(schema.properties.category.type).toBe("string");
      expect(schema.required).toContain("category");
      expect(schema.additionalProperties).toBe(false);
    });

    it("should have valid schema for get_categories", () => {
      const schema = TOOL_SCHEMAS.get_categories;

      expect(schema.type).toBe("object");
      expect(schema.properties).toEqual({});
      expect(schema.additionalProperties).toBe(false);
    });

    it("should have valid schema for get_symbol_sets", () => {
      const schema = TOOL_SCHEMAS.get_symbol_sets;

      expect(schema.type).toBe("object");
      expect(schema.properties.limit).toBeDefined();
      expect(schema.properties.limit.type).toBe("number");
      expect(schema.additionalProperties).toBe(false);
    });

    it("should have valid schema for search_symbol_sets", () => {
      const schema = TOOL_SCHEMAS.search_symbol_sets;

      expect(schema.type).toBe("object");
      expect(schema.properties.query).toBeDefined();
      expect(schema.properties.query.type).toBe("string");
      expect(schema.required).toContain("query");
      expect(schema.additionalProperties).toBe(false);
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
    const mockSymbol: Symbol = {
      id: "test-symbol-1",
      name: "Test Symbol",
      category: "test",
      description: "A test symbol",
      interpretations: { test: "test interpretation" },
      related_symbols: ["test-symbol-2"],
      properties: { test: true },
    };

    const mockSymbolSet: SymbolSet = {
      id: "test-set-1",
      name: "Test Set",
      category: "test",
      description: "A test symbol set",
      symbols: { "test-symbol-1": { weight: 1.0 } },
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
        expect(responseData.symbols).toEqual([mockSymbol]);
        expect(responseData.count).toBe(1);
        expect(responseData.message).toContain("Retrieved 1 symbols");
        expect(mockDatabase.getSymbols).toHaveBeenCalledWith({ limit: 10 });
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
        expect(responseData.error).toBe("Failed to retrieve symbols");
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

        expect(mockDatabase.getSymbols).toHaveBeenCalledWith({ limit: 50 });
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
        expect(responseData.symbols).toEqual([mockSymbol]);
        expect(responseData.count).toBe(1);
        expect(responseData.query).toBe("test");
        expect(responseData.message).toContain(
          'Found 1 symbols matching "test"'
        );
        expect(mockDatabase.searchSymbols).toHaveBeenCalledWith("test", {
          limit: 10,
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
        expect(responseData.error).toBe("Failed to search symbols");
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
        expect(responseData.symbols).toEqual([mockSymbol]);
        expect(responseData.count).toBe(1);
        expect(responseData.category).toBe("test");
        expect(responseData.message).toContain(
          'Found 1 symbols in category "test"'
        );
        expect(mockDatabase.filterByCategory).toHaveBeenCalledWith("test", {
          limit: 10,
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
        expect(responseData.error).toBe("Failed to retrieve categories");
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
        expect(responseData.symbol_sets).toEqual([mockSymbolSet]);
        expect(responseData.count).toBe(1);
        expect(responseData.message).toContain("Retrieved 1 symbol sets");
        expect(mockDatabase.getSymbolSets).toHaveBeenCalledWith({ limit: 10 });
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
        expect(responseData.symbol_sets).toEqual([mockSymbolSet]);
        expect(responseData.count).toBe(1);
        expect(responseData.query).toBe("test");
        expect(responseData.message).toContain(
          'Found 1 symbol sets matching "test"'
        );
        expect(mockDatabase.searchSymbolSets).toHaveBeenCalledWith("test", {
          limit: 10,
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
