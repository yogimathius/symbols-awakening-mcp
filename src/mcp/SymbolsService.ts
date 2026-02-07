import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { IDatabase } from "@/database/Database.js";

/**
 * Zod schema definitions for MCP tool parameters
 */
export const TOOL_SCHEMAS = {
  get_symbols: {
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(50)
      .optional()
      .describe("Maximum number of symbols to return"),
  },

  get_symbol: {
    id: z
      .string()
      .min(1)
      .describe("Unique identifier of the symbol to retrieve"),
  },

  search_symbols: {
    query: z
      .string()
      .describe(
        "Search text to match against symbol names, descriptions, and categories"
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(50)
      .optional()
      .describe("Maximum number of symbols to return"),
  },

  filter_by_category: {
    category: z.string().describe("Category name to filter symbols by"),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(50)
      .optional()
      .describe("Maximum number of symbols to return"),
  },

  get_categories: {},

  get_symbol_sets: {
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(50)
      .optional()
      .describe("Maximum number of symbol sets to return"),
  },

  search_symbol_sets: {
    query: z
      .string()
      .describe(
        "Search text to match against symbol set names, descriptions, and categories"
      ),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(50)
      .optional()
      .describe("Maximum number of symbol sets to return"),
  },

  // Symbol creation and editing tools
  create_symbol: {
    id: z
      .string()
      .min(1)
      .max(255)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .describe("Unique identifier for the symbol (alphanumeric, underscore, hyphen only)"),
    name: z
      .string()
      .min(1)
      .max(255)
      .describe("Human-readable name of the symbol"),
    category: z
      .string()
      .min(1)
      .max(100)
      .describe("Category classification of the symbol"),
    description: z
      .string()
      .min(1)
      .max(2000)
      .describe("Detailed description of the symbol's meaning"),
    interpretations: z
      .record(z.string())
      .default({})
      .describe("Various interpretations across different contexts"),
    related_symbols: z
      .array(z.string())
      .default([])
      .describe("Array of related symbol IDs"),
    properties: z
      .record(z.unknown())
      .default({})
      .describe("Additional properties and metadata"),
  },

  update_symbol: {
    id: z
      .string()
      .min(1)
      .describe("Unique identifier of the symbol to update"),
    name: z
      .string()
      .min(1)
      .max(255)
      .optional()
      .describe("Human-readable name of the symbol"),
    category: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe("Category classification of the symbol"),
    description: z
      .string()
      .min(1)
      .max(2000)
      .optional()
      .describe("Detailed description of the symbol's meaning"),
    interpretations: z
      .record(z.string())
      .optional()
      .describe("Various interpretations across different contexts"),
    related_symbols: z
      .array(z.string())
      .optional()
      .describe("Array of related symbol IDs"),
    properties: z
      .record(z.unknown())
      .optional()
      .describe("Additional properties and metadata"),
  },

  delete_symbol: {
    id: z
      .string()
      .min(1)
      .describe("Unique identifier of the symbol to delete"),
    cascade: z
      .boolean()
      .default(false)
      .describe("Whether to remove this symbol from related_symbols arrays of other symbols"),
  },

  create_symbol_set: {
    id: z
      .string()
      .min(1)
      .max(255)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .describe("Unique identifier for the symbol set"),
    name: z
      .string()
      .min(1)
      .max(255)
      .describe("Human-readable name of the symbol set"),
    category: z
      .string()
      .min(1)
      .max(100)
      .describe("Category classification of the symbol set"),
    description: z
      .string()
      .min(1)
      .max(2000)
      .describe("Description of the symbol set's purpose"),
    symbols: z
      .record(z.object({ weight: z.number().min(0).max(1).default(1.0) }))
      .default({})
      .describe("Map of symbol IDs to their weights in this set"),
  },

  update_symbol_set: {
    id: z
      .string()
      .min(1)
      .describe("Unique identifier of the symbol set to update"),
    name: z
      .string()
      .min(1)
      .max(255)
      .optional()
      .describe("Human-readable name of the symbol set"),
    category: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .describe("Category classification of the symbol set"),
    description: z
      .string()
      .min(1)
      .max(2000)
      .optional()
      .describe("Description of the symbol set's purpose"),
    symbols: z
      .record(z.object({ weight: z.number().min(0).max(1).default(1.0) }))
      .optional()
      .describe("Map of symbol IDs to their weights in this set"),
  },
} as const;

/**
 * Service class that registers all MCP tools for the symbols ontology
 */
export class SymbolsService {
  constructor(
    private readonly server: McpServer,
    private readonly database: IDatabase
  ) {}

  /**
   * Register all MCP tools with the server
   */
  registerTools(): void {
    // Read-only tools
    this.registerGetSymbols();
    this.registerGetSymbol();
    this.registerSearchSymbols();
    this.registerFilterByCategory();
    this.registerGetCategories();
    this.registerGetSymbolSets();
    this.registerSearchSymbolSets();
    
    // CRUD tools
    this.registerCreateSymbol();
    this.registerUpdateSymbol();
    this.registerDeleteSymbol();
    this.registerCreateSymbolSet();
    this.registerUpdateSymbolSet();
  }

  /**
   * Get a symbol by ID
   */
  private registerGetSymbol(): void {
    this.server.tool(
      "get_symbol",
      "Get a symbol by ID",
      TOOL_SCHEMAS.get_symbol,
      async (args) => {
        try {
          const { id } = args as { id: string };

          if (!id.trim()) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Symbol ID cannot be empty",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const result = await this.database.getSymbol(id);

          if (!result.success) {
            throw new Error(result.error?.message ?? "Failed to get symbol");
          }

          const symbol = result.data ?? null;

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    found: symbol !== null,
                    symbol,
                    message:
                      symbol !== null
                        ? `Found symbol "${id}"`
                        : `No symbol found with ID "${id}"`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Internal error while retrieving symbol",
                    details: (error as Error).message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Get symbols with optional limit
   */
  private registerGetSymbols(): void {
    this.server.tool(
      "get_symbols",
      "List symbols with optional limit",
      TOOL_SCHEMAS.get_symbols,
      async (args) => {
        try {
          const limit = typeof args.limit === "number" ? args.limit : 50;

          const result = await this.database.getSymbols({
            limit,
            offset: 0,
          });

          if (!result.success) {
            throw new Error(result.error?.message ?? "Failed to get symbols");
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    symbols: result.data ?? [],
                    count: result.data?.length ?? 0,
                    message: `Retrieved ${result.data?.length ?? 0} symbols`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Internal error while retrieving symbols",
                    details: (error as Error).message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Search symbols by text query
   */
  private registerSearchSymbols(): void {
    this.server.tool(
      "search_symbols",
      "Search symbols by text query across names, descriptions, and categories",
      TOOL_SCHEMAS.search_symbols,
      async (args) => {
        try {
          const { query } = args as {
            query: string;
            limit?: number;
          };

          if (!query.trim()) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Search query cannot be empty",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const searchLimit = typeof args.limit === "number" ? args.limit : 50;

          const result = await this.database.searchSymbols(query, {
            limit: searchLimit,
            offset: 0,
          });

          if (!result.success) {
            throw new Error(
              result.error?.message ?? "Failed to search symbols"
            );
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    symbols: result.data ?? [],
                    count: result.data?.length ?? 0,
                    query,
                    message: `Found ${
                      result.data?.length ?? 0
                    } symbols matching "${query}"`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Internal error while searching symbols",
                    details: (error as Error).message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Filter symbols by category
   */
  private registerFilterByCategory(): void {
    this.server.tool(
      "filter_by_category",
      "Filter symbols by category name",
      TOOL_SCHEMAS.filter_by_category,
      async (args) => {
        try {
          const { category } = args as {
            category: string;
            limit?: number;
          };

          if (!category.trim()) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Category name cannot be empty",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const filterLimit = typeof args.limit === "number" ? args.limit : 50;

          const result = await this.database.filterByCategory(category, {
            limit: filterLimit,
            offset: 0,
          });

          if (!result.success) {
            throw new Error(
              result.error?.message ?? "Failed to filter symbols by category"
            );
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    symbols: result.data ?? [],
                    count: result.data?.length ?? 0,
                    category,
                    message: `Found ${
                      result.data?.length ?? 0
                    } symbols in category "${category}"`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Internal error while filtering symbols",
                    details: (error as Error).message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Get all available categories
   */
  private registerGetCategories(): void {
    this.server.tool(
      "get_categories",
      "Get all available symbol categories",
      TOOL_SCHEMAS.get_categories,
      async () => {
        try {
          const result = await this.database.getCategories();

          if (!result.success) {
            throw new Error(
              result.error?.message ?? "Failed to get categories"
            );
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    categories: result.data ?? [],
                    count: result.data?.length ?? 0,
                    message: `Retrieved ${result.data?.length ?? 0} categories`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Internal error while retrieving categories",
                    details: (error as Error).message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Get symbol sets with optional limit
   */
  private registerGetSymbolSets(): void {
    this.server.tool(
      "get_symbol_sets",
      "List symbol sets with optional limit",
      TOOL_SCHEMAS.get_symbol_sets,
      async (args) => {
        try {
          const symbolSetLimit =
            typeof args.limit === "number" ? args.limit : 50;

          const result = await this.database.getSymbolSets({
            limit: symbolSetLimit,
            offset: 0,
          });

          if (!result.success) {
            throw new Error(
              result.error?.message ?? "Failed to get symbol sets"
            );
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    symbol_sets: result.data ?? [],
                    count: result.data?.length ?? 0,
                    message: `Retrieved ${
                      result.data?.length ?? 0
                    } symbol sets`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Internal error while retrieving symbol sets",
                    details: (error as Error).message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Search symbol sets by text query
   */
  private registerSearchSymbolSets(): void {
    this.server.tool(
      "search_symbol_sets",
      "Search symbol sets by text query across names, descriptions, and categories",
      TOOL_SCHEMAS.search_symbol_sets,
      async (args) => {
        try {
          const { query } = args as {
            query: string;
            limit?: number;
          };

          if (!query.trim()) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Search query cannot be empty",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          const searchSetLimit =
            typeof args.limit === "number" ? args.limit : 50;

          const result = await this.database.searchSymbolSets(query, {
            limit: searchSetLimit,
            offset: 0,
          });

          if (!result.success) {
            throw new Error(
              result.error?.message ?? "Failed to search symbol sets"
            );
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    symbol_sets: result.data ?? [],
                    count: result.data?.length ?? 0,
                    query,
                    message: `Found ${
                      result.data?.length ?? 0
                    } symbol sets matching "${query}"`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Internal error while searching symbol sets",
                    details: (error as Error).message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Create a new symbol
   */
  private registerCreateSymbol(): void {
    this.server.tool(
      "create_symbol",
      "Create a new symbol in the ontology",
      TOOL_SCHEMAS.create_symbol,
      async (args) => {
        try {
          const symbolData = {
            id: args.id as string,
            name: args.name as string,
            category: args.category as string,
            description: args.description as string,
            interpretations: args.interpretations as Record<string, unknown> || {},
            related_symbols: args.related_symbols as string[] || [],
            properties: args.properties as Record<string, unknown> || {},
          };

          const result = await this.database.createSymbol(symbolData);

          if (!result.success) {
            throw result.error;
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    symbol: result.data,
                    message: `Successfully created symbol "${args.name}" with ID "${args.id}"`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: (error as Error).message,
                    message: `Failed to create symbol: ${(error as Error).message}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Update an existing symbol
   */
  private registerUpdateSymbol(): void {
    this.server.tool(
      "update_symbol",
      "Update an existing symbol in the ontology",
      TOOL_SCHEMAS.update_symbol,
      async (args) => {
        try {
          const updates: Record<string, unknown> = {};
          
          if (args.name !== undefined) {updates.name = args.name;}
          if (args.category !== undefined) {updates.category = args.category;}
          if (args.description !== undefined) {updates.description = args.description;}
          if (args.interpretations !== undefined) {updates.interpretations = args.interpretations;}
          if (args.related_symbols !== undefined) {updates.related_symbols = args.related_symbols;}
          if (args.properties !== undefined) {updates.properties = args.properties;}

          const result = await this.database.updateSymbol(args.id as string, updates);

          if (!result.success) {
            throw result.error;
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    symbol: result.data,
                    message: `Successfully updated symbol with ID "${args.id}"`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: (error as Error).message,
                    message: `Failed to update symbol: ${(error as Error).message}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Delete a symbol
   */
  private registerDeleteSymbol(): void {
    this.server.tool(
      "delete_symbol",
      "Delete a symbol from the ontology",
      TOOL_SCHEMAS.delete_symbol,
      async (args) => {
        try {
          const result = await this.database.deleteSymbol(
            args.id as string, 
            args.cascade as boolean || false
          );

          if (!result.success) {
            throw result.error;
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    deleted: result.data,
                    message: args.cascade 
                      ? `Successfully deleted symbol "${args.id}" and removed it from related symbols`
                      : `Successfully deleted symbol "${args.id}"`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: (error as Error).message,
                    message: `Failed to delete symbol: ${(error as Error).message}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Create a new symbol set
   */
  private registerCreateSymbolSet(): void {
    this.server.tool(
      "create_symbol_set",
      "Create a new symbol set in the ontology",
      TOOL_SCHEMAS.create_symbol_set,
      async (args) => {
        try {
          const symbolSetData = {
            id: args.id as string,
            name: args.name as string,
            category: args.category as string,
            description: args.description as string,
            symbols: args.symbols as Record<string, unknown> || {},
          };

          const result = await this.database.createSymbolSet(symbolSetData);

          if (!result.success) {
            throw result.error;
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    symbol_set: result.data,
                    message: `Successfully created symbol set "${args.name}" with ID "${args.id}"`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: (error as Error).message,
                    message: `Failed to create symbol set: ${(error as Error).message}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Update an existing symbol set
   */
  private registerUpdateSymbolSet(): void {
    this.server.tool(
      "update_symbol_set",
      "Update an existing symbol set in the ontology",
      TOOL_SCHEMAS.update_symbol_set,
      async (args) => {
        try {
          const updates: Record<string, unknown> = {};
          
          if (args.name !== undefined) {updates.name = args.name;}
          if (args.category !== undefined) {updates.category = args.category;}
          if (args.description !== undefined) {updates.description = args.description;}
          if (args.symbols !== undefined) {updates.symbols = args.symbols;}

          const result = await this.database.updateSymbolSet(args.id as string, updates);

          if (!result.success) {
            throw result.error;
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    symbol_set: result.data,
                    message: `Successfully updated symbol set with ID "${args.id}"`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: (error as Error).message,
                    message: `Failed to update symbol set: ${(error as Error).message}`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }
}
