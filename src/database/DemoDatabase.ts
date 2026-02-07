import demoData from "@/data/demo-symbols.json";

import type {
  QueryOptions,
  QueryResult,
  Symbol,
  SymbolSet,
} from "@/types/Symbol.js";
import type { IDatabase } from "@/database/Database.js";

interface DemoDataPayload {
  symbols: Array<Omit<Symbol, "created_at" | "updated_at">>;
  symbol_sets: Array<Omit<SymbolSet, "created_at" | "updated_at">>;
}

const DEMO_DATA = demoData as DemoDataPayload;

function normalize(text: string): string {
  return text.toLowerCase();
}

function now(): Date {
  return new Date();
}

export class DemoDatabase implements IDatabase {
  private symbols: Symbol[] = [];
  private symbolSets: SymbolSet[] = [];

  constructor() {
    const timestamp = now();
    this.symbols = DEMO_DATA.symbols.map((symbol) => ({
      ...symbol,
      created_at: timestamp,
      updated_at: timestamp,
    }));
    this.symbolSets = DEMO_DATA.symbol_sets.map((set) => ({
      ...set,
      created_at: timestamp,
      updated_at: timestamp,
    }));
  }

  async connect(): Promise<void> {
    return;
  }

  async disconnect(): Promise<void> {
    return;
  }

  async initializeSchema(): Promise<void> {
    return;
  }

  async getSymbols(options: QueryOptions = {}): Promise<QueryResult<Symbol[]>> {
    const { limit = 50, offset = 0 } = options;
    const data = this.symbols.slice(offset, offset + limit);
    return { success: true, data };
  }

  async getSymbol(id: string): Promise<QueryResult<Symbol | null>> {
    const symbol = this.symbols.find((item) => item.id === id) ?? null;
    return { success: true, data: symbol };
  }

  async searchSymbols(
    query: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Symbol[]>> {
    const { limit = 50, offset = 0 } = options;
    const needle = normalize(query);
    const results = this.symbols.filter((symbol) => {
      const haystack = [
        symbol.name,
        symbol.description ?? "",
        symbol.category ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    return { success: true, data: results.slice(offset, offset + limit) };
  }

  async filterByCategory(
    category: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<Symbol[]>> {
    const { limit = 50, offset = 0 } = options;
    const needle = normalize(category);
    const results = this.symbols.filter(
      (symbol) => normalize(symbol.category ?? "") === needle
    );
    return { success: true, data: results.slice(offset, offset + limit) };
  }

  async getCategories(): Promise<QueryResult<string[]>> {
    const categories = Array.from(
      new Set(
        this.symbols
          .map((symbol) => symbol.category)
          .filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b));
    return { success: true, data: categories };
  }

  async getSymbolSets(
    options: QueryOptions = {}
  ): Promise<QueryResult<SymbolSet[]>> {
    const { limit = 50, offset = 0 } = options;
    const data = this.symbolSets.slice(offset, offset + limit);
    return { success: true, data };
  }

  async searchSymbolSets(
    query: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<SymbolSet[]>> {
    const { limit = 50, offset = 0 } = options;
    const needle = normalize(query);
    const results = this.symbolSets.filter((set) => {
      const haystack = [
        set.name,
        set.description ?? "",
        set.category ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    return { success: true, data: results.slice(offset, offset + limit) };
  }

  async healthCheck(): Promise<QueryResult<{ status: string; timestamp: Date }>> {
    return {
      success: true,
      data: { status: "healthy", timestamp: now() },
    };
  }

  async createSymbol(
    symbol: Omit<Symbol, "created_at" | "updated_at">
  ): Promise<QueryResult<Symbol>> {
    if (this.symbols.some((item) => item.id === symbol.id)) {
      return {
        success: false,
        error: new Error(`Symbol with ID "${symbol.id}" already exists`),
      };
    }

    const timestamp = now();
    const created: Symbol = {
      ...symbol,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.symbols.push(created);

    return { success: true, data: created };
  }

  async updateSymbol(
    id: string,
    updates: Partial<Omit<Symbol, "id" | "created_at" | "updated_at">>
  ): Promise<QueryResult<Symbol>> {
    const index = this.symbols.findIndex((item) => item.id === id);
    if (index === -1) {
      return {
        success: false,
        error: new Error(`Symbol with ID "${id}" not found`),
      };
    }

    const current = this.symbols[index];
    const updated: Symbol = {
      ...current,
      ...updates,
      updated_at: now(),
    };

    this.symbols[index] = updated;

    return { success: true, data: updated };
  }

  async deleteSymbol(
    id: string,
    cascade = false
  ): Promise<QueryResult<boolean>> {
    const index = this.symbols.findIndex((item) => item.id === id);
    if (index === -1) {
      return {
        success: false,
        error: new Error(`Symbol with ID "${id}" not found`),
      };
    }

    this.symbols.splice(index, 1);

    if (cascade) {
      this.symbols = this.symbols.map((symbol) => ({
        ...symbol,
        related_symbols: symbol.related_symbols.filter(
          (related) => related !== id
        ),
      }));
    }

    return { success: true, data: true };
  }

  async createSymbolSet(
    symbolSet: Omit<SymbolSet, "created_at" | "updated_at">
  ): Promise<QueryResult<SymbolSet>> {
    if (this.symbolSets.some((item) => item.id === symbolSet.id)) {
      return {
        success: false,
        error: new Error(
          `Symbol set with ID "${symbolSet.id}" already exists`
        ),
      };
    }

    const timestamp = now();
    const created: SymbolSet = {
      ...symbolSet,
      created_at: timestamp,
      updated_at: timestamp,
    };

    this.symbolSets.push(created);

    return { success: true, data: created };
  }

  async updateSymbolSet(
    id: string,
    updates: Partial<Omit<SymbolSet, "id" | "created_at" | "updated_at">>
  ): Promise<QueryResult<SymbolSet>> {
    const index = this.symbolSets.findIndex((item) => item.id === id);
    if (index === -1) {
      return {
        success: false,
        error: new Error(`Symbol set with ID "${id}" not found`),
      };
    }

    const current = this.symbolSets[index];
    const updated: SymbolSet = {
      ...current,
      ...updates,
      updated_at: now(),
    };

    this.symbolSets[index] = updated;

    return { success: true, data: updated };
  }
}
