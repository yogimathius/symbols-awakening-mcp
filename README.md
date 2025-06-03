# Symbols Awakening MCP

A symbolic reasoning engine that serves as a Model Context Protocol (MCP) server for symbolic ontology operations.

## 🚀 Quick Start

### Installation via NPX

```bash
npx -y symbols-awakening-mcp --help
```

### Local Development

```bash
# Clone and install dependencies
git clone <repository-url>
cd symbols-awakening-mcp
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type checking
pnpm type-check
```

## 📋 Current Status

### ✅ Completed Features

- **Project Setup**: Modern TypeScript project with Vite and Vitest
- **CLI Binary**: Executable via `npx symbols-awakening-mcp`
- **MCP Server**: Basic MCP server with stdio transport
- **Type System**: Comprehensive TypeScript interfaces for Symbol ontology
- **Testing**: Vitest test framework with coverage reporting
- **Build System**: Vite-based build with proper CLI binary generation
- **Development Tools**: ESLint, TypeScript strict mode, hot reload

### 🔄 In Progress

- Database layer implementation
- Core MCP tools (get_symbols, search_symbols, etc.)
- PostgreSQL integration
- Data import/export functionality

### 📝 Planned Features

- Symbol ontology database operations
- Full-text search capabilities
- Category-based filtering
- Symbol relationship mapping
- REST API (optional)
- Data seeding and CSV import

## 🛠 Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Testing**: Vitest with coverage
- **Database**: PostgreSQL (planned)
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

## 🏗 Development

### Project Structure

```
symbols-awakening-mcp/
├── src/
│   ├── __tests__/          # Test setup and utilities
│   ├── types/              # TypeScript interfaces
│   │   ├── Symbol.ts       # Core symbol types
│   │   └── Symbol.test.ts  # Type tests
│   ├── database/           # Database layer (planned)
│   ├── mcp/               # MCP server implementation (planned)
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

### MCP Tools (Planned)

- `get_symbols` - List symbols with optional limit
- `search_symbols` - Search symbols by text query
- `filter_by_category` - Filter symbols by category
- `get_categories` - Get all available categories
- `get_symbol_sets` - List symbol sets
- `search_symbol_sets` - Search symbol sets

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
