import { PrismaClient } from "@prisma/client";
import type {
  Symbol,
  SymbolSet,
  QueryResult,
  QueryOptions,
} from "@/types/Symbol.js";
import type { IDatabase } from "./Database.js";

/**
 * Prisma-based database implementation
 */
export class PrismaDatabase implements IDatabase {
  private prisma: PrismaClient | null = null;

  constructor() {
    // Prisma client will be initialized in connect()
  }

  async connect(): Promise<void> {
    try {
      this.prisma = new PrismaClient();

      // Test the connection
      await this.prisma.$connect();
      console.error("✓ Database connected successfully with Prisma");
    } catch (error) {
      throw new Error(
        `Failed to connect to database: ${(error as Error).message}`
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
  }

  async initializeSchema(includeSampleData = false): Promise<void> {
    if (!this.prisma) {
      throw new Error("Database not connected");
    }

    try {
      // Push the schema to the database
      const { execSync } = await import("child_process");
      execSync("npx prisma db push", { stdio: "inherit" });

      if (includeSampleData) {
        // Run the seed script
        execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
      }

      console.error("✓ Database schema initialized successfully with Prisma");
    } catch (error) {
      throw new Error(
        `Failed to initialize database schema: ${(error as Error).message}`
      );
    }
  }

  async getSymbols(options: QueryOptions = {}): Promise<QueryResult<Symbol[]>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      const { limit = 50, offset = 0 } = options;

      const symbols = await this.prisma.symbol.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      });

      return { success: true, data: symbols as Symbol[] };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async searchSymbols(
    query: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Symbol[]>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      const { limit = 50, offset = 0 } = options;

      const symbols = await this.prisma.symbol.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      });

      return { success: true, data: symbols as Symbol[] };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async filterByCategory(
    category: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Symbol[]>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      const { limit = 50, offset = 0 } = options;

      const symbols = await this.prisma.symbol.findMany({
        where: { category },
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      });

      return { success: true, data: symbols as Symbol[] };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getCategories(): Promise<QueryResult<string[]>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      const result = await this.prisma.symbol.findMany({
        where: {
          category: { not: null },
        },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      });

      const categories = result
        .map((item: { category: string | null }) => item.category)
        .filter((category): category is string => category !== null);

      return { success: true, data: categories };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getSymbolSets(
    options: QueryOptions = {}
  ): Promise<QueryResult<SymbolSet[]>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      const { limit = 50, offset = 0 } = options;

      const symbolSets = await this.prisma.symbolSet.findMany({
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      });

      return { success: true, data: symbolSets as SymbolSet[] };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async searchSymbolSets(
    query: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<SymbolSet[]>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      const { limit = 50, offset = 0 } = options;

      const symbolSets = await this.prisma.symbolSet.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        take: limit,
        skip: offset,
        orderBy: { name: "asc" },
      });

      return { success: true, data: symbolSets as SymbolSet[] };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async healthCheck(): Promise<
    QueryResult<{ status: string; timestamp: Date }>
  > {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        success: true,
        data: {
          status: "healthy",
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
