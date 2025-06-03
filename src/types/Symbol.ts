/**
 * Core Symbol type representing a symbolic entity in the ontology
 */
export interface Symbol {
  /** Unique identifier for the symbol */
  id: string;

  /** Human-readable name of the symbol */
  name: string;

  /** Category classification of the symbol */
  category: string;

  /** Detailed description of the symbol's meaning */
  description: string;

  /** Various interpretations of the symbol across different contexts */
  interpretations: Record<string, string>;

  /** Array of related symbol IDs */
  related_symbols: string[];

  /** Additional properties and metadata */
  properties: Record<string, unknown>;
}

/**
 * Symbol Set type representing a collection of related symbols
 */
export interface SymbolSet {
  /** Unique identifier for the symbol set */
  id: string;

  /** Human-readable name of the symbol set */
  name: string;

  /** Category classification of the symbol set */
  category: string;

  /** Description of the symbol set's purpose and content */
  description: string;

  /** Map of symbol IDs to their roles/weights in this set */
  symbols: Record<string, unknown>;
}

/**
 * Category type for organizing symbols
 */
export type Category = string;

/**
 * Database query result wrapper
 */
export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * Common query options for listing and searching
 */
export interface QueryOptions {
  /** Maximum number of results to return */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Search query string */
  query?: string;

  /** Category filter */
  category?: string;
}
