# Backend Implementation Guide for Enterprise Products Services

## Quick Implementation for Testing

Since the `systiva.fnd_enterprise_products_services` table doesn't exist yet, here's a quick implementation guide to get it working:

## 1. Database Setup

First, create the table in your database:

```sql
CREATE TABLE systiva.fnd_enterprise_products_services (
    id SERIAL PRIMARY KEY,
    enterprise_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    service_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_enterprise_products_services_enterprise_id ON systiva.fnd_enterprise_products_services(enterprise_id);
CREATE INDEX idx_enterprise_products_services_product_id ON systiva.fnd_enterprise_products_services(product_id);
CREATE INDEX idx_enterprise_products_services_service_id ON systiva.fnd_enterprise_products_services(service_id);
```

## 2. API Endpoints Implementation

### GET /api/enterprise-products-services

```javascript
// Express.js example
app.get('/api/enterprise-products-services', async (req, res) => {
    try {
        const query = `
            SELECT 
                eps.id,
                eps.enterprise_id,
                eps.product_id,
                eps.service_id,
                e.name as enterprise_name,
                p.name as product_name,
                s.name as service_name
            FROM systiva.fnd_enterprise_products_services eps
            LEFT JOIN enterprises e ON eps.enterprise_id = e.id
            LEFT JOIN products p ON eps.product_id = p.id
            LEFT JOIN services s ON eps.service_id = s.id
            ORDER BY eps.created_at DESC
        `;
        
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching enterprise product services:', error);
        res.status(500).json({ error: 'Failed to fetch enterprise product services' });
    }
});
```

### POST /api/enterprise-products-services

```javascript
app.post('/api/enterprise-products-services', async (req, res) => {
    try {
        const { enterprise_id, product_id, service_id } = req.body;
        
        const query = `
            INSERT INTO systiva.fnd_enterprise_products_services 
            (enterprise_id, product_id, service_id) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `;
        
        const result = await db.query(query, [enterprise_id, product_id, service_id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating enterprise product service:', error);
        res.status(500).json({ error: 'Failed to create enterprise product service' });
    }
});
```

### DELETE /api/enterprise-products-services/{id}

```javascript
app.delete('/api/enterprise-products-services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = 'DELETE FROM systiva.fnd_enterprise_products_services WHERE id = $1';
        await db.query(query, [id]);
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting enterprise product service:', error);
        res.status(500).json({ error: 'Failed to delete enterprise product service' });
    }
});
```

### DELETE /api/enterprise-products-services/enterprise/{enterpriseId}

```javascript
app.delete('/api/enterprise-products-services/enterprise/:enterpriseId', async (req, res) => {
    try {
        const { enterpriseId } = req.params;
        
        const query = 'DELETE FROM systiva.fnd_enterprise_products_services WHERE enterprise_id = $1';
        await db.query(query, [enterpriseId]);
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting enterprise product services:', error);
        res.status(500).json({ error: 'Failed to delete enterprise product services' });
    }
});
```

### DELETE /api/enterprise-products-services/enterprise-product/{enterpriseId}/{productId}

```javascript
app.delete('/api/enterprise-products-services/enterprise-product/:enterpriseId/:productId', async (req, res) => {
    try {
        const { enterpriseId, productId } = req.params;
        
        const query = 'DELETE FROM systiva.fnd_enterprise_products_services WHERE enterprise_id = $1 AND product_id = $2';
        await db.query(query, [enterpriseId, productId]);
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting enterprise product services:', error);
        res.status(500).json({ error: 'Failed to delete enterprise product services' });
    }
});
```

## 3. Testing the Implementation

### Test with curl:

```bash
# Get all relationships
curl -X GET http://localhost:4000/api/enterprise-products-services

# Create a relationship
curl -X POST http://localhost:4000/api/enterprise-products-services \
  -H "Content-Type: application/json" \
  -d '{"enterprise_id": "ent_123", "product_id": "prod_456", "service_id": "svc_789"}'

# Delete a relationship
curl -X DELETE http://localhost:4000/api/enterprise-products-services/1

# Delete all for an enterprise
curl -X DELETE http://localhost:4000/api/enterprise-products-services/enterprise/ent_123

# Delete enterprise-product combination
curl -X DELETE http://localhost:4000/api/enterprise-products-services/enterprise-product/ent_123/prod_456
```

## 4. Frontend Testing

Once you implement these endpoints:

1. Open the browser console
2. Go to the Enterprise Configuration page
3. Try adding a new row with enterprise, product, and services
4. Check the console for success messages
5. Verify data is being saved to the new table

## 5. Migration from Legacy Structure

If you have existing data in the old enterprise structure, you can migrate it:

```sql
-- Migration script (run after creating the new table)
INSERT INTO systiva.fnd_enterprise_products_services (enterprise_id, product_id, service_id)
SELECT 
    e.id as enterprise_id,
    p.id as product_id,
    s.id as service_id
FROM enterprises e
CROSS JOIN LATERAL jsonb_array_elements(e.services) as service_data
CROSS JOIN LATERAL jsonb_array_elements_text(service_data->'categories') as category_name
JOIN products p ON p.name = service_data->>'name'
JOIN services s ON s.name = category_name;
```

## 6. Troubleshooting

### Common Issues:

1. **404 Errors**: Make sure the API endpoints are properly registered in your backend
2. **Database Connection**: Verify the database connection and table exists
3. **CORS Issues**: Ensure your backend allows requests from the frontend domain
4. **Data Types**: Make sure the IDs match the data types in your existing tables

### Debug Steps:

1. Check browser console for API errors
2. Verify database table exists and has correct structure
3. Test API endpoints directly with curl or Postman
4. Check backend logs for any errors

## 7. Next Steps

After implementing these endpoints:

1. Test the complete flow end-to-end
2. Monitor for any performance issues
3. Add proper error handling and validation
4. Consider adding pagination for large datasets
5. Add proper authentication and authorization

The frontend is now set up to work with both the new table structure and fall back to the legacy structure if the new endpoints aren't available yet.
