import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PostgreSQLDatabase, type IDatabase } from "./Database.js";
import type { Symbol, SymbolSet } from "@/types/Symbol.js";

// Mock pg module
vi.mock("pg", () => ({
  Pool: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue({
      query: vi.fn(),
      release: vi.fn(),
    }),
    end: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe("Database Layer", () => {
  let database: IDatabase;
  let mockPool: any;
  let mockClient: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Set up mock client
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    // Set up mock pool
    mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
      end: vi.fn().mockResolvedValue(undefined),
    };

    // Mock Pool constructor
    const { Pool } = await import("pg");
    vi.mocked(Pool).mockImplementation(() => mockPool);

    // Create database instance
    database = new PostgreSQLDatabase(
      "postgres://test:test@localhost:5432/test_db"
    );
  });

  afterEach(async () => {
    await database.disconnect();
  });

  describe("Connection Management", () => {
    describe("connect", () => {
      it("should establish database connection successfully", async () => {
        await expect(database.connect()).resolves.not.toThrow();

        expect(mockPool.connect).toHaveBeenCalled();
        expect(mockClient.release).toHaveBeenCalled();
      });

      it("should throw error if connection fails", async () => {
        mockPool.connect.mockRejectedValue(new Error("Connection failed"));

        await expect(database.connect()).rejects.toThrow(
          "Failed to connect to database: Connection failed"
        );
      });
    });

    describe("disconnect", () => {
      it("should close database connection", async () => {
        await database.connect();
        await database.disconnect();

        expect(mockPool.end).toHaveBeenCalled();
      });

      it("should handle disconnect when not connected", async () => {
        await expect(database.disconnect()).resolves.not.toThrow();
      });
    });

    describe("healthCheck", () => {
      it("should return healthy status", async () => {
        await database.connect();

        const mockHealthResult = {
          rows: [{ status: "healthy", timestamp: new Date() }],
        };
        mockClient.query.mockResolvedValue(mockHealthResult);

        const result = await database.healthCheck();

        expect(result.success).toBe(true);
        expect(result.data?.status).toBe("healthy");
        expect(result.data?.timestamp).toBeInstanceOf(Date);
      });

      it("should handle health check failure", async () => {
        await database.connect();
        mockClient.query.mockRejectedValue(new Error("Health check failed"));

        const result = await database.healthCheck();

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Health check failed");
      });
    });
  });

  describe("Symbol Operations", () => {
    const mockSymbol: Symbol = {
      id: "test-symbol-1",
      name: "Test Symbol",
      category: "test",
      description: "A test symbol",
      interpretations: { test: "test interpretation" },
      related_symbols: ["test-symbol-2"],
      properties: { test: true },
    };

    beforeEach(async () => {
      await database.connect();
    });

    describe("getSymbols", () => {
      it("should return symbols with default pagination", async () => {
        const mockResult = {
          rows: [mockSymbol],
        };
        mockClient.query.mockResolvedValue(mockResult);

        const result = await database.getSymbols();

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbol]);
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining("SELECT id, name, category"),
          [50, 0]
        );
      });

      it("should respect custom pagination options", async () => {
        const mockResult = { rows: [] };
        mockClient.query.mockResolvedValue(mockResult);

        await database.getSymbols({ limit: 10, offset: 20 });

        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining("LIMIT $1 OFFSET $2"),
          [10, 20]
        );
      });

      it("should handle database errors gracefully", async () => {
        mockClient.query.mockRejectedValue(new Error("Database error"));

        const result = await database.getSymbols();

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Database error");
      });
    });

    describe("searchSymbols", () => {
      it("should search symbols by query", async () => {
        const mockResult = { rows: [mockSymbol] };
        mockClient.query.mockResolvedValue(mockResult);

        const result = await database.searchSymbols("test");

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbol]);
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining("WHERE"),
          ["%test%", 50, 0]
        );
      });

      it("should handle empty search results", async () => {
        mockClient.query.mockResolvedValue({ rows: [] });

        const result = await database.searchSymbols("nonexistent");

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe("filterByCategory", () => {
      it("should filter symbols by category", async () => {
        const mockResult = { rows: [mockSymbol] };
        mockClient.query.mockResolvedValue(mockResult);

        const result = await database.filterByCategory("test");

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbol]);
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining("WHERE category = $1"),
          ["test", 50, 0]
        );
      });
    });

    describe("getCategories", () => {
      it("should return list of unique categories", async () => {
        const mockResult = {
          rows: [{ category: "test" }, { category: "demo" }],
        };
        mockClient.query.mockResolvedValue(mockResult);

        const result = await database.getCategories();

        expect(result.success).toBe(true);
        expect(result.data).toEqual(["test", "demo"]);
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining("SELECT DISTINCT category"),
          []
        );
      });
    });
  });

  describe("SymbolSet Operations", () => {
    const mockSymbolSet: SymbolSet = {
      id: "test-set-1",
      name: "Test Set",
      category: "test",
      description: "A test symbol set",
      symbols: { "test-symbol-1": { weight: 1.0 } },
    };

    beforeEach(async () => {
      await database.connect();
    });

    describe("getSymbolSets", () => {
      it("should return symbol sets with pagination", async () => {
        const mockResult = { rows: [mockSymbolSet] };
        mockClient.query.mockResolvedValue(mockResult);

        const result = await database.getSymbolSets();

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbolSet]);
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining("FROM symbol_sets"),
          [50, 0]
        );
      });
    });

    describe("searchSymbolSets", () => {
      it("should search symbol sets by query", async () => {
        const mockResult = { rows: [mockSymbolSet] };
        mockClient.query.mockResolvedValue(mockResult);

        const result = await database.searchSymbolSets("test");

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbolSet]);
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.stringContaining("WHERE"),
          ["%test%", 50, 0]
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle queries when not connected", async () => {
      const result = await database.getSymbols();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Database not connected");
    });
  });
});
