import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as createCsvWriter from 'csv-writer';
import { z } from 'zod';
import type { Symbol } from '@/types/Symbol.js';
import type { IDatabase } from '@/database/Database.js';

/**
 * CSV format for symbols:
 * id,name,category,description,interpretations,related_symbols,properties
 * 
 * Where:
 * - interpretations: JSON string of key-value pairs
 * - related_symbols: comma-separated list of IDs (within quotes if needed)
 * - properties: JSON string of arbitrary data
 */

/**
 * Zod schema for validating CSV symbol data
 */
const CsvSymbolSchema = z.object({
  id: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, "Symbol ID must contain only alphanumeric characters, underscores, and hyphens"),
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  interpretations: z.string().transform((str) => {
    try {
      return JSON.parse(str || '{}');
    } catch {
      throw new Error('Invalid JSON format in interpretations field');
    }
  }),
  related_symbols: z.string().transform((str) => {
    if (!str || str.trim() === '') {
      return [];
    }
    return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }),
  properties: z.string().transform((str) => {
    try {
      return JSON.parse(str || '{}');
    } catch {
      throw new Error('Invalid JSON format in properties field');
    }
  }),
});

/**
 * CSV import/export statistics
 */
export interface ImportResult {
  success: boolean;
  processed: number;
  created: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
    data?: Record<string, unknown>;
  }>;
}

export interface ExportResult {
  success: boolean;
  exported: number;
  filePath: string;
  error?: string;
}

/**
 * Options for CSV import
 */
export interface ImportOptions {
  /** Skip duplicate symbols (by ID) instead of throwing error */
  skipDuplicates?: boolean;
  /** Maximum number of rows to process (for testing) */
  maxRows?: number;
  /** Validate related symbols exist before import */
  validateRelations?: boolean;
  /** Progress callback function */
  onProgress?: (processed: number, total: number) => void;
}

/**
 * Options for CSV export
 */
export interface ExportOptions {
  /** Output file path */
  filePath: string;
  /** Filter by category */
  category?: string | undefined;
  /** Include only specific symbol IDs */
  symbolIds?: string[];
  /** Progress callback function */
  onProgress?: (exported: number, total: number) => void;
}

/**
 * Service for handling CSV import/export operations
 */
export class CsvService {
  constructor(private database: IDatabase) {}

  /**
   * Import symbols from CSV file
   */
  async importSymbols(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    const {
      skipDuplicates = true,
      maxRows,
      validateRelations = false,
      onProgress,
    } = options;

    const result: ImportResult = {
      success: true,
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [],
    };

    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        processed: 0,
        created: 0,
        skipped: 0,
        errors: [{ row: 0, error: `File not found: ${filePath}` }],
      };
    }

    return new Promise((resolve) => {
      const symbols: Array<Record<string, unknown> & { _rowNumber: number }> = [];
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: Record<string, unknown>) => {
          rowNumber++;
          
          // Apply max rows limit
          if (maxRows && rowNumber > maxRows) {
            return;
          }

          symbols.push({ ...data, _rowNumber: rowNumber });
        })
        .on('end', () => {
          void (async () => {
          // Process all symbols
          for (const symbolData of symbols) {
            result.processed++;
            
            try {
              // Validate CSV data
              const validatedData = CsvSymbolSchema.parse(symbolData);
              
              // Check for duplicate
              const existingSymbol = await this.database.getSymbols({ limit: 1 });
              const symbolExists = existingSymbol.success && 
                existingSymbol.data?.some(s => s.id === validatedData.id);

              if (symbolExists && !skipDuplicates) {
                result.errors.push({
                  row: symbolData._rowNumber,
                  error: `Symbol with ID "${validatedData.id}" already exists`,
                  data: symbolData,
                });
                continue;
              }

              if (symbolExists && skipDuplicates) {
                result.skipped++;
                continue;
              }

              // Validate related symbols if requested
              if (validateRelations && validatedData.related_symbols.length > 0) {
                // This would require a more complex check - simplified for now
                // eslint-disable-next-line no-console, no-undef
                console.log(`Note: Skipping relation validation for ${validatedData.id}`);
              }

              // Create symbol
              const createResult = await this.database.createSymbol({
                id: validatedData.id,
                name: validatedData.name,
                category: validatedData.category,
                description: validatedData.description,
                interpretations: validatedData.interpretations,
                related_symbols: validatedData.related_symbols,
                properties: validatedData.properties,
              });

              if (createResult.success) {
                result.created++;
              } else {
                result.errors.push({
                  row: symbolData._rowNumber,
                  error: createResult.error?.message ?? 'Failed to create symbol',
                  data: symbolData,
                });
              }

            } catch (error) {
              result.errors.push({
                row: symbolData._rowNumber,
                error: error instanceof Error ? error.message : 'Unknown validation error',
                data: symbolData,
              });
            }

            // Report progress
            if (onProgress) {
              onProgress(result.processed, symbols.length);
            }
          }

          // Determine overall success
          result.success = result.errors.length === 0;
          resolve(result);
          })();
        })
        .on('error', (error) => {
          result.success = false;
          result.errors.push({
            row: 0,
            error: `CSV parsing failed: ${error.message}`,
          });
          resolve(result);
        });
    });
  }

  /**
   * Export symbols to CSV file
   */
  async exportSymbols(options: ExportOptions): Promise<ExportResult> {
    const { filePath, category, symbolIds, onProgress } = options;

    try {
      // Fetch symbols based on filters
      let symbols: Symbol[] = [];
      
      if (symbolIds && symbolIds.length > 0) {
        // Export specific symbols - would need a new database method
        // For now, get all and filter
        const allSymbolsResult = await this.database.getSymbols({ limit: 10000 });
        if (allSymbolsResult.success && allSymbolsResult.data) {
          symbols = allSymbolsResult.data.filter(s => symbolIds.includes(s.id));
        }
      } else if (category) {
        const categoryResult = await this.database.filterByCategory(category, { limit: 10000 });
        if (categoryResult.success && categoryResult.data) {
          symbols = categoryResult.data;
        }
      } else {
        // Export all symbols
        const allResult = await this.database.getSymbols({ limit: 10000 });
        if (allResult.success && allResult.data) {
          symbols = allResult.data;
        }
      }

      if (symbols.length === 0) {
        return {
          success: false,
          exported: 0,
          filePath,
          error: 'No symbols found matching the criteria',
        };
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create CSV writer
      const csvWriter = createCsvWriter.createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'id' },
          { id: 'name', title: 'name' },
          { id: 'category', title: 'category' },
          { id: 'description', title: 'description' },
          { id: 'interpretations', title: 'interpretations' },
          { id: 'related_symbols', title: 'related_symbols' },
          { id: 'properties', title: 'properties' },
        ],
      });

      // Transform symbols for CSV output
      const csvData = symbols.map((symbol, index) => {
        if (onProgress) {
          onProgress(index + 1, symbols.length);
        }

        return {
          id: symbol.id,
          name: symbol.name,
          category: symbol.category ?? '',
          description: symbol.description ?? '',
          interpretations: JSON.stringify(symbol.interpretations),
          related_symbols: symbol.related_symbols.join(', '),
          properties: JSON.stringify(symbol.properties),
        };
      });

      // Write CSV file
      await csvWriter.writeRecords(csvData);

      return {
        success: true,
        exported: symbols.length,
        filePath,
      };

    } catch (error) {
      return {
        success: false,
        exported: 0,
        filePath,
        error: error instanceof Error ? error.message : 'Unknown export error',
      };
    }
  }

  /**
   * Create sample CSV file for reference
   */
  async createSampleCsv(filePath: string): Promise<boolean> {
    try {
      const sampleData = [
        {
          id: 'sample_symbol_1',
          name: 'Sample Symbol',
          category: 'example',
          description: 'This is a sample symbol for demonstration',
          interpretations: '{"philosophical": "Example meaning", "spiritual": "Example significance"}',
          related_symbols: 'sample_symbol_2, sample_symbol_3',
          properties: '{"complexity": "low", "origin": "modern"}',
        },
        {
          id: 'sample_symbol_2', 
          name: 'Another Sample',
          category: 'example',
          description: 'Another example symbol',
          interpretations: '{"mathematical": "Some formula", "cultural": "Cultural meaning"}',
          related_symbols: 'sample_symbol_1',
          properties: '{"verified": true, "year": 2024}',
        },
      ];

      const csvWriter = createCsvWriter.createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'id' },
          { id: 'name', title: 'name' },
          { id: 'category', title: 'category' },
          { id: 'description', title: 'description' },
          { id: 'interpretations', title: 'interpretations' },
          { id: 'related_symbols', title: 'related_symbols' },
          { id: 'properties', title: 'properties' },
        ],
      });

      await csvWriter.writeRecords(sampleData);
      return true;
    } catch {
      return false;
    }
  }
}