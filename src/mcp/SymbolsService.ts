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
    this.registerGetSymbols();
    this.registerSearchSymbols();
    this.registerFilterByCategory();
    this.registerGetCategories();
    this.registerGetSymbolSets();
    this.registerSearchSymbolSets();
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
}
