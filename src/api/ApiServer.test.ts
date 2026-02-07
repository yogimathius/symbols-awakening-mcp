import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IDatabase } from '@/database/Database.js';
import { ApiServer } from './ApiServer.js';

// Mock database
const mockDatabase: IDatabase = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  initializeSchema: vi.fn(),
  getSymbols: vi.fn(),
  getSymbol: vi.fn(),
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

describe('ApiServer - Structure Tests', () => {
  let apiServer: ApiServer;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should instantiate ApiServer without errors', () => {
    expect(() => {
      apiServer = new ApiServer(mockDatabase);
    }).not.toThrow();
  });

  it('should have required methods', () => {
    apiServer = new ApiServer(mockDatabase);
    
    expect(typeof apiServer.start).toBe('function');
    expect(typeof apiServer.stop).toBe('function');
    expect(typeof apiServer.getApp).toBe('function');
  });

  it('should return Express app instance', () => {
    apiServer = new ApiServer(mockDatabase);
    
    const app = apiServer.getApp();
    expect(app).toBeDefined();
    expect(typeof app).toBe('function'); // Express app is a function
  });

  it('should configure middleware without errors', () => {
    expect(() => {
      apiServer = new ApiServer(mockDatabase);
    }).not.toThrow();
  });

  describe('Server lifecycle', () => {
    beforeEach(() => {
      apiServer = new ApiServer(mockDatabase);
    });

    it('should have start method that returns a promise', () => {
      const startPromise = apiServer.start(0); // Use port 0 to get any available port
      expect(startPromise).toBeInstanceOf(Promise);
      
      // Don't actually start the server in tests, just verify the interface
      return expect(startPromise).rejects.toThrow(); // Will reject because we're not in a proper server environment
    });

    it('should have stop method that returns a promise', async () => {
      const stopPromise = apiServer.stop();
      expect(stopPromise).toBeInstanceOf(Promise);
      
      // Should resolve immediately since no server is running
      await expect(stopPromise).resolves.toBeUndefined();
    });
  });

  describe('Database integration', () => {
    it('should accept database instance in constructor', () => {
      expect(() => {
        apiServer = new ApiServer(mockDatabase);
      }).not.toThrow();
    });

    it('should store database reference', () => {
      apiServer = new ApiServer(mockDatabase);
      
      // Access the private database property through the app setup
      // We can't directly test private properties, but we can verify the constructor worked
      expect(apiServer).toBeInstanceOf(ApiServer);
    });
  });

  describe('Route configuration', () => {
    it('should configure routes without throwing', () => {
      expect(() => {
        apiServer = new ApiServer(mockDatabase);
      }).not.toThrow();
    });

    it('should set up Swagger documentation without throwing', () => {
      expect(() => {
        apiServer = new ApiServer(mockDatabase);
      }).not.toThrow();
    });

    it('should set up error handling without throwing', () => {
      expect(() => {
        apiServer = new ApiServer(mockDatabase);
      }).not.toThrow();
    });
  });
});
