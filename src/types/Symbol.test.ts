import { describe, it, expect } from "vitest";
import type { Symbol, SymbolSet, QueryOptions } from "./Symbol.js";

describe("Symbol Types", () => {
  describe("Symbol interface", () => {
    it("should have all required properties", () => {
      const symbol: Symbol = {
        id: "test-symbol-1",
        name: "Test Symbol",
        category: "test",
        description: "A test symbol for validation",
        interpretations: {
          mystical: "Represents testing in the cosmic order",
          practical: "Used for software validation",
        },
        related_symbols: ["test-symbol-2", "validation-symbol"],
        properties: {
          origin: "unit-test",
          importance: "high",
        },
      };

      // Verify the symbol has all required properties
      expect(symbol.id).toBe("test-symbol-1");
      expect(symbol.name).toBe("Test Symbol");
      expect(symbol.category).toBe("test");
      expect(symbol.description).toBeTruthy();
      expect(typeof symbol.interpretations).toBe("object");
      expect(Array.isArray(symbol.related_symbols)).toBe(true);
      expect(typeof symbol.properties).toBe("object");
    });
  });

  describe("SymbolSet interface", () => {
    it("should have all required properties", () => {
      const symbolSet: SymbolSet = {
        id: "test-set-1",
        name: "Test Symbol Set",
        category: "testing",
        description: "A collection of testing-related symbols",
        symbols: {
          "test-symbol-1": { weight: 1.0, role: "primary" },
          "validation-symbol": { weight: 0.8, role: "secondary" },
        },
      };

      expect(symbolSet.id).toBe("test-set-1");
      expect(symbolSet.name).toBe("Test Symbol Set");
      expect(symbolSet.category).toBe("testing");
      expect(symbolSet.description).toBeTruthy();
      expect(typeof symbolSet.symbols).toBe("object");
    });
  });

  describe("QueryOptions interface", () => {
    it("should support optional query parameters", () => {
      const options: QueryOptions = {
        limit: 10,
        offset: 0,
        query: "test",
        category: "testing",
      };

      expect(options.limit).toBe(10);
      expect(options.offset).toBe(0);
      expect(options.query).toBe("test");
      expect(options.category).toBe("testing");
    });

    it("should work with minimal options", () => {
      const options: QueryOptions = {};

      expect(options.limit).toBeUndefined();
      expect(options.offset).toBeUndefined();
      expect(options.query).toBeUndefined();
      expect(options.category).toBeUndefined();
    });
  });
});
