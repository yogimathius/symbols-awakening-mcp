# Symbols Awakening MCP

[![MCP Badge](https://lobehub.com/badge/mcp/yogimathius-symbols-awakening-mcp)](https://lobehub.com/mcp/yogimathius-symbols-awakening-mcp)

A symbolic reasoning engine that serves as a Model Context Protocol (MCP) server for symbolic ontology operations.

## 🚀 Quick Start

### Installation & Usage

**One-time usage (recommended):**
```bash
# Run immediately without installation
npx symbols-awakening-mcp --help
npx symbols-awakening-mcp --version

# Start MCP server (for use with Claude Desktop, Cursor, etc.)
npx symbols-awakening-mcp

# Start MCP server in demo mode (no Postgres required)
npx symbols-awakening-mcp --demo
```

**Global installation:**
```bash
# Install globally
npm install -g symbols-awakening-mcp

# Use anywhere
symbols-awakening-mcp --help
symbols-awakening-mcp
symbols-awakening-mcp --demo
```

### MCP Client Configuration

#### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "symbols-awakening": {
      "command": "npx",
    "args": ["-y", "symbols-awakening-mcp"],
    "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/symbols_db",
        "DEMO_MODE": "false"
      }
    }
  }
}
```

#### Cursor IDE
Add to your MCP configuration:
```json
{
  "symbols-awakening": {
    "command": "npx",
    "args": ["-y", "symbols-awakening-mcp"],
    "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/symbols_db",
        "DEMO_MODE": "false"
    }
  }
}
```

### Local Development

```bash
# Clone and install dependencies
git clone https://github.com/yogimathius/symbols-awakening-mcp.git
cd symbols-awakening-mcp
pnpm install

# Set up database
cp .env.example .env
# Edit .env with your PostgreSQL connection

# Generate Prisma client and seed database
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## 📋 Current Status

### ✅ Implemented Features

- **MCP Server**: Full MCP server with stdio transport
- **Database Layer**: PostgreSQL + Prisma with schema, indexes, and migrations via `prisma db push`
- **MCP Tools**: Read, search, and CRUD operations for symbols and symbol sets
- **CSV Import/Export**: Import symbols from CSV and export to CSV with optional category filter
- **CLI Binary**: Executable via `npx symbols-awakening-mcp`
- **Testing**: Unit tests for database, MCP tools, and CSV services
- **REST API**: Express-based API scaffold with health/test endpoints and Swagger docs

## 🛠 Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Testing**: Vitest with coverage
- **Database**: PostgreSQL + Prisma
- **Protocol**: Model Context Protocol (MCP)
- **Transport**: Stdio (for CLI usage)

## 📖 Usage

### CLI Commands

```bash
# Show help
symbols-awakening-mcp --help

# Show version
symbols-awakening-mcp --version

# Start MCP server (default)
symbols-awakening-mcp

# Start MCP server in demo mode (no Postgres required)
symbols-awakening-mcp --demo

# Start REST API server
symbols-awakening-mcp --api

# CSV Import/Export
symbols-awakening-mcp import ./data/symbols.csv
symbols-awakening-mcp export ./data/symbols.csv
symbols-awakening-mcp export ./data/symbols.csv --category archetype
symbols-awakening-mcp sample-csv ./data/sample.csv
```

### MCP Integration

#### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "symbols-awakening": {
      "command": "npx",
      "args": ["-y", "symbols-awakening-mcp"]
    }
  }
}
```

#### Cursor IDE

Add to your MCP configuration:

```json
{
  "symbols-awakening": {
    "command": "npx",
    "args": ["-y", "symbols-awakening-mcp"]
  }
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

## 🌐 REST API

Start the API server:

```bash
symbols-awakening-mcp --api
```

By default it runs on `http://localhost:3000` and exposes:

- `/api/health` for basic health checks
- `/api/test` for API smoke tests
- `/api/docs` for Swagger UI

Symbol and symbol-set routes are scaffolded but currently disabled in code while type issues are resolved.

## 🧩 Skills, Prompts, Resources

- Skills are documented under `skills/` for LobeHub discovery.
- Prompts: `analyze-symbol`, `curate-symbol-set`
- Resources: `symbols://categories`, `symbols://category/{category}`

## 🏗 Development

### Project Structure

```
symbols-awakening-mcp/
├── src/
│   ├── __tests__/          # Test setup and utilities
│   ├── api/                # REST API server and routes
│   ├── database/           # Prisma database layer
│   ├── types/              # TypeScript interfaces
│   │   ├── Symbol.ts       # Core symbol types
│   │   └── Symbol.test.ts  # Type tests
│   ├── mcp/                # MCP server implementation
│   ├── services/           # CSV import/export services
│   └── index.ts           # CLI entry point
├── dist/                  # Built output
├── docs/                  # Documentation
├── data/                  # Sample data and seeds
└── scripts/               # Build and utility scripts
```

### Development Rules

We follow strict development practices:

- **Test-Driven Development**: Write tests first
- **TypeScript Strict Mode**: No `any` types, full type safety
- **Continuous Verification**: Tests and type-checking on every change
- **Code Quality**: ESLint with strict rules

### Available Scripts

```bash
pnpm build          # Build for production
pnpm dev            # Development mode with hot reload
pnpm test           # Run test suite
pnpm test:watch     # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage report
pnpm test:ui        # Run tests with UI
pnpm type-check     # TypeScript type checking
pnpm lint           # Run ESLint
pnpm lint:fix       # Fix ESLint issues
pnpm clean          # Clean build artifacts
```

## 🔧 Configuration

### Environment Variables

| Variable       | Description                  | Default       | Required                  |
| -------------- | ---------------------------- | ------------- | ------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | -             | Yes (when using database) |
| `NODE_ENV`     | Environment mode             | `development` | No                        |

### TypeScript Configuration

The project uses strict TypeScript settings:

- Strict null checks
- No implicit any
- No unused locals/parameters
- Exact optional property types
- All strict compiler options enabled

## 📚 API Reference

### Symbol Types

```typescript
interface Symbol {
  id: string;
  name: string;
  category: string;
  description: string;
  interpretations: Record<string, string>;
  related_symbols: string[];
  properties: Record<string, unknown>;
}

interface SymbolSet {
  id: string;
  name: string;
  category: string;
  description: string;
  symbols: Record<string, unknown>;
}
```

### MCP Tools

Read-only tools:

- `get_symbols` - List symbols with optional limit
- `get_symbol` - Get a symbol by ID
- `search_symbols` - Search symbols by text query
- `filter_by_category` - Filter symbols by category
- `get_categories` - Get all available categories
- `get_symbol_sets` - List symbol sets
- `search_symbol_sets` - Search symbol sets

Symbol management tools:

- `create_symbol` - Create a new symbol
- `update_symbol` - Update an existing symbol
- `delete_symbol` - Delete a symbol (with optional cascade)
- `create_symbol_set` - Create a new symbol set
- `update_symbol_set` - Update an existing symbol set

### Tooling Contract

Tools return JSON in `content[0].text`. Dates are ISO-8601 strings.

Core tools and arguments:

- `get_symbol` with `{ id: string }`
- `search_symbols` with `{ query: string, limit?: number }`
- `get_symbols` with `{ limit?: number }`
- `filter_by_category` with `{ category: string, limit?: number }`
- `get_categories` with `{}`
- `get_symbol_sets` with `{ limit?: number }`
- `search_symbol_sets` with `{ query: string, limit?: number }`

Example: `get_symbol`

```json
{
  "id": "ouroboros"
}
```

Example response:

```json
{
  "found": true,
  "symbol": {
    "id": "ouroboros",
    "name": "Ouroboros",
    "category": "transformation",
    "description": "A serpent or dragon eating its tail, symbolizing cycles, renewal, and the unity of opposites.",
    "interpretations": {
      "dream": "Recurring cycles or a need to break a loop",
      "mythic": "Eternal return and self-containment"
    },
    "related_symbols": ["infinity", "mandala"],
    "properties": {
      "origin": "ancient",
      "polarity": "dual"
    },
    "created_at": "2026-02-07T00:00:00.000Z",
    "updated_at": "2026-02-07T00:00:00.000Z"
  },
  "message": "Found symbol \"ouroboros\""
}
```

Example: `search_symbols`

```json
{
  "query": "river",
  "limit": 5
}
```

Example response:

```json
{
  "symbols": [
    {
      "id": "river",
      "name": "River",
      "category": "flow",
      "description": "Flowing water representing time, transition, and emotional movement.",
      "interpretations": {
        "dream": "Life changes or emotional current",
        "mythic": "Boundary between worlds"
      },
      "related_symbols": ["bridge", "boat"],
      "properties": {
        "element": "water",
        "motion": "continuous"
      },
      "created_at": "2026-02-07T00:00:00.000Z",
      "updated_at": "2026-02-07T00:00:00.000Z"
    }
  ],
  "count": 1,
  "query": "river",
  "message": "Found 1 symbols matching \"river\""
}
```

## 🤝 Contributing

1. Follow the development rules in `DEVELOPMENT_RULES.md`
2. Write tests first (TDD approach)
3. Ensure TypeScript strict mode compliance
4. Run the full test suite before committing
5. Use conventional commit messages

## 📄 License

Mozilla Public License 2.0 (MPL-2.0)

## 🔗 Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Development Rules](./DEVELOPMENT_RULES.md)
- [Requirements](./REQUIREMENTS.md)
- [Implementation Checklist](./CHECKLIST.md)
