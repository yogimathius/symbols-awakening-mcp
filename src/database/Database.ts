import {
  Pool,
  PoolClient,
  QueryResult as PgQueryResult,
  QueryResultRow,
} from "pg";
import type {
  Symbol,
  SymbolSet,
  QueryResult,
  QueryOptions,
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
}

/**
 * PostgreSQL database implementation
 */
export class PostgreSQLDatabase implements IDatabase {
  private pool: Pool | null = null;
  private readonly connectionString: string;

  constructor(connectionString?: string) {
    this.connectionString =
      connectionString ??
      process.env.DATABASE_URL ??
      "postgres://localhost:5432/symbols_awakening";
  }

  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        connectionString: this.connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test the connection
      const client = await this.pool.connect();
      client.release();
    } catch (error) {
      throw new Error(
        `Failed to connect to database: ${(error as Error).message}`
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async getSymbols(options: QueryOptions = {}): Promise<QueryResult<Symbol[]>> {
    try {
      const { limit = 50, offset = 0 } = options;
      const query = `
        SELECT id, name, category, description, interpretations, related_symbols, properties
        FROM symbols
        ORDER BY name
        LIMIT $1 OFFSET $2
      `;

      const result = await this.executeQuery<Symbol>(query, [limit, offset]);
      return { success: true, data: result.rows };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async searchSymbols(
    searchQuery: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Symbol[]>> {
    try {
      const { limit = 50, offset = 0 } = options;
      const query = `
        SELECT id, name, category, description, interpretations, related_symbols, properties
        FROM symbols
        WHERE 
          name ILIKE $1 OR 
          description ILIKE $1 OR 
          category ILIKE $1
        ORDER BY 
          CASE 
            WHEN name ILIKE $1 THEN 1
            WHEN category ILIKE $1 THEN 2
            ELSE 3
          END,
          name
        LIMIT $2 OFFSET $3
      `;

      const searchPattern = `%${searchQuery}%`;
      const result = await this.executeQuery<Symbol>(query, [
        searchPattern,
        limit,
        offset,
      ]);
      return { success: true, data: result.rows };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async filterByCategory(
    category: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Symbol[]>> {
    try {
      const { limit = 50, offset = 0 } = options;
      const query = `
        SELECT id, name, category, description, interpretations, related_symbols, properties
        FROM symbols
        WHERE category = $1
        ORDER BY name
        LIMIT $2 OFFSET $3
      `;

      const result = await this.executeQuery<Symbol>(query, [
        category,
        limit,
        offset,
      ]);
      return { success: true, data: result.rows };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getCategories(): Promise<QueryResult<string[]>> {
    try {
      const query = `
        SELECT DISTINCT category
        FROM symbols
        WHERE category IS NOT NULL
        ORDER BY category
      `;

      const result = await this.executeQuery<{ category: string }>(query, []);
      const categories = result.rows.map((row) => row.category);
      return { success: true, data: categories };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getSymbolSets(
    options: QueryOptions = {}
  ): Promise<QueryResult<SymbolSet[]>> {
    try {
      const { limit = 50, offset = 0 } = options;
      const query = `
        SELECT id, name, category, description, symbols
        FROM symbol_sets
        ORDER BY name
        LIMIT $1 OFFSET $2
      `;

      const result = await this.executeQuery<SymbolSet>(query, [limit, offset]);
      return { success: true, data: result.rows };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async searchSymbolSets(
    searchQuery: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<SymbolSet[]>> {
    try {
      const { limit = 50, offset = 0 } = options;
      const query = `
        SELECT id, name, category, description, symbols
        FROM symbol_sets
        WHERE 
          name ILIKE $1 OR 
          description ILIKE $1 OR 
          category ILIKE $1
        ORDER BY 
          CASE 
            WHEN name ILIKE $1 THEN 1
            WHEN category ILIKE $1 THEN 2
            ELSE 3
          END,
          name
        LIMIT $2 OFFSET $3
      `;

      const searchPattern = `%${searchQuery}%`;
      const result = await this.executeQuery<SymbolSet>(query, [
        searchPattern,
        limit,
        offset,
      ]);
      return { success: true, data: result.rows };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async healthCheck(): Promise<
    QueryResult<{ status: string; timestamp: Date }>
  > {
    try {
      const query = "SELECT 'healthy' as status, NOW() as timestamp";
      const result = await this.executeQuery<{
        status: string;
        timestamp: Date;
      }>(query, []);

      if (result.rows.length > 0) {
        const healthData = result.rows[0];
        if (healthData) {
          return { success: true, data: healthData };
        }
      }

      return {
        success: false,
        error: new Error("Health check returned no results"),
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Execute a parameterized query safely
   */
  private async executeQuery<T extends QueryResultRow>(
    query: string,
    params: unknown[]
  ): Promise<PgQueryResult<T>> {
    if (!this.pool) {
      throw new Error("Database not connected");
    }

    const client: PoolClient = await this.pool.connect();
    try {
      return await client.query<T>(query, params);
    } finally {
      client.release();
    }
  }
}
