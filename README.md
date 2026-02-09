# Symbols Awakening MCP

A symbolic reasoning engine that serves as an MCP (Model Context Protocol) server for symbolic ontology operations - bridging AI models with structured symbolic knowledge.

## What It Does

Symbols Awakening MCP provides a standardized interface for LLMs (Claude, GPT-4, etc.) to interact with a symbolic knowledge base. It implements the Model Context Protocol, allowing AI assistants to query, create, and manage symbols through a PostgreSQL database. Think of it as a "symbolic memory" for AI systems with CSV import/export, REST API, and MCP server modes.

Perfect for: philosophy research, sacred geometry exploration, ontology management, and giving AI assistants structured symbolic reasoning capabilities.

## Tech Stack

- **Protocol**: Model Context Protocol (MCP) 1.7.0
- **Runtime**: Node.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **MCP Server**: @modelcontextprotocol/sdk
- **REST API**: Express.js with Swagger docs
- **Security**: Helmet, CORS, rate limiting
- **CSV**: csv-parser + csv-writer
- **Validation**: Zod schemas
- **Testing**: Vitest with coverage
- **Build**: Vite with TypeScript
- **Code Quality**: ESLint, Prettier, Husky
- **CI/CD**: Commitlint + conventional commits

## Features

### MCP Server Mode (Primary)
Serves as an MCP server that AI assistants can connect to:

**Read-only Tools:**
- `get_symbols` - List symbols with pagination
- `get_symbol` - Get symbol by ID
- `search_symbols` - Full-text search
- `filter_by_category` - Category-based filtering
- `get_categories` - List all categories
- `get_symbol_sets` - List curated symbol collections
- `search_symbol_sets` - Search symbol sets

**Management Tools:**
- `create_symbol` - Add new symbols
- `update_symbol` - Modify existing symbols
- `delete_symbol` - Remove symbols (with cascade option)
- `create_symbol_set` - Create symbol collections
- `update_symbol_set` - Modify symbol sets

**MCP Resources:**
- `symbols://categories` - Browse by category
- `symbols://category/{category}` - Get symbols in category

**MCP Prompts:**
- `analyze-symbol` - Deep symbolic analysis workflow
- `curate-symbol-set` - AI-guided symbol set creation

### REST API Mode
Full-featured REST API with Swagger documentation:
- OpenAPI/Swagger UI at `/api-docs`
- Health check endpoint
- CRUD operations for symbols and sets
- Search and filtering
- Morgan logging
- Helmet security headers

### CLI Commands
- `import <file.csv>` - Bulk import symbols from CSV
- `export <file.csv>` - Export symbols to CSV
- `export <file.csv> --category <name>` - Category-filtered export
- `sample-csv <file.csv>` - Generate CSV template

### Database Features
- PostgreSQL with Prisma migrations
- Seeding system with demo data
- Full-text search indexing
- Category management
- Symbol sets (curated collections)
- Demo mode (no database required)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or use demo mode)
- pnpm (recommended) or npm

### Installation
```bash
cd /Users/mathiusjohnson/projects/build/integration-tools/symbols-awakening-mcp
pnpm install
```

### Database Setup
```bash
# Create database
createdb symbols_awakening

# Set environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/symbols_awakening"

# Run migrations
npx prisma migrate dev

# Seed with demo data
npx prisma db seed
```

### Usage

**MCP Server (Default):**
```bash
pnpm run start
# Runs as MCP server on stdio transport
# Connect from Claude Desktop, Cursor, or other MCP clients
```

**REST API Server:**
```bash
pnpm run start -- --api
# Starts on http://localhost:3000
# Swagger docs at http://localhost:3000/api-docs
```

**Demo Mode (No Database):**
```bash
pnpm run start -- --demo
# Uses bundled demo dataset
```

**CSV Operations:**
```bash
# Create sample CSV template
pnpm run start -- sample-csv symbols.csv

# Import symbols
pnpm run start -- import symbols.csv

# Export all symbols
pnpm run start -- export all-symbols.csv

# Export by category
pnpm run start -- export sacred-geometry.csv --category "Sacred Geometry"
```

### MCP Configuration

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "symbols-awakening": {
      "command": "node",
      "args": ["/path/to/symbols-awakening-mcp/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@localhost:5432/symbols_awakening"
      }
    }
  }
}
```

**Cursor / Other MCP Clients:**
Similar configuration pointing to the built binary.

## Project Structure

```
src/
├── index.ts              # Main entry point, CLI handler
├── mcp/
│   └── SymbolsService.ts # MCP tool implementations
├── database/
│   ├── Database.ts       # Prisma database adapter
│   └── DemoDatabase.ts   # In-memory demo mode
├── api/
│   ├── ApiServer.ts      # Express REST API
│   ├── routes/           # API route handlers
│   └── middleware/       # Express middleware
├── services/
│   └── CsvService.ts     # CSV import/export
└── types/
    └── Symbol.ts         # TypeScript types

prisma/
├── schema.prisma         # Database schema
├── migrations/           # Migration files
└── seed.ts              # Seed data

skills/                   # Bundled demo symbols
└── basic.csv

tests/                    # Vitest test suites
```

## Current Status

### What Works
- ✅ Complete MCP server implementation
- ✅ All 12 MCP tools functional
- ✅ MCP resources and prompts
- ✅ REST API with Swagger docs
- ✅ PostgreSQL + Prisma integration
- ✅ CSV import/export with progress bars
- ✅ Demo mode with bundled data
- ✅ Full CLI with help and version
- ✅ TypeScript with strict typing
- ✅ Vitest testing infrastructure
- ✅ ESLint + Prettier + Husky
- ✅ Commitlint for conventional commits
- ✅ Health checks and error handling
- ✅ Security middleware (Helmet, CORS)
- ✅ Graceful shutdown handlers

### In Progress
- Test coverage expansion
- Additional symbol categories
- Performance optimizations

### Missing
- Multi-language symbol support
- Media attachments (images, diagrams)
- Symbol relationship graphs
- Version history for symbols
- User authentication (for REST API)
- Rate limiting per-user
- Analytics and usage tracking
- Export formats (JSON, YAML, RDF)
- Symbol visualization tools

## Development

```bash
# Development mode with auto-reload
pnpm run dev

# Build
pnpm run build

# Start built version
pnpm run start

# Type checking
pnpm run type-check

# Testing
pnpm run test
pnpm run test:watch
pnpm run test:coverage
pnpm run test:ui

# Linting
pnpm run lint
pnpm run lint:fix

# Formatting
pnpm run format
pnpm run format:check

# Clean build
pnpm run clean

# Database
npx prisma studio        # Visual database browser
npx prisma migrate dev   # Run migrations
npx prisma db seed       # Seed database
```

## MCP Protocol

This server implements the Model Context Protocol, allowing AI assistants to:
1. **Discover** available tools and resources
2. **Query** the symbolic knowledge base
3. **Create** and update symbols
4. **Search** with natural language
5. **Follow** guided prompts for analysis

The protocol uses JSON-RPC 2.0 over stdio transport.

## CSV Format

Import/export CSV with these columns:
```csv
name,category,meaning,etymology,culturalContext,visualSymbol
Ankh,Ancient Egypt,Life and immortality,Egyptian hieroglyph,Symbol of eternal life,☥
```

Generate a template:
```bash
pnpm run start -- sample-csv template.csv
```

## Philosophy

Symbols Awakening bridges structured symbolic knowledge with LLM reasoning:
- **Symbolic Ontology**: Organized, curated symbol data
- **AI-Accessible**: MCP protocol for seamless integration
- **Multi-Modal**: CSV, API, MCP - use what fits your workflow
- **Research-Oriented**: Built for philosophy, sacred geometry, comparative religion
- **Extensible**: Easy to add categories, relationships, visualizations

## Notes

This is a deployment-ready MCP server with excellent architecture:

**Strengths:**
- Clean separation of concerns (Database/API/MCP/CLI)
- Comprehensive tooling (testing, linting, formatting, commits)
- Multiple operational modes (MCP/API/Demo)
- Well-documented code and CLI help
- Type-safe throughout
- Graceful error handling

**Use Cases:**
- Give Claude/GPT access to symbolic knowledge
- Build philosophical research assistants
- Create sacred geometry explorers
- Manage comparative religion databases
- Teach AI about symbols and their meanings

Ready for immediate use with Claude Desktop or Cursor. The demo mode makes it easy to try without database setup.
