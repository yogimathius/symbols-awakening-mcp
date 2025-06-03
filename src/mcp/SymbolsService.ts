import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { IDatabase } from "@/database/Database.js";

/**
 * Schema definitions for MCP tool parameters
 */
export const TOOL_SCHEMAS = {
  get_symbols: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of symbols to return",
        default: 50,
        minimum: 1,
        maximum: 100,
      },
    },
    additionalProperties: false,
  },

  search_symbols: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Search text to match against symbol names, descriptions, and categories",
      },
      limit: {
        type: "number",
        description: "Maximum number of symbols to return",
        default: 50,
        minimum: 1,
        maximum: 100,
      },
    },
    required: ["query"],
    additionalProperties: false,
  },

  filter_by_category: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Category name to filter symbols by",
      },
      limit: {
        type: "number",
        description: "Maximum number of symbols to return",
        default: 50,
        minimum: 1,
        maximum: 100,
      },
    },
    required: ["category"],
    additionalProperties: false,
  },

  get_categories: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },

  get_symbol_sets: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of symbol sets to return",
        default: 50,
        minimum: 1,
        maximum: 100,
      },
    },
    additionalProperties: false,
  },

  search_symbol_sets: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Search text to match against symbol set names, descriptions, and categories",
      },
      limit: {
        type: "number",
        description: "Maximum number of symbol sets to return",
        default: 50,
        minimum: 1,
        maximum: 100,
      },
    },
    required: ["query"],
    additionalProperties: false,
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
          const { limit = 50 } = args as { limit?: number };

          const result = await this.database.getSymbols({ limit });

          if (result.success && result.data) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      symbols: result.data,
                      count: result.data.length,
                      message: `Retrieved ${result.data.length} symbols`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Failed to retrieve symbols",
                      details: result.error?.message || "Unknown error",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }
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
          const { query, limit = 50 } = args as {
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

          const result = await this.database.searchSymbols(query, { limit });

          if (result.success && result.data) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      symbols: result.data,
                      count: result.data.length,
                      query,
                      message: `Found ${result.data.length} symbols matching "${query}"`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Failed to search symbols",
                      details: result.error?.message || "Unknown error",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }
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
          const { category, limit = 50 } = args as {
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

          const result = await this.database.filterByCategory(category, {
            limit,
          });

          if (result.success && result.data) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      symbols: result.data,
                      count: result.data.length,
                      category,
                      message: `Found ${result.data.length} symbols in category "${category}"`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Failed to filter symbols by category",
                      details: result.error?.message || "Unknown error",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }
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

          if (result.success && result.data) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      categories: result.data,
                      count: result.data.length,
                      message: `Retrieved ${result.data.length} categories`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Failed to retrieve categories",
                      details: result.error?.message || "Unknown error",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }
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
          const { limit = 50 } = args as { limit?: number };

          const result = await this.database.getSymbolSets({ limit });

          if (result.success && result.data) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      symbol_sets: result.data,
                      count: result.data.length,
                      message: `Retrieved ${result.data.length} symbol sets`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Failed to retrieve symbol sets",
                      details: result.error?.message || "Unknown error",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }
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
          const { query, limit = 50 } = args as {
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

          const result = await this.database.searchSymbolSets(query, { limit });

          if (result.success && result.data) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      symbol_sets: result.data,
                      count: result.data.length,
                      query,
                      message: `Found ${result.data.length} symbol sets matching "${query}"`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Failed to search symbol sets",
                      details: result.error?.message || "Unknown error",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }
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
