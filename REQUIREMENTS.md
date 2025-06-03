## Symbol Ontology Service - Complete Requirements Documentation

### **System Overview**

The Symbol Ontology Service is a symbolic reasoning engine that serves as a Model Context Protocol (MCP) server for symbolic ontology operations. It provides both standalone and API-based access to a comprehensive database of symbols, their meanings, interpretations, and relationships.

---

### **1. System Architecture Requirements**

#### **1.1 Multi-Component Architecture**

- **Core Library Component**: Domain models, database abstractions, and shared utilities
- **MCP Client Component**: Standalone executable for MCP protocol integration
- **API Server Component**: Optional REST API service
- **Integration Tests Component**: Cross-component testing suite

#### **1.2 Service Communication**

- **Direct Database Access**: MCP client connects directly to database without API server dependency
- **REST API Access**: Optional HTTP-based access through API server
- **MCP Protocol**: Server-Sent Events (SSE) transport for real-time communication
- **Cross-Origin Support**: CORS configuration for web application integration

---

### **2. Database Requirements**

#### **2.1 Database System**

- **Primary Database**: PostgreSQL 15+
- **Connection Pooling**: Maximum 10 concurrent connections with 5-second timeout
- **Schema Management**: Automated table creation and indexing

#### **2.2 Data Model**

**Symbols Table:**

```sql
CREATE TABLE symbols (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    interpretations JSONB DEFAULT '{}'::JSONB,
    related_symbols JSONB DEFAULT '[]'::JSONB,
    properties JSONB DEFAULT '{}'::JSONB
)
```

**Symbol Sets Table:**

```sql
CREATE TABLE symbol_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    symbols JSONB DEFAULT '{}'::JSONB
)
```

#### **2.3 Database Indexing**

- **Category Index**: `idx_symbols_category` on symbols.category
- **Full-Text Search Index**: `idx_symbols_text_search` using PostgreSQL GIN on name and description
- **Primary Key Constraints**: Unique identifiers for all entities

#### **2.4 Data Seeding**

- **CSV Data Import**: Support for importing symbol data from CSV files
- **Default Test Data**: Predefined symbol sets for testing and demonstration
- **Batch Processing**: Process symbol imports in batches of 20 records
- **Conflict Resolution**: UPSERT operations for handling duplicate symbols

---

### **3. MCP (Model Context Protocol) Requirements**

#### **3.1 Protocol Compliance**

- **MCP Version**: Full compliance with MCP specification
- **Transport Layer**: Server-Sent Events (SSE) with HTTP fallback
- **Message Format**: JSON-based request/response protocol
- **Tool Registration**: Dynamic tool discovery and registration

#### **3.2 MCP Methods**

| Method               | Parameters                         | Description                          |
| -------------------- | ---------------------------------- | ------------------------------------ |
| `get_symbols`        | `limit?: number`                   | List all symbols with optional limit |
| `search_symbols`     | `query: string, limit?: number`    | Search symbols by text               |
| `filter_by_category` | `category: string, limit?: number` | Filter symbols by category           |
| `get_categories`     | None                               | Get all available categories         |
| `get_symbol_sets`    | `limit?: number`                   | List all symbol sets                 |
| `search_symbol_sets` | `query: string, limit?: number`    | Search symbol sets                   |

#### **3.3 Integration Requirements**

- **Cursor AI Integration**: Compatible with Cursor IDE MCP provider system
- **Claude Integration**: Direct integration with Claude AI models
- **SSE Endpoint**: `/sse` path for establishing SSE connections
- **Message Endpoint**: `/message` path for HTTP POST operations

---

### **4. REST API Requirements**

#### **4.1 API Structure**

- **Versioning**: All endpoints prefixed with `/api/v1`
- **Content Type**: JSON request/response format
- **HTTP Methods**: Full CRUD operations (GET, POST, PUT, DELETE)
- **Status Codes**: Standard HTTP status code compliance

#### **4.2 Symbol Endpoints**

```
GET    /api/v1/symbols                    # List symbols
GET    /api/v1/symbols/:id                # Get specific symbol
POST   /api/v1/symbols                    # Create symbol
PUT    /api/v1/symbols/:id                # Update symbol
DELETE /api/v1/symbols/:id                # Delete symbol
GET    /api/v1/symbols/search             # Search symbols
GET    /api/v1/symbols/category/:category # Filter by category
```

#### **4.3 Symbol Sets Endpoints**

```
GET    /api/v1/symbol-sets        # List symbol sets
GET    /api/v1/symbol-sets/:id    # Get specific symbol set
POST   /api/v1/symbol-sets        # Create symbol set
PUT    /api/v1/symbol-sets/:id    # Update symbol set
DELETE /api/v1/symbol-sets/:id    # Delete symbol set
GET    /api/v1/symbol-sets/search # Search symbol sets
```

#### **4.4 Utility Endpoints**

```
GET    /api/v1/categories         # List all categories
GET    /health                    # Health check
GET    /                          # Service info
```

---

### **5. Environment Configuration**

#### **5.1 Required Environment Variables**

| Variable       | Description                  | Default | Example                                          |
| -------------- | ---------------------------- | ------- | ------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string | None    | `postgres://user:pass@host:5432/symbol_ontology` |
| `MCP_PORT`     | MCP server port              | 3002    | 3002                                             |
| `PORT`         | API server port              | 8080    | 8080                                             |
| `RUST_LOG`     | Logging level                | info    | info, debug, trace                               |

#### **5.2 Optional Environment Variables**

| Variable                     | Description                      | Default |
| ---------------------------- | -------------------------------- | ------- |
| `HEARTBEAT_INTERVAL`         | SSE heartbeat interval (seconds) | 30      |
| `HTTP_PROXY_CONNECT_TIMEOUT` | Proxy connection timeout         | 300s    |
| `HTTP_PROXY_IDLE_TIMEOUT`    | Proxy idle timeout               | 3600s   |
| `CORS_ORIGINS`               | Allowed CORS origins             | \*      |

---

### **6. Deployment Requirements**

#### **6.1 Container Deployment**

- **Base Image**: Debian Bookworm Slim
- **Runtime Dependencies**: libssl3, ca-certificates
- **Port Exposure**: 3002 (MCP), 8080 (API)
- **Volume Mounts**: `/app/logs` for logging output
- **Health Checks**: TCP-based health monitoring

#### **6.2 Container Orchestration**

- **Docker Compose**: Service orchestration with environment variable injection
- **Restart Policy**: `unless-stopped` for production deployments
- **Resource Limits**: Configurable memory and CPU constraints

#### **6.3 Cloud Deployment (Fly.io)**

- **Auto-scaling**: Configurable machine scaling based on load
- **Health Monitoring**: HTTP and TCP health checks with 30s intervals
- **SSL Termination**: Automatic HTTPS with force SSL redirect
- **Connection Limits**: 400 soft limit, 500 hard limit
- **Timeout Configuration**: Extended timeouts for SSE connections

#### **6.4 Development Deployment**

- **Local Database**: PostgreSQL instance with standard configuration
- **Environment File**: `.env` file support for local development
- **Hot Reload**: Development server with automatic restart capability

---

### **7. Data Processing Requirements**

#### **7.1 Symbol Data Processing**

- **CSV Import**: Support for comma-separated value files
- **Data Validation**: Required field validation (id, name, category, description)
- **Relationship Mapping**: Automatic extraction of related symbol references
- **Category Extraction**: Intelligent category assignment based on content analysis
- **Property Generation**: Metadata extraction from symbol descriptions

#### **7.2 Text Processing**

- **Search Tokenization**: Full-text search with PostgreSQL's text search capabilities
- **Pattern Matching**: Case-insensitive partial string matching
- **Language Processing**: English language text vectorization for search indexing

#### **7.3 Batch Operations**

- **Import Batching**: Process records in configurable batch sizes
- **Error Handling**: Continue processing on individual record failures
- **Progress Reporting**: Real-time feedback during bulk operations
- **Rollback Support**: Transaction-based operations with rollback capability

---

### **8. Security Requirements**

#### **8.1 Database Security**

- **Connection Security**: SSL-enabled database connections
- **Credential Management**: Environment variable-based credential storage
- **SQL Injection Prevention**: Parameterized query usage throughout
- **Access Control**: Role-based database access patterns

#### **8.2 API Security**

- **CORS Configuration**: Configurable cross-origin resource sharing
- **Input Validation**: Request payload validation and sanitization
- **Error Handling**: Secure error responses without information leakage
- **Rate Limiting**: Configurable request rate limiting (planned feature)

#### **8.3 Authentication (Planned)**

- **API Key Authentication**: Token-based API access control
- **Session Management**: Secure session handling for web interfaces
- **Authorization**: Role-based access control for different operations

---

### **9. Performance Requirements**

#### **9.1 Response Time**

- **Database Queries**: Sub-100ms response time for simple queries
- **Search Operations**: Sub-500ms for full-text search operations
- **MCP Method Calls**: Sub-200ms for standard MCP operations
- **Bulk Operations**: Progress feedback within 1 second of initiation

#### **9.2 Throughput**

- **Concurrent Connections**: Support 400-500 concurrent SSE connections
- **Request Handling**: 100+ requests per second for API endpoints
- **Database Connections**: Efficient connection pooling with 10 max connections
- **Memory Usage**: Optimized memory footprint for container deployment

#### **9.3 Scalability**

- **Horizontal Scaling**: Stateless service design for load balancing
- **Database Scaling**: Support for read replicas and connection pooling
- **Caching Strategy**: Efficient in-memory caching for frequently accessed data
- **Background Processing**: Asynchronous processing for non-critical operations

---

### **10. Monitoring and Logging**

#### **10.1 Logging Requirements**

- **Structured Logging**: JSON-formatted log output for parsing
- **Log Levels**: Configurable verbosity (ERROR, WARN, INFO, DEBUG, TRACE)
- **Log Rotation**: Automatic log file rotation and cleanup
- **Correlation IDs**: Request tracking across service boundaries

#### **10.2 Metrics and Monitoring**

- **Health Checks**: HTTP endpoint for service health monitoring
- **Performance Metrics**: Response time and throughput tracking
- **Error Monitoring**: Exception tracking and alerting
- **Resource Monitoring**: CPU, memory, and disk usage tracking

#### **10.3 Debugging Support**

- **Verbose Logging**: Detailed debug output for troubleshooting
- **Request Tracing**: Full request/response logging capability
- **Database Query Logging**: SQL query execution tracking
- **Connection Monitoring**: Database connection pool status tracking

---

### **11. Integration Requirements**

#### **11.1 AI Tool Integration**

- **Claude Integration**: Native MCP protocol support for Claude AI
- **Cursor IDE**: Direct integration with Cursor's MCP provider system
- **Generic MCP**: Standard MCP compliance for other AI tools
- **Protocol Extensions**: Support for custom MCP method extensions

#### **11.2 External System Integration**

- **Webhook Support**: Outbound webhook notifications (planned)
- **Message Queues**: Asynchronous processing integration (planned)
- **External APIs**: REST client capabilities for third-party integrations
- **Data Import/Export**: Bulk data transfer capabilities

#### **11.3 Development Tool Integration**

- **Testing Frameworks**: Comprehensive test suite integration
- **CI/CD Pipelines**: Automated testing and deployment workflows
- **Documentation Generation**: Automatic API documentation updates
- **Code Quality Tools**: Linting and code analysis integration

---

### **12. Backup and Recovery**

#### **12.1 Data Backup**

- **Database Backups**: Regular PostgreSQL backup procedures
- **Configuration Backup**: Environment and deployment configuration preservation
- **Version Control**: All source code under version control management
- **State Preservation**: Service state backup for disaster recovery

#### **12.2 Recovery Procedures**

- **Database Recovery**: Point-in-time recovery capabilities
- **Service Recovery**: Rapid service restoration procedures
- **Data Integrity**: Verification procedures for restored data
- **Failover Support**: Automatic failover to backup instances

---

### **13. Documentation Requirements**

#### **13.1 User Documentation**

- **Installation Guide**: Complete setup and installation procedures
- **API Documentation**: Comprehensive REST API reference
- **MCP Integration Guide**: Step-by-step MCP integration instructions
- **Troubleshooting Guide**: Common issues and resolution procedures

#### **13.2 Developer Documentation**

- **Architecture Overview**: System design and component interaction
- **Development Setup**: Local development environment configuration
- **Contributing Guidelines**: Code contribution and review processes
- **Extension Guide**: Instructions for adding new features and methods

#### **13.3 Operational Documentation**

- **Deployment Guide**: Production deployment procedures
- **Configuration Reference**: Complete environment variable reference
- **Monitoring Setup**: Service monitoring and alerting configuration
- **Maintenance Procedures**: Regular maintenance and update procedures

---

### **14. License and Compliance**

#### **14.1 Licensing Requirements**

- **Dual License**: Mozilla Public License 2.0 (non-commercial) and Commercial License
- **License Validation**: Automated license compliance checking (planned)
- **Usage Tracking**: Commercial usage monitoring and reporting
- **Compliance Reporting**: Regular license compliance auditing

#### **14.2 Data Compliance**

- **Data Privacy**: User data protection and privacy compliance
- **Data Retention**: Configurable data retention policies
- **Export Controls**: Data export and transfer compliance
- **Audit Trails**: Comprehensive activity logging for compliance
