# Backend Fixes for Enterprise Products Services API

## Issues Identified

1. **Missing DELETE endpoint**: `DELETE /api/enterprise-products-services/enterprise-product/{enterpriseId}/{productId}`
2. **Incorrect GET endpoint**: Returning `null` values instead of populated data
3. **Missing Business Units Entities endpoint**: `GET /api/business-units/entities?accountId=X&enterpriseId=Y&enterpriseName=Z`

## Complete Backend Implementation

### 1. Database Table (if not exists)

```sql
CREATE TABLE IF NOT EXISTS systiva.fnd_enterprise_products_services (
    id SERIAL PRIMARY KEY,
    enterprise_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    service_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enterprise_products_services_enterprise_id 
ON systiva.fnd_enterprise_products_services(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_products_services_product_id 
ON systiva.fnd_enterprise_products_services(product_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_products_services_service_id 
ON systiva.fnd_enterprise_products_services(service_id);
```

### 2. Fixed GET Endpoint

**Problem**: Your current endpoint returns `[ { "id": 1, "enterpriseId": null, "productId": null, "serviceId": null } ]`

**Solution**: Use proper JOINs to fetch related data

```javascript
// Express.js implementation
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
        
        // Transform to match frontend expectations
        const transformedData = result.rows.map(row => ({
            id: row.id.toString(),
            enterprise_id: row.enterprise_id,
            product_id: row.product_id,
            service_id: row.service_id,
            enterprise_name: row.enterprise_name,
            product_name: row.product_name,
            service_name: row.service_name
        }));
        
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching enterprise product services:', error);
        res.status(500).json({ error: 'Failed to fetch enterprise product services' });
    }
});
```

### 3. Missing DELETE Endpoint

**Problem**: Frontend calls `DELETE /api/enterprise-products-services/enterprise-product/12/11` but endpoint doesn't exist

**Solution**: Add the missing endpoint

```javascript
// Express.js implementation
app.delete('/api/enterprise-products-services/enterprise-product/:enterpriseId/:productId', async (req, res) => {
    try {
        const { enterpriseId, productId } = req.params;
        
        const query = `
            DELETE FROM systiva.fnd_enterprise_products_services 
            WHERE enterprise_id = $1 AND product_id = $2
        `;
        
        const result = await db.query(query, [enterpriseId, productId]);
        
        console.log(`Deleted ${result.rowCount} relationships for enterprise ${enterpriseId} and product ${productId}`);
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting enterprise product services:', error);
        res.status(500).json({ error: 'Failed to delete enterprise product services' });
    }
});
```

### 4. Missing Business Units Entities Endpoint

**Problem**: Frontend calls `GET /api/business-units/entities?accountId=1&enterpriseId=3369&enterpriseName=uid` but endpoint doesn't exist

**Solution**: Add the missing endpoint

```javascript
// Express.js implementation
app.get('/api/business-units/entities', async (req, res) => {
    try {
        const { accountId, enterpriseId, enterpriseName } = req.query;
        
        // Validate that we have either enterpriseId or enterpriseName
        if (!enterpriseId && !enterpriseName) {
            return res.status(400).json({ error: 'Either enterpriseId or enterpriseName is required' });
        }
        
        // Query to get business units with the specified enterprise
        let query = 'SELECT entities FROM business_units WHERE ';
        const queryParams = [];
        
        // Add enterprise filter
        if (enterpriseId) {
            query += 'enterprise_id = $1';
            queryParams.push(enterpriseId);
        } else {
            query += 'enterprise_name = $1';
            queryParams.push(enterpriseName);
        }
        
        // Add account filter if provided
        if (accountId) {
            query += ' AND account_id = $' + (queryParams.length + 1);
            queryParams.push(accountId);
        }
        
        const result = await db.query(query, queryParams);
        
        // Extract unique entities from all matching business units
        const entitiesSet = new Set();
        
        result.rows.forEach(row => {
            try {
                // Parse entities JSON string
                let entities;
                if (typeof row.entities === 'string') {
                    entities = JSON.parse(row.entities);
                } else if (Array.isArray(row.entities)) {
                    entities = row.entities;
                } else if (typeof row.entities === 'object' && row.entities !== null) {
                    entities = Object.keys(row.entities);
                }
                
                // Add entities to set
                if (Array.isArray(entities)) {
                    entities.forEach(entity => entitiesSet.add(entity));
                } else if (typeof entities === 'object' && entities !== null) {
                    Object.keys(entities).forEach(entity => entitiesSet.add(entity));
                }
            } catch (e) {
                console.error('Error parsing entities:', e);
            }
        });
        
        // Convert set to array and return
        res.json(Array.from(entitiesSet));
    } catch (error) {
        console.error('Error fetching business unit entities:', error);
        res.status(500).json({ error: 'Failed to fetch business unit entities' });
    }
});
```

### 5. Complete API Endpoints Set

Here's the complete set of endpoints you need:

```javascript
// GET - Fetch all relationships with names
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
        const transformedData = result.rows.map(row => ({
            id: row.id.toString(),
            enterprise_id: row.enterprise_id,
            product_id: row.product_id,
            service_id: row.service_id,
            enterprise_name: row.enterprise_name,
            product_name: row.product_name,
            service_name: row.service_name
        }));
        
        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching enterprise product services:', error);
        res.status(500).json({ error: 'Failed to fetch enterprise product services' });
    }
});

// GET - Business Units Entities endpoint
app.get('/api/business-units/entities', async (req, res) => {
    try {
        const { accountId, enterpriseId, enterpriseName } = req.query;
        
        // Validate that we have either enterpriseId or enterpriseName
        if (!enterpriseId && !enterpriseName) {
            return res.status(400).json({ error: 'Either enterpriseId or enterpriseName is required' });
        }
        
        // Query to get business units with the specified enterprise
        let query = 'SELECT entities FROM business_units WHERE ';
        const queryParams = [];
        
        // Add enterprise filter
        if (enterpriseId) {
            query += 'enterprise_id = $1';
            queryParams.push(enterpriseId);
        } else {
            query += 'enterprise_name = $1';
            queryParams.push(enterpriseName);
        }
        
        // Add account filter if provided
        if (accountId) {
            query += ' AND account_id = $' + (queryParams.length + 1);
            queryParams.push(accountId);
        }
        
        const result = await db.query(query, queryParams);
        
        // Extract unique entities from all matching business units
        const entitiesSet = new Set();
        
        result.rows.forEach(row => {
            try {
                // Parse entities JSON string
                let entities;
                if (typeof row.entities === 'string') {
                    entities = JSON.parse(row.entities);
                } else if (Array.isArray(row.entities)) {
                    entities = row.entities;
                } else if (typeof row.entities === 'object' && row.entities !== null) {
                    entities = Object.keys(row.entities);
                }
                
                // Add entities to set
                if (Array.isArray(entities)) {
                    entities.forEach(entity => entitiesSet.add(entity));
                } else if (typeof entities === 'object' && entities !== null) {
                    Object.keys(entities).forEach(entity => entitiesSet.add(entity));
                }
            } catch (e) {
                console.error('Error parsing entities:', e);
            }
        });
        
        // Convert set to array and return
        res.json(Array.from(entitiesSet));
    } catch (error) {
        console.error('Error fetching business unit entities:', error);
        res.status(500).json({ error: 'Failed to fetch business unit entities' });
    }
});

// GET - Business Units Entities endpoint
app.get('/api/business-units/entities', async (req, res) => {
    try {
        const { accountId, enterpriseId, enterpriseName } = req.query;
        
        // Validate that we have either enterpriseId or enterpriseName
        if (!enterpriseId && !enterpriseName) {
            return res.status(400).json({ error: 'Either enterpriseId or enterpriseName is required' });
        }
        
        // Query to get business units with the specified enterprise
        let query = 'SELECT entities FROM business_units WHERE ';
        const queryParams = [];
        
        // Add enterprise filter
        if (enterpriseId) {
            query += 'enterprise_id = $1';
            queryParams.push(enterpriseId);
        } else {
            query += 'enterprise_name = $1';
            queryParams.push(enterpriseName);
        }
        
        // Add account filter if provided
        if (accountId) {
            query += ' AND account_id = $' + (queryParams.length + 1);
            queryParams.push(accountId);
        }
        
        const result = await db.query(query, queryParams);
        
        // Extract unique entities from all matching business units
        const entitiesSet = new Set();
        
        result.rows.forEach(row => {
            try {
                // Parse entities JSON string
                let entities;
                if (typeof row.entities === 'string') {
                    entities = JSON.parse(row.entities);
                } else if (Array.isArray(row.entities)) {
                    entities = row.entities;
                } else if (typeof row.entities === 'object' && row.entities !== null) {
                    entities = Object.keys(row.entities);
                }
                
                // Add entities to set
                if (Array.isArray(entities)) {
                    entities.forEach(entity => entitiesSet.add(entity));
                } else if (typeof entities === 'object' && entities !== null) {
                    Object.keys(entities).forEach(entity => entitiesSet.add(entity));
                }
            } catch (e) {
                console.error('Error parsing entities:', e);
            }
        });
        
        // Convert set to array and return
        res.json(Array.from(entitiesSet));
    } catch (error) {
        console.error('Error fetching business unit entities:', error);
        res.status(500).json({ error: 'Failed to fetch business unit entities' });
    }
});

// POST - Create new relationship
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

// DELETE - Delete by ID
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

// DELETE - Delete all for enterprise
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

// DELETE - Delete enterprise-product combination (MISSING ENDPOINT)
app.delete('/api/enterprise-products-services/enterprise-product/:enterpriseId/:productId', async (req, res) => {
    try {
        const { enterpriseId, productId } = req.params;
        
        const query = `
            DELETE FROM systiva.fnd_enterprise_products_services 
            WHERE enterprise_id = $1 AND product_id = $2
        `;
        
        const result = await db.query(query, [enterpriseId, productId]);
        
        console.log(`Deleted ${result.rowCount} relationships for enterprise ${enterpriseId} and product ${productId}`);
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting enterprise product services:', error);
        res.status(500).json({ error: 'Failed to delete enterprise product services' });
    }
});
```

## Testing Your Implementation

### 1. Test the GET endpoint:

```bash
curl -X GET http://localhost:4000/api/enterprise-products-services
```

**Expected response** (not null values):
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

### 2. Test the missing DELETE endpoint:

```bash
curl -X DELETE http://localhost:4000/api/enterprise-products-services/enterprise-product/12/11
```

**Expected response**: `204 No Content`

### 3. Test creating a relationship:

```bash
curl -X POST http://localhost:4000/api/enterprise-products-services \
  -H "Content-Type: application/json" \
  -d '{"enterprise_id": "ent_123", "product_id": "prod_456", "service_id": "svc_789"}'
```

## Verification Steps

1. **Check your backend logs** for any database connection errors
2. **Verify table exists**: Run `\dt systiva.fnd_enterprise_products_services` in your database
3. **Test endpoints individually** using curl or Postman
4. **Check frontend console** for success messages instead of fallback warnings

## Common Issues and Solutions

### Issue: "relation does not exist"
**Solution**: Create the table using the SQL above

### Issue: "column does not exist"
**Solution**: Check your table schema matches the expected column names

### Issue: "foreign key constraint"
**Solution**: Ensure the enterprise_id, product_id, and service_id values exist in their respective tables

### Issue: "permission denied"
**Solution**: Check database user permissions for the systiva schema

## After Implementation

Once you implement these fixes:

1. The frontend will stop calling the non-existent DELETE endpoint
2. The GET endpoint will return populated data instead of null values
3. Records will persist correctly in the `systiva.fnd_enterprise_products_services` table
4. The fallback mechanism will no longer be needed

Check your browser console for these success messages:
```
Enterprise product service relationship created successfully in new table
Loaded data from enterprise_products_services table
```
