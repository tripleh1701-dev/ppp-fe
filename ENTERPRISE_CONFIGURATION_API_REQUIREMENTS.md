# Enterprise Configuration API Requirements

## Overview
The enterprise configuration feature has been updated to use the `systiva.fnd_enterprise_products_services` table for data persistence. This document outlines the required backend API endpoints.

## Database Table Structure
```sql
CREATE TABLE systiva.fnd_enterprise_products_services (
    id SERIAL PRIMARY KEY,
    enterprise_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    service_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Required API Endpoints

### 1. GET /api/enterprise-products-services
**Purpose**: Fetch all enterprise-product-service relationships with names
**Response**: Array of objects with enterprise, product, and service names
```json
[
  {
    "id": "1",
    "enterprise_id": "ent_123",
    "product_id": "prod_456", 
    "service_id": "svc_789",
    "enterprise_name": "Acme Corp",
    "product_name": "SAP S/4HANA",
    "service_name": "DevOps"
  }
]
```

### 2. POST /api/enterprise-products-services
**Purpose**: Create a new enterprise-product-service relationship
**Request Body**:
```json
{
  "enterprise_id": "ent_123",
  "product_id": "prod_456",
  "service_id": "svc_789"
}
```

### 3. DELETE /api/enterprise-products-services/{id}
**Purpose**: Delete a specific relationship by ID

### 4. DELETE /api/enterprise-products-services/enterprise/{enterpriseId}
**Purpose**: Delete all relationships for a specific enterprise

### 5. DELETE /api/enterprise-products-services/enterprise-product/{enterpriseId}/{productId}
**Purpose**: Delete all relationships for a specific enterprise-product combination

## Existing Endpoints (Already Required)

### Enterprises
- `GET /api/enterprises` - List all enterprises
- `POST /api/enterprises` - Create new enterprise
- `PUT /api/enterprises/{id}` - Update enterprise
- `DELETE /api/enterprises/{id}` - Delete enterprise

### Products  
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `GET /api/products?search={query}` - Search products

### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create new service

## Implementation Notes

### Data Flow
1. Frontend loads data from `/api/enterprise-products-services`
2. Data is converted to the format expected by the table component
3. When users add/edit rows, the frontend:
   - Ensures enterprise exists (creates if needed)
   - Ensures product exists (creates if needed) 
   - Ensures services exist (creates if needed)
   - Creates relationships in the enterprise_products_services table
4. On auto-save, existing relationships are deleted and recreated

### Error Handling
- If enterprise/product/service creation fails, the system tries to find existing ones
- If relationships can't be created, errors are logged but don't break the UI
- The frontend continues to work even if some API calls fail

### Performance Considerations
- The GET endpoint should include JOINs to fetch names in a single query
- Consider pagination for large datasets
- Use indexes on enterprise_id, product_id, and service_id columns

## Frontend Changes Made

1. **Enterprise Configuration Page**: Updated to use the new data structure
2. **EnterpriseConfigTable Component**: Modified to:
   - Save data to enterprise_products_services table
   - Prevent values from being washed away when adding multiple rows
   - Auto-refresh after saves
   - Handle enterprise, product, and service creation inline

## Testing Requirements

1. Test creating new enterprise-product-service relationships
2. Test editing existing relationships
3. Test deleting relationships
4. Test the auto-save functionality
5. Test adding multiple rows without losing data
6. Test the refresh functionality after saves

## Migration Notes

If migrating from the old system:
1. Export existing enterprise data
2. Create the new enterprise_products_services table
3. Migrate data to the new structure
4. Update the frontend to use the new endpoints
5. Test thoroughly before deploying
