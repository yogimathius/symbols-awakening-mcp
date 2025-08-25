import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Symbol, SymbolSet } from "@/types/Symbol.js";

import { type IDatabase, PrismaDatabase } from "./Database.js";

// Mock Prisma Client
const mockPrismaClient = {
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
  symbol: {
    findMany: vi.fn(),
  },
  symbolSet: {
    findMany: vi.fn(),
  },
};

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

describe("Database Layer", () => {
  let database: IDatabase;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create database instance
    database = new PrismaDatabase();
  });

  afterEach(async () => {
    await database.disconnect();
  });

  describe("Connection Management", () => {
    describe("connect", () => {
      it("should establish database connection successfully", async () => {
        mockPrismaClient.$connect.mockResolvedValue(undefined);

        await expect(database.connect()).resolves.not.toThrow();

        expect(mockPrismaClient.$connect).toHaveBeenCalled();
      });

      it("should throw error if connection fails", async () => {
        mockPrismaClient.$connect.mockRejectedValue(
          new Error("Connection failed")
        );

        await expect(database.connect()).rejects.toThrow(
          "Failed to connect to database: Connection failed"
        );
      });
    });

    describe("disconnect", () => {
      it("should close database connection", async () => {
        mockPrismaClient.$connect.mockResolvedValue(undefined);
        mockPrismaClient.$disconnect.mockResolvedValue(undefined);

        await database.connect();
        await database.disconnect();

        expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
      });

      it("should handle disconnect when not connected", async () => {
        await expect(database.disconnect()).resolves.not.toThrow();
      });
    });

    describe("healthCheck", () => {
      it("should return healthy status", async () => {
        mockPrismaClient.$connect.mockResolvedValue(undefined);
        mockPrismaClient.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);

        await database.connect();
        const result = await database.healthCheck();

        expect(result.success).toBe(true);
        expect(result.data?.status).toBe("healthy");
        expect(result.data?.timestamp).toBeInstanceOf(Date);
        expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
      });

      it("should handle health check failure", async () => {
        mockPrismaClient.$connect.mockResolvedValue(undefined);
        mockPrismaClient.$queryRaw.mockRejectedValue(
          new Error("Health check failed")
        );

        await database.connect();
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
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      await database.connect();
    });

    describe("getSymbols", () => {
      it("should return symbols with default pagination", async () => {
        mockPrismaClient.symbol.findMany.mockResolvedValue([mockSymbol]);

        const result = await database.getSymbols();

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbol]);
        expect(mockPrismaClient.symbol.findMany).toHaveBeenCalledWith({
          take: 50,
          skip: 0,
          orderBy: { name: "asc" },
        });
      });

      it("should respect custom pagination options", async () => {
        mockPrismaClient.symbol.findMany.mockResolvedValue([]);

        await database.getSymbols({ limit: 10, offset: 20 });

        expect(mockPrismaClient.symbol.findMany).toHaveBeenCalledWith({
          take: 10,
          skip: 20,
          orderBy: { name: "asc" },
        });
      });

      it("should handle database errors gracefully", async () => {
        mockPrismaClient.symbol.findMany.mockRejectedValue(
          new Error("Database error")
        );

        const result = await database.getSymbols();

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Database error");
      });
    });

    describe("searchSymbols", () => {
      it("should search symbols by query", async () => {
        mockPrismaClient.symbol.findMany.mockResolvedValue([mockSymbol]);

        const result = await database.searchSymbols("test");

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbol]);
        expect(mockPrismaClient.symbol.findMany).toHaveBeenCalledWith({
          where: {
            OR: [
              { name: { contains: "test", mode: "insensitive" } },
              { description: { contains: "test", mode: "insensitive" } },
              { category: { contains: "test", mode: "insensitive" } },
            ],
          },
          take: 50,
          skip: 0,
          orderBy: { name: "asc" },
        });
      });

      it("should handle empty search results", async () => {
        mockPrismaClient.symbol.findMany.mockResolvedValue([]);

        const result = await database.searchSymbols("nonexistent");

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe("filterByCategory", () => {
      it("should filter symbols by category", async () => {
        mockPrismaClient.symbol.findMany.mockResolvedValue([mockSymbol]);

        const result = await database.filterByCategory("test");

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbol]);
        expect(mockPrismaClient.symbol.findMany).toHaveBeenCalledWith({
          where: { category: "test" },
          take: 50,
          skip: 0,
          orderBy: { name: "asc" },
        });
      });
    });

    describe("getCategories", () => {
      it("should return list of unique categories", async () => {
        mockPrismaClient.symbol.findMany.mockResolvedValue([
          { category: "test" },
          { category: "demo" },
        ]);

        const result = await database.getCategories();

        expect(result.success).toBe(true);
        expect(result.data).toEqual(["test", "demo"]);
        expect(mockPrismaClient.symbol.findMany).toHaveBeenCalledWith({
          where: { category: { not: null } },
          select: { category: true },
          distinct: ["category"],
          orderBy: { category: "asc" },
        });
      });

      it("should filter out null categories", async () => {
        mockPrismaClient.symbol.findMany.mockResolvedValue([
          { category: "test" },
          { category: null },
          { category: "demo" },
        ]);

        const result = await database.getCategories();

        expect(result.success).toBe(true);
        expect(result.data).toEqual(["test", "demo"]);
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
      created_at: new Date(),
      updated_at: new Date(),
    };

    beforeEach(async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      await database.connect();
    });

    describe("getSymbolSets", () => {
      it("should return symbol sets with pagination", async () => {
        mockPrismaClient.symbolSet.findMany.mockResolvedValue([mockSymbolSet]);

        const result = await database.getSymbolSets();

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbolSet]);
        expect(mockPrismaClient.symbolSet.findMany).toHaveBeenCalledWith({
          take: 50,
          skip: 0,
          orderBy: { name: "asc" },
        });
      });

      it("should respect custom pagination options", async () => {
        mockPrismaClient.symbolSet.findMany.mockResolvedValue([]);

        await database.getSymbolSets({ limit: 10, offset: 20 });

        expect(mockPrismaClient.symbolSet.findMany).toHaveBeenCalledWith({
          take: 10,
          skip: 20,
          orderBy: { name: "asc" },
        });
      });
    });

    describe("searchSymbolSets", () => {
      it("should search symbol sets by query", async () => {
        mockPrismaClient.symbolSet.findMany.mockResolvedValue([mockSymbolSet]);

        const result = await database.searchSymbolSets("test");

        expect(result.success).toBe(true);
        expect(result.data).toEqual([mockSymbolSet]);
        expect(mockPrismaClient.symbolSet.findMany).toHaveBeenCalledWith({
          where: {
            OR: [
              { name: { contains: "test", mode: "insensitive" } },
              { description: { contains: "test", mode: "insensitive" } },
              { category: { contains: "test", mode: "insensitive" } },
            ],
          },
          take: 50,
          skip: 0,
          orderBy: { name: "asc" },
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle queries when not connected", async () => {
      const result = await database.getSymbols();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Database not connected");
    });

    it("should handle symbol search when not connected", async () => {
      const result = await database.searchSymbols("test");

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Database not connected");
    });

    it("should handle category filtering when not connected", async () => {
      const result = await database.filterByCategory("test");

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Database not connected");
    });

    it("should handle get categories when not connected", async () => {
      const result = await database.getCategories();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Database not connected");
    });

    it("should handle symbol sets when not connected", async () => {
      const result = await database.getSymbolSets();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Database not connected");
    });

    it("should handle symbol set search when not connected", async () => {
      const result = await database.searchSymbolSets("test");

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Database not connected");
    });

    it("should handle health check when not connected", async () => {
      const result = await database.healthCheck();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Database not connected");
    });
  });
});
