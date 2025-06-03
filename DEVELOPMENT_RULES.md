# Symbol Ontology Service - Development Rules

## Core Development Principles

### 1. Test-Driven Development (TDD)

- ✅ **Write tests FIRST** - Every feature starts with a failing test
- ✅ **Red-Green-Refactor** - Fail → Pass → Improve
- ✅ **Test Coverage** - Aim for 80%+ coverage on core functionality
- ✅ **Test Types**: Unit → Integration → E2E

### 2. TypeScript Strictness

- ✅ **Strict Mode** - Enable all strict TypeScript compiler options
- ✅ **No `any` Types** - Use proper typing for everything
- ✅ **Interface First** - Define interfaces before implementation
- ✅ **Zod Validation** - Runtime validation for all external inputs

### 3. Continuous Verification

- ✅ **Run Tests After Every Change** - `pnpm test` frequently
- ✅ **TypeScript Check** - `pnpm type-check` before commits
- ✅ **Lint Clean** - Zero ESLint errors/warnings
- ✅ **Build Success** - `pnpm build` must always work

### 4. Code Quality Standards

- ✅ **Single Responsibility** - Each function/class has one purpose
- ✅ **Pure Functions** - Prefer pure functions when possible
- ✅ **Error Handling** - Explicit error handling, no silent failures
- ✅ **Documentation** - JSDoc comments for public APIs

## Implementation Order Rules

### Phase 1: Foundation (Current)

1. **Project Setup** - Package.json, TypeScript, basic structure
2. **Test Framework** - Jest configuration and first test
3. **Database Models** - Interfaces and types first
4. **Database Layer** - Connection, schema, basic operations

### Phase 2: Core MCP Server

1. **MCP Server Setup** - Basic stdio transport
2. **Tool Implementations** - One tool at a time, with tests
3. **Integration Testing** - End-to-end MCP protocol tests
4. **NPX Package** - CLI binary and packaging

### Phase 3: Enhancement

1. **Data Import** - CSV processing with tests
2. **Performance Optimization** - Query optimization
3. **Error Handling** - Comprehensive error management
4. **Documentation** - User and developer docs

## File Organization Rules

```
symbols-awakening-mcp/
├── src/
│   ├── __tests__/          # Test files alongside source
│   ├── database/           # Database layer
│   │   ├── connection.ts
│   │   ├── schema.ts
│   │   └── services/
│   ├── mcp/               # MCP server implementation
│   │   ├── server.ts
│   │   └── tools/
│   ├── types/             # TypeScript interfaces
│   └── index.ts           # CLI entry point
├── data/                  # Sample data and seeds
├── docs/                  # Documentation
└── scripts/               # Build and utility scripts
```

## Testing Rules

### Test File Naming

- **Unit Tests**: `*.test.ts` alongside source files
- **Integration Tests**: `*.integration.test.ts`
- **E2E Tests**: `*.e2e.test.ts`

### Test Structure

```typescript
describe("FeatureName", () => {
  describe("happy path", () => {
    it("should do expected behavior", () => {
      // Arrange, Act, Assert
    });
  });

  describe("error cases", () => {
    it("should handle specific error gracefully", () => {
      // Test error scenarios
    });
  });
});
```

## Database Rules

### Connection Management

- ✅ **Pool Connections** - Always use connection pooling
- ✅ **Transaction Safety** - Use transactions for multi-query operations
- ✅ **Connection Cleanup** - Proper cleanup in tests and production
- ✅ **Environment Variables** - Never hardcode connection strings

### Query Rules

- ✅ **Parameterized Queries** - Prevent SQL injection
- ✅ **Query Timeouts** - 5-second timeout for all queries
- ✅ **Error Handling** - Wrap database errors appropriately
- ✅ **Performance** - Index all frequently queried columns

## MCP Protocol Rules

### Tool Implementation

- ✅ **Schema First** - Define Zod schema before implementation
- ✅ **Async/Await** - Use async/await consistently
- ✅ **Error Responses** - Proper MCP error format
- ✅ **Input Validation** - Validate all tool parameters

### Transport Rules

- ✅ **Stdio Only** - Use StdioServerTransport for CLI usage
- ✅ **Graceful Shutdown** - Handle process signals properly
- ✅ **Error Recovery** - Don't crash on individual tool errors
- ✅ **Logging** - Log all MCP interactions for debugging

## Code Style Rules

### Import Organization

```typescript
// 1. Node.js built-ins
import { readFile } from "fs/promises";

// 2. External libraries
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// 3. Internal imports (absolute paths preferred)
import { DatabaseService } from "../database/services/DatabaseService.js";
import type { Symbol } from "../types/Symbol.js";
```

### Error Handling Pattern

```typescript
// Always use Result pattern or explicit error handling
async function riskyOperation(): Promise<Result<Data, Error>> {
  try {
    const result = await dangerousCall();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## Git Workflow Rules

### Commit Messages

- ✅ **Conventional Commits** - `feat:`, `fix:`, `test:`, `refactor:`
- ✅ **Descriptive** - Explain what and why, not just what
- ✅ **Test Status** - Include test status in commit if relevant

### Branch Strategy

- ✅ **Feature Branches** - One feature per branch
- ✅ **Test Before Merge** - All tests pass before merging
- ✅ **Clean History** - Squash commits when appropriate

## Performance Rules

### Database Performance

- ✅ **Query Optimization** - Monitor and optimize slow queries
- ✅ **Connection Limits** - Respect database connection limits
- ✅ **Bulk Operations** - Use batch processing for large operations
- ✅ **Caching Strategy** - Cache frequently accessed data

### Memory Management

- ✅ **Stream Large Data** - Don't load large datasets into memory
- ✅ **Connection Cleanup** - Close connections and clean up resources
- ✅ **Error Recovery** - Recover gracefully from memory issues

## Documentation Rules

### Code Documentation

- ✅ **JSDoc Comments** - For all public APIs
- ✅ **README Updates** - Keep README current with features
- ✅ **Type Documentation** - Document complex types and interfaces
- ✅ **Example Usage** - Include usage examples in docs

### Test Documentation

- ✅ **Test Descriptions** - Clear, descriptive test names
- ✅ **Test Comments** - Explain complex test logic
- ✅ **Test Data** - Document test data and fixtures
- ✅ **Mock Documentation** - Explain why mocks are used

## Deployment Rules

### Package Rules

- ✅ **Minimal Dependencies** - Only include necessary dependencies
- ✅ **Peer Dependencies** - Use peer deps for optional features
- ✅ **Build Optimization** - Optimize bundle size
- ✅ **Version Management** - Semantic versioning

### CLI Rules

- ✅ **Proper Shebang** - `#!/usr/bin/env node`
- ✅ **Exit Codes** - Use appropriate exit codes
- ✅ **Signal Handling** - Handle SIGINT, SIGTERM gracefully
- ✅ **Help Text** - Provide useful help and version info

---

## Daily Workflow Checklist

Before making changes:

- [ ] Pull latest changes
- [ ] Run existing tests (`pnpm test`)
- [ ] Check TypeScript (`pnpm type-check`)

While developing:

- [ ] Write failing test first
- [ ] Implement minimal code to pass test
- [ ] Refactor for quality
- [ ] Run tests after each change

Before committing:

- [ ] Run full test suite
- [ ] Check TypeScript compilation
- [ ] Lint code
- [ ] Update documentation if needed
- [ ] Test CLI binary if changed

---

**Remember: If it's not tested, it's broken. If TypeScript complains, fix it immediately.**
