import { describe, expect, it, beforeEach } from "vitest";

import { DemoDatabase } from "./DemoDatabase.js";
import type { Symbol, SymbolSet } from "@/types/Symbol.js";

describe("DemoDatabase", () => {
  let database: DemoDatabase;

  beforeEach(() => {
    database = new DemoDatabase();
  });

  it("returns demo symbols", async () => {
    const result = await database.getSymbols({ limit: 3 });

    expect(result.success).toBe(true);
    expect(result.data?.length).toBe(3);
  });

  it("finds a symbol by ID", async () => {
    const result = await database.getSymbol("ouroboros");

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe("ouroboros");
  });

  it("returns null for unknown symbol", async () => {
    const result = await database.getSymbol("missing");

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it("searches symbols by text", async () => {
    const result = await database.searchSymbols("river");

    expect(result.success).toBe(true);
    expect(result.data?.some((item) => item.id === "river")).toBe(true);
  });

  it("filters by category", async () => {
    const result = await database.filterByCategory("journey");

    expect(result.success).toBe(true);
    expect(result.data?.every((item) => item.category === "journey")).toBe(
      true
    );
  });

  it("returns unique categories", async () => {
    const result = await database.getCategories();

    expect(result.success).toBe(true);
    expect(result.data).toContain("journey");
  });

  it("creates and updates symbols", async () => {
    const createResult = await database.createSymbol({
      id: "test-symbol",
      name: "Test Symbol",
      category: "test",
      description: "demo",
      interpretations: {},
      related_symbols: [],
      properties: {},
    });

    expect(createResult.success).toBe(true);

    const updateResult = await database.updateSymbol("test-symbol", {
      description: "updated",
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.description).toBe("updated");
  });

  it("rejects duplicate symbols", async () => {
    await database.createSymbol({
      id: "duplicate",
      name: "Duplicate",
      category: "test",
      description: "demo",
      interpretations: {},
      related_symbols: [],
      properties: {},
    });

    const result = await database.createSymbol({
      id: "duplicate",
      name: "Duplicate",
      category: "test",
      description: "demo",
      interpretations: {},
      related_symbols: [],
      properties: {},
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("already exists");
  });

  it("deletes symbols and cascades relations", async () => {
    const createResult = await database.createSymbol({
      id: "related",
      name: "Related",
      category: "test",
      description: "demo",
      interpretations: {},
      related_symbols: ["labyrinth"],
      properties: {},
    });

    expect(createResult.success).toBe(true);

    const deleteResult = await database.deleteSymbol("labyrinth", true);

    expect(deleteResult.success).toBe(true);

    const updated = await database.getSymbol("related");
    expect(updated.data?.related_symbols).not.toContain("labyrinth");
  });

  it("creates and updates symbol sets", async () => {
    const createResult = await database.createSymbolSet({
      id: "demo-set",
      name: "Demo Set",
      category: "test",
      description: "demo",
      symbols: {
        ouroboros: { weight: 1 },
      },
    });

    expect(createResult.success).toBe(true);

    const updateResult = await database.updateSymbolSet("demo-set", {
      description: "updated",
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.data?.description).toBe("updated");
  });
});
