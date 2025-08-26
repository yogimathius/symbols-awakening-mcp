import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { CsvService } from './CsvService.js';
import type { IDatabase } from '@/database/Database.js';
import type { Symbol } from '@/types/Symbol.js';

// Mock database
const mockDatabase: IDatabase = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  initializeSchema: vi.fn(),
  getSymbols: vi.fn(),
  searchSymbols: vi.fn(),
  filterByCategory: vi.fn(),
  getCategories: vi.fn(),
  getSymbolSets: vi.fn(),
  searchSymbolSets: vi.fn(),
  healthCheck: vi.fn(),
  createSymbol: vi.fn(),
  updateSymbol: vi.fn(),
  deleteSymbol: vi.fn(),
  createSymbolSet: vi.fn(),
  updateSymbolSet: vi.fn(),
};

describe('CsvService', () => {
  let csvService: CsvService;
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    csvService = new CsvService(mockDatabase);
    
    // Create temporary directory for test files
    tempDir = path.join(tmpdir(), 'symbols-csv-tests-' + Date.now());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('importSymbols', () => {
    it('should import valid CSV data successfully', async () => {
      const csvContent = `id,name,category,description,interpretations,related_symbols,properties
test_symbol,Test Symbol,test,A test symbol,"{""test"": ""interpretation""}","related1, related2","{""test"": true}"
another_symbol,Another Symbol,test,Another test symbol,"{""test"": ""another""}",,"{""verified"": false}"`;

      const csvFile = path.join(tempDir, 'valid-symbols.csv');
      fs.writeFileSync(csvFile, csvContent);

      // Mock successful symbol creation
      vi.mocked(mockDatabase.createSymbol).mockResolvedValue({
        success: true,
        data: {} as Symbol,
      });

      // Mock getSymbols to return empty (no existing symbols)
      vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await csvService.importSymbols(csvFile);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.created).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      expect(mockDatabase.createSymbol).toHaveBeenCalledTimes(2);
      expect(mockDatabase.createSymbol).toHaveBeenCalledWith({
        id: 'test_symbol',
        name: 'Test Symbol',
        category: 'test',
        description: 'A test symbol',
        interpretations: { test: 'interpretation' },
        related_symbols: ['related1', 'related2'],
        properties: { test: true },
      });
    });

    it('should handle invalid JSON in interpretations field', async () => {
      const csvContent = `id,name,category,description,interpretations,related_symbols,properties
invalid_json,Test Symbol,test,A test symbol,"{invalid json}","","{}"`;

      const csvFile = path.join(tempDir, 'invalid-json.csv');
      fs.writeFileSync(csvFile, csvContent);

      const result = await csvService.importSymbols(csvFile);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.error).toContain('Invalid JSON format in interpretations field');
    });

    it('should skip duplicate symbols when skipDuplicates is true', async () => {
      const csvContent = `id,name,category,description,interpretations,related_symbols,properties
existing_symbol,Existing Symbol,test,An existing symbol,"{}","","{}"`;

      const csvFile = path.join(tempDir, 'duplicate-symbols.csv');
      fs.writeFileSync(csvFile, csvContent);

      // Mock existing symbol
      vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
        success: true,
        data: [{ id: 'existing_symbol' } as Symbol],
      });

      const result = await csvService.importSymbols(csvFile, { skipDuplicates: true });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.created).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockDatabase.createSymbol).not.toHaveBeenCalled();
    });

    it('should handle database creation errors', async () => {
      const csvContent = `id,name,category,description,interpretations,related_symbols,properties
failing_symbol,Failing Symbol,test,A symbol that fails,"{}","","{}"`;

      const csvFile = path.join(tempDir, 'failing-symbols.csv');
      fs.writeFileSync(csvFile, csvContent);

      // Mock database error
      vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
        success: true,
        data: [],
      });
      vi.mocked(mockDatabase.createSymbol).mockResolvedValue({
        success: false,
        error: new Error('Database connection failed'),
      });

      const result = await csvService.importSymbols(csvFile);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.error).toBe('Database connection failed');
    });

    it('should handle maxRows limitation', async () => {
      const csvContent = `id,name,category,description,interpretations,related_symbols,properties
symbol1,Symbol 1,test,First symbol,"{}","","{}"
symbol2,Symbol 2,test,Second symbol,"{}","","{}"
symbol3,Symbol 3,test,Third symbol,"{}","","{}"`;

      const csvFile = path.join(tempDir, 'many-symbols.csv');
      fs.writeFileSync(csvFile, csvContent);

      vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
        success: true,
        data: [],
      });
      vi.mocked(mockDatabase.createSymbol).mockResolvedValue({
        success: true,
        data: {} as Symbol,
      });

      const result = await csvService.importSymbols(csvFile, { maxRows: 2 });

      expect(result.processed).toBe(2);
      expect(mockDatabase.createSymbol).toHaveBeenCalledTimes(2);
    });

    it('should handle file not found error', async () => {
      const result = await csvService.importSymbols('/nonexistent/file.csv');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.error).toContain('File not found');
    });
  });

  describe('exportSymbols', () => {
    it('should export all symbols successfully', async () => {
      const mockSymbols: Symbol[] = [
        {
          id: 'test1',
          name: 'Test Symbol 1',
          category: 'test',
          description: 'First test symbol',
          interpretations: { test: 'interpretation' },
          related_symbols: ['test2'],
          properties: { verified: true },
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: 'test2',
          name: 'Test Symbol 2',
          category: 'example',
          description: 'Second test symbol',
          interpretations: {},
          related_symbols: [],
          properties: {},
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
      ];

      vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
        success: true,
        data: mockSymbols,
      });

      const exportFile = path.join(tempDir, 'exported-symbols.csv');
      const result = await csvService.exportSymbols({ filePath: exportFile });

      expect(result.success).toBe(true);
      expect(result.exported).toBe(2);
      expect(result.filePath).toBe(exportFile);

      // Verify file was created and contains expected data
      expect(fs.existsSync(exportFile)).toBe(true);
      const content = fs.readFileSync(exportFile, 'utf-8');
      expect(content).toContain('test1');
      expect(content).toContain('Test Symbol 1');
      expect(content).toContain('test2');
      expect(content).toContain('Test Symbol 2');
    });

    it('should export symbols filtered by category', async () => {
      const mockSymbols: Symbol[] = [
        {
          id: 'test1',
          name: 'Test Symbol 1',
          category: 'test',
          description: 'Filtered symbol',
          interpretations: {},
          related_symbols: [],
          properties: {},
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      vi.mocked(mockDatabase.filterByCategory).mockResolvedValue({
        success: true,
        data: mockSymbols,
      });

      const exportFile = path.join(tempDir, 'category-export.csv');
      const result = await csvService.exportSymbols({ 
        filePath: exportFile, 
        category: 'test' 
      });

      expect(result.success).toBe(true);
      expect(result.exported).toBe(1);
      expect(mockDatabase.filterByCategory).toHaveBeenCalledWith('test', { limit: 10000 });
    });

    it('should handle export with no symbols found', async () => {
      vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
        success: true,
        data: [],
      });

      const exportFile = path.join(tempDir, 'empty-export.csv');
      const result = await csvService.exportSymbols({ filePath: exportFile });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No symbols found');
    });

    it('should handle database errors during export', async () => {
      vi.mocked(mockDatabase.getSymbols).mockResolvedValue({
        success: false,
        error: new Error('Database error'),
      });

      const exportFile = path.join(tempDir, 'error-export.csv');
      const result = await csvService.exportSymbols({ filePath: exportFile });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No symbols found matching the criteria');
    });
  });

  describe('createSampleCsv', () => {
    it('should create sample CSV file successfully', async () => {
      const sampleFile = path.join(tempDir, 'sample.csv');
      const result = await csvService.createSampleCsv(sampleFile);

      expect(result).toBe(true);
      expect(fs.existsSync(sampleFile)).toBe(true);

      const content = fs.readFileSync(sampleFile, 'utf-8');
      expect(content).toContain('id,name,category,description');
      expect(content).toContain('sample_symbol_1');
      expect(content).toContain('Sample Symbol');
    });

    it('should handle file creation errors', async () => {
      const invalidPath = '/invalid/path/sample.csv';
      const result = await csvService.createSampleCsv(invalidPath);

      expect(result).toBe(false);
    });
  });
});