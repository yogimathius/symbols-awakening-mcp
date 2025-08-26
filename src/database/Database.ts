import { PrismaClient, Prisma } from "@prisma/client";

import type {
  QueryOptions,
  QueryResult,
  Symbol,
  SymbolSet,
} from "@/types/Symbol.js";

/**
 * Database connection and query interface for the symbols ontology
 */
export interface IDatabase {
  /**
   * Initialize the database connection
   */
  connect(): Promise<void>;

  /**
   * Close the database connection
   */
  disconnect(): Promise<void>;

  /**
   * Initialize database schema (tables, indexes, etc.)
   */
  initializeSchema(includeSampleData?: boolean): Promise<void>;

  /**
   * Get symbols with optional filtering and pagination
   */
  getSymbols(options?: QueryOptions): Promise<QueryResult<Symbol[]>>;

  /**
   * Search symbols by text query
   */
  searchSymbols(
    query: string,
    options?: QueryOptions
  ): Promise<QueryResult<Symbol[]>>;

  /**
   * Filter symbols by category
   */
  filterByCategory(
    category: string,
    options?: QueryOptions
  ): Promise<QueryResult<Symbol[]>>;

  /**
   * Get all available categories
   */
  getCategories(): Promise<QueryResult<string[]>>;

  /**
   * Get symbol sets with optional pagination
   */
  getSymbolSets(options?: QueryOptions): Promise<QueryResult<SymbolSet[]>>;

  /**
   * Search symbol sets by text query
   */
  searchSymbolSets(
    query: string,
    options?: QueryOptions
  ): Promise<QueryResult<SymbolSet[]>>;

  /**
   * Health check for database connection
   */
  healthCheck(): Promise<QueryResult<{ status: string; timestamp: Date }>>;

  /**
   * Create a new symbol
   */
  createSymbol(symbol: Omit<Symbol, 'created_at' | 'updated_at'>): Promise<QueryResult<Symbol>>;

  /**
   * Update an existing symbol
   */
  updateSymbol(id: string, updates: Partial<Omit<Symbol, 'id' | 'created_at' | 'updated_at'>>): Promise<QueryResult<Symbol>>;

  /**
   * Delete a symbol by ID
   */
  deleteSymbol(id: string, cascade?: boolean): Promise<QueryResult<boolean>>;

  /**
   * Create a new symbol set
   */
  createSymbolSet(symbolSet: Omit<SymbolSet, 'created_at' | 'updated_at'>): Promise<QueryResult<SymbolSet>>;

  /**
   * Update an existing symbol set
   */
  updateSymbolSet(id: string, updates: Partial<Omit<SymbolSet, 'id' | 'created_at' | 'updated_at'>>): Promise<QueryResult<SymbolSet>>;
}

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
      // eslint-disable-next-line no-console, no-undef
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

      // eslint-disable-next-line no-console, no-undef
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
        .filter(
          (category: string | null): category is string => category !== null
        );

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

  async createSymbol(symbol: Omit<Symbol, 'created_at' | 'updated_at'>): Promise<QueryResult<Symbol>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      const createdSymbol = await this.prisma.symbol.create({
        data: {
          id: symbol.id,
          name: symbol.name,
          category: symbol.category,
          description: symbol.description,
          interpretations: symbol.interpretations as Prisma.InputJsonValue,
          related_symbols: symbol.related_symbols,
          properties: symbol.properties as Prisma.InputJsonValue,
        },
      });

      return { success: true, data: createdSymbol as Symbol };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return { success: false, error: new Error(`Symbol with ID "${symbol.id}" already exists`) };
      }
      return { success: false, error: error as Error };
    }
  }

  async updateSymbol(id: string, updates: Partial<Omit<Symbol, 'id' | 'created_at' | 'updated_at'>>): Promise<QueryResult<Symbol>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      // Check if symbol exists
      const existingSymbol = await this.prisma.symbol.findUnique({
        where: { id },
      });

      if (!existingSymbol) {
        return { success: false, error: new Error(`Symbol with ID "${id}" not found`) };
      }

      const updatedSymbol = await this.prisma.symbol.update({
        where: { id },
        data: {
          ...(updates as Prisma.SymbolUpdateInput),
          updated_at: new Date(),
        },
      });

      return { success: true, data: updatedSymbol as Symbol };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async deleteSymbol(id: string, cascade: boolean = false): Promise<QueryResult<boolean>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      // Check if symbol exists
      const existingSymbol = await this.prisma.symbol.findUnique({
        where: { id },
      });

      if (!existingSymbol) {
        return { success: false, error: new Error(`Symbol with ID "${id}" not found`) };
      }

      // If cascade is true, remove this symbol from related_symbols arrays
      if (cascade) {
        // Find all symbols that reference this symbol
        const referencingSymbols = await this.prisma.symbol.findMany({
          where: {
            related_symbols: {
              has: id,
            },
          },
        });

        // Update each referencing symbol to remove this ID
        for (const refSymbol of referencingSymbols) {
          const updatedRelatedSymbols = (refSymbol.related_symbols as string[]).filter(
            (relatedId) => relatedId !== id
          );
          
          await this.prisma.symbol.update({
            where: { id: refSymbol.id },
            data: {
              related_symbols: updatedRelatedSymbols,
              updated_at: new Date(),
            },
          });
        }
      }

      // Delete the symbol
      await this.prisma.symbol.delete({
        where: { id },
      });

      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async createSymbolSet(symbolSet: Omit<SymbolSet, 'created_at' | 'updated_at'>): Promise<QueryResult<SymbolSet>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      const createdSymbolSet = await this.prisma.symbolSet.create({
        data: {
          id: symbolSet.id,
          name: symbolSet.name,
          category: symbolSet.category,
          description: symbolSet.description,
          symbols: symbolSet.symbols as Prisma.InputJsonValue,
        },
      });

      return { success: true, data: createdSymbolSet as SymbolSet };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return { success: false, error: new Error(`Symbol set with ID "${symbolSet.id}" already exists`) };
      }
      return { success: false, error: error as Error };
    }
  }

  async updateSymbolSet(id: string, updates: Partial<Omit<SymbolSet, 'id' | 'created_at' | 'updated_at'>>): Promise<QueryResult<SymbolSet>> {
    try {
      if (!this.prisma) {
        throw new Error("Database not connected");
      }

      // Check if symbol set exists
      const existingSymbolSet = await this.prisma.symbolSet.findUnique({
        where: { id },
      });

      if (!existingSymbolSet) {
        return { success: false, error: new Error(`Symbol set with ID "${id}" not found`) };
      }

      const updatedSymbolSet = await this.prisma.symbolSet.update({
        where: { id },
        data: {
          ...(updates as Prisma.SymbolSetUpdateInput),
          updated_at: new Date(),
        },
      });

      return { success: true, data: updatedSymbolSet as SymbolSet };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
