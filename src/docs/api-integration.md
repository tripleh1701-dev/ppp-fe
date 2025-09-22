# API Integration Documentation

## DynamoDB Backend Integration

The frontend has been updated to work with the new DynamoDB backend APIs. This document outlines the API endpoints and data structures used.

### Data Types

All IDs are **UUID strings** (not numbers).

```typescript
interface Enterprise {
    id: string; // UUID string
    name: string;
}

interface Product {
    id: string; // UUID string
    name: string;
}

interface Service {
    id: string; // UUID string
    name: string;
}

interface EnterpriseLinkage {
    id: string; // UUID string
    enterpriseId: string; // UUID string
    productId: string; // UUID string
    serviceIds: string[]; // Array of UUID strings
    enterpriseName?: string; // Available in detailed view
    productName?: string; // Available in detailed view
    serviceNames?: string[]; // Available in detailed view
}
```

### API Endpoints

#### Enterprise Management
```
GET /api/enterprises
POST /api/enterprises
Body: { "name": "Enterprise Name" }

DELETE /api/enterprises/{id}
```

#### Product Management
```
GET /api/products
POST /api/products
Body: { "name": "Product Name" }

DELETE /api/products/{id}
```

#### Service Management
```
GET /api/services
POST /api/services
Body: { "name": "Service Name" }

DELETE /api/services/{id}
```

#### Linkage Management
```
GET /api/enterprise-products-services
GET /api/enterprise-products-services/detailed
GET /api/enterprise-products-services/enterprise/{id}/detailed

POST /api/enterprise-products-services
Body: {
    "enterpriseId": "uuid-string",
    "productId": "uuid-string", 
    "serviceIds": ["uuid1", "uuid2", "uuid3"]
}

DELETE /api/enterprise-products-services/{id}
```

### Frontend Components

#### EnterpriseLinkageTable
- Main component for managing enterprise-product-service configurations
- Supports creating, editing, and deleting linkages
- Multi-select support for services
- Real-time data loading from API

#### Enterprise Configuration Page
- Tab-based interface for managing:
  - Linkages (main configuration table)
  - Enterprises (CRUD operations)
  - Products (CRUD operations)
  - Services (CRUD operations)

### Key Features

1. **Multi-Service Selection**: Services are always handled as arrays, even for single selections
2. **Human-Readable Names**: Uses detailed endpoints to display names instead of IDs
3. **Real-Time Updates**: Data refreshes automatically after CRUD operations
4. **Fallback Handling**: Graceful degradation if detailed endpoints fail
5. **UUID Support**: All IDs are treated as UUID strings

### Usage Flow

1. **Load Dropdowns**: GET enterprises, products, services
2. **User Selection**: Enterprise + Product + Multiple Services
3. **Create Linkage**: POST with IDs
4. **Display Results**: GET detailed view with human-readable names
5. **CRUD Operations**: Full support for create, read, update, delete

### DynamoDB Storage Structure

Data is stored in DynamoDB with the following structure:
- Enterprise: `ENT#{enterpriseId}` → METADATA
- Product: `PROD#{productId}` → METADATA  
- Service: `SVC#{serviceId}` → METADATA
- Linkage: `EPS#{linkageId}` → METADATA

Plus reverse lookup records for efficient querying.
