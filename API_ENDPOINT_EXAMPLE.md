# Backend API Endpoint for Array Structure

## 📊 Updated Database Schema

### Table: `fnd_enterprise_products_services`
```sql
CREATE TABLE fnd_enterprise_products_services (
    id SERIAL PRIMARY KEY,
    enterprise_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    service_id INTEGER[] NOT NULL,  -- Array of service IDs (note: singular column name)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(enterprise_id, product_id)  -- 🚨 CRITICAL: This prevents duplicates
);

-- 🔄 Note: Your backend API returns camelCase field names:
-- enterpriseId, productId, serviceId (for API responses)
-- But database columns use snake_case: enterprise_id, product_id, service_id

-- 🚨 IMPORTANT: Make sure this UNIQUE constraint exists in your database
-- If not, run: ALTER TABLE fnd_enterprise_products_services ADD CONSTRAINT unique_enterprise_product UNIQUE (enterprise_id, product_id);
```

## 🚀 API Endpoint Implementation

### POST `/api/enterprise-products-services`

**Frontend sends:**
```javascript
{
  enterpriseId: 123,
  productId: 456,
  serviceId: [1, 2, 3, 4]  // Array of service IDs (camelCase to match your API)
}
```

**Backend API Response (GET):**
```javascript
[
  {
    "id": 100,
    "enterpriseId": 4,
    "productId": 1,
    "serviceId": [3, 5, 6]  // ✅ This matches your actual API response
  }
]
```

**Backend implementation (CRITICAL - UPSERT REQUIRED):**
```javascript
// POST /api/enterprise-products-services
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { enterpriseId, productId, serviceId } = req.body;
    
    try {
      // 🚨 CRITICAL: Use UPSERT to prevent multiple rows for same enterprise+product
      const query = `
        INSERT INTO fnd_enterprise_products_services 
        (enterprise_id, product_id, service_id, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (enterprise_id, product_id) 
        DO UPDATE SET 
          service_id = EXCLUDED.service_id,  -- Replace entire array
          updated_at = NOW()
        RETURNING *;
      `;
      
      const result = await db.query(query, [enterpriseId, productId, serviceId]);
      
      console.log(`✅ Upserted enterprise_id=${enterpriseId}, product_id=${productId}, services=[${serviceId.join(',')}]`);
      
      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Enterprise-product-services relationship upserted successfully'
      });
      
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save enterprise-product-services relationship'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

## 📋 Key Benefits

### ✅ **Single Row Per Combination**
- One row for each enterprise+product pair
- All services stored as array in single column
- No duplicate rows for same enterprise+product

### ✅ **Efficient Operations**
- **Upsert**: INSERT with ON CONFLICT DO UPDATE
- **Atomic**: All services updated in single transaction
- **Fast**: No need to delete+insert multiple rows

### ✅ **Frontend Integration**
```javascript
// Frontend sends single request
await api.post('/api/enterprise-products-services', {
  enterpriseId: 123,
  productId: 456,
  serviceIds: [1, 2, 3, 4, 5]  // All services in one array
});

// Instead of multiple requests (old way):
// await api.post('/api/enterprise-products-services', {enterpriseId: 123, productId: 456, serviceId: 1});
// await api.post('/api/enterprise-products-services', {enterpriseId: 123, productId: 456, serviceId: 2});
// await api.post('/api/enterprise-products-services', {enterpriseId: 123, productId: 456, serviceId: 3});
// etc...
```

## 🔄 Migration Notes

If you have existing data in the old format, you can migrate it:

```sql
-- Migration script to convert from separate rows to array format
WITH aggregated AS (
  SELECT 
    enterprise_id,
    product_id,
    array_agg(service_id) as service_ids
  FROM old_enterprise_products_services 
  GROUP BY enterprise_id, product_id
)
INSERT INTO fnd_enterprise_products_services (enterprise_id, product_id, service_ids)
SELECT enterprise_id, product_id, service_ids 
FROM aggregated;
```

## ✅ **Result**

- **Database**: More efficient storage with arrays
- **API**: Fewer HTTP requests (1 instead of N)
- **Frontend**: Same user experience, better performance
- **Consistency**: Single source of truth per enterprise+product combination
