# 🗄️ Database Implementation Guide

## 📋 Overview

All API endpoints have been updated to **require database connections**. No mock data, fallback data, or hardcoded data remains in the codebase. Everything must come from your PostgreSQL database via backend APIs.

## 🔧 Current Status

### ✅ **Removed All Mock Data**
All API endpoints now return:
- `GET` requests: **Empty arrays `[]`**
- `POST` requests: **Error responses requiring database implementation**

### 📊 **API Endpoints Requiring Database Implementation**

| Endpoint | Purpose | Database Table | Status |
|----------|---------|----------------|---------|
| `/api/enterprise-products-services` | Main data relationships | `acme.fnd_enterprise_products_services` | 🔴 **Database Required** |
| `/api/enterprises` | Enterprise data | `acme.fnd_enterprise` | 🔴 **Database Required** |
| `/api/products` | Product data | `acme.fnd_products` | 🔴 **Database Required** |
| `/api/services` | Service data | `acme.fnd_services` | 🔴 **Database Required** |
| `/api/enterprise-services` | Enterprise services | `acme.fnd_services` | 🔴 **Database Required** |
| `/api/roles` | User roles | `acme.fnd_roles` | 🔴 **Database Required** |
| `/api/user-groups` | User groups | `acme.fnd_user_groups` | 🔴 **Database Required** |
| `/api/entities` | Business entities | `acme.fnd_entities` | 🔴 **Database Required** |

## 🚀 Implementation Steps

### **1. Database Connection Setup**

Use the existing database utility:
```typescript
// src/lib/database.ts
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res.rows;
    } finally {
        client.release();
    }
}
```

### **2. Environment Variables**

Add to your `.env.local`:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/your_database
```

### **3. Main API Implementation**

#### **`/api/enterprise-products-services`** (CRITICAL)

```typescript
import { query } from '@/lib/database';

// GET - Load existing relationships
const result = await query(`
    SELECT 
        id, 
        enterprise_id as "enterpriseId", 
        product_id as "productId", 
        service_id as "serviceId"
    FROM acme.fnd_enterprise_products_services
    ORDER BY enterprise_id, product_id
`);

// POST - Upsert relationships
const result = await query(`
    INSERT INTO acme.fnd_enterprise_products_services 
    (enterprise_id, product_id, service_id, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (enterprise_id, product_id) 
    DO UPDATE SET 
      service_id = EXCLUDED.service_id,
      updated_at = NOW()
    RETURNING id, enterprise_id as "enterpriseId", product_id as "productId", service_id as "serviceId"
`, [enterpriseId, productId, serviceId]);
```

#### **`/api/enterprises`**

```typescript
// GET
const result = await query('SELECT id, name FROM acme.fnd_enterprise WHERE status = $1', ['active']);

// POST
const result = await query(`
    INSERT INTO acme.fnd_enterprise (name, created_at, updated_at)
    VALUES ($1, NOW(), NOW())
    RETURNING id, name
`, [name]);
```

#### **`/api/products`**

```typescript
// GET with optional search
let query_sql = 'SELECT id, name FROM acme.fnd_products WHERE status = $1';
let params = ['active'];

if (search) {
    query_sql += ' AND LOWER(name) LIKE $2';
    params.push(`%${search.toLowerCase()}%`);
}

const result = await query(query_sql, params);
```

#### **`/api/services`**

```typescript
// GET
const result = await query('SELECT id, name, description, service_code, category, status FROM acme.fnd_services WHERE status = $1', ['active']);

// POST
const result = await query(`
    INSERT INTO acme.fnd_services (name, description, service_code, category, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
    RETURNING id, name, description, service_code, category, status
`, [name, description, service_code, category]);
```

## 🔄 **Data Flow After Implementation**

### **Current (Database Required):**
```
Frontend → API Call → Empty Array [] → No Display
```

### **After Database Implementation:**
```
Frontend → API Call → Database Query → Real Data → Table Display
```

## 📊 **Expected Database Tables**

Ensure these tables exist in your `acme` schema:

```sql
-- Main relationship table
CREATE TABLE acme.fnd_enterprise_products_services (
    id SERIAL PRIMARY KEY,
    enterprise_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    service_id INTEGER[] NOT NULL,  -- Array of service IDs
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(enterprise_id, product_id)  -- One row per enterprise+product
);

-- Supporting tables
CREATE TABLE acme.fnd_enterprise (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE acme.fnd_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE acme.fnd_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_code VARCHAR(50),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 **Priority Implementation Order**

1. **`/api/enterprise-products-services`** - Main functionality
2. **`/api/enterprises`** - Enterprise names
3. **`/api/products`** - Product names  
4. **`/api/services`** - Service names
5. **Other endpoints** - Supporting functionality

## 🔍 **Console Messages**

Watch for these messages indicating database connection is needed:
- `⚠️ Enterprise-products-services GET: Database connection needed`
- `⚠️ Enterprises GET: Database connection needed`
- `⚠️ Products GET: Database connection needed`
- `⚠️ Services GET: Database connection needed`

## ✅ **Testing Database Implementation**

After implementing database connections, you should see:
- Console: `✅ Database query successful`
- Frontend: Data displays in tables
- Network tab: API returns actual data instead of `[]`

## 🚨 **Important Notes**

- **Field Naming**: Database uses `snake_case` (enterprise_id), API returns `camelCase` (enterpriseId)
- **UPSERT Required**: Use `ON CONFLICT` for enterprise-products-services
- **Array Handling**: `service_id` column is `INTEGER[]` type
- **No Fallbacks**: No mock data will be used - everything must come from database

---

**🎯 Result**: Once implemented, your frontend will display real database data instead of empty tables!
