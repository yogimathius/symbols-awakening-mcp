---
name: symbols-ontology
version: 1.0.0
description: Use the Symbols Awakening MCP server to search, analyze, and curate symbolic ontology data.
---

# Symbols Ontology Skill

## What this skill does
- Discover symbols by name, category, or description
- Analyze meanings and interpretations using MCP tools
- Curate symbol sets around a theme

## When to use it
- You need trusted symbol metadata before writing or analysis
- You want to assemble a themed set of symbols
- You are exploring symbolic categories and relationships

## How to use it
- Use `search_symbols` to find relevant symbols
- Use `filter_by_category` to narrow by category
- Use `get_symbol_sets` and `search_symbol_sets` to discover existing sets
- Use prompts `analyze-symbol` or `curate-symbol-set` for guided workflows

## Required configuration
- `DATABASE_URL` (PostgreSQL connection string)
