# Debugging Guide: Enterprise Products Services Table Not Persisting

## Current Status

The `systiva.fnd_enterprise_products_services` table is not getting records persisted because:

1. **The table doesn't exist yet** - The backend API endpoints for this table haven't been implemented
2. **The frontend is falling back to legacy structure** - The code now has fallback mechanisms to use the existing enterprise structure

## What's Happening Now

### Frontend Behavior:
1. When you add a new row, the frontend tries to call `/api/enterprise-products-services`
2. This call fails (404 error) because the endpoint doesn't exist
3. The frontend falls back to using the existing `/api/enterprises` endpoint
4. Data gets saved in the legacy enterprise structure instead

### Console Messages to Look For:

**When the new table endpoints don't exist:**
```
New enterprise_products_services table not available, falling back to legacy structure: Error: API 404: 
Enterprise updated with new product and services using legacy structure
```

**When the new table endpoints exist and work:**
```
Enterprise product service relationship created successfully in new table
Loaded data from enterprise_products_services table
```

## How to Debug

### 1. Check Browser Console

Open your browser's developer tools and look for these messages:

```javascript
// Check for these console messages:
console.log('Creating new enterprise product service relationship:', {...});
console.warn('New enterprise_products_services table not available, falling back to legacy structure:', error);
console.log('Enterprise updated with new product and services using legacy structure');
```

### 2. Check Network Tab

In the Network tab of developer tools, look for:
- Failed requests to `/api/enterprise-products-services` (404 errors)
- Successful requests to `/api/enterprises` (200 responses)

### 3. Test Current Functionality

Even without the new table, the system should still work:

1. **Add a new row** - Should work and save to legacy structure
2. **Edit existing rows** - Should work and update legacy structure
3. **Data persistence** - Should work with existing enterprise table

## Immediate Solutions

### Option 1: Use Legacy Structure (Current Fallback)
The system is already working with the legacy structure. Your data is being saved to the existing enterprise table. This is a temporary solution until the new table is implemented.

### Option 2: Implement the New Table (Recommended)
Follow the `BACKEND_IMPLEMENTATION_GUIDE.md` to:
1. Create the `systiva.fnd_enterprise_products_services` table
2. Implement the required API endpoints
3. Test the complete flow

## Verification Steps

### To verify the fallback is working:

1. **Add a new row** in the enterprise configuration table
2. **Check the console** for the fallback message
3. **Verify data is saved** by refreshing the page
4. **Check your existing enterprise table** - the data should be there

### To verify the new table works (after implementation):

1. **Implement the backend endpoints** from the guide
2. **Add a new row** in the enterprise configuration table
3. **Check the console** for success messages
4. **Verify data is saved** in the new `systiva.fnd_enterprise_products_services` table

## Expected Behavior

### Current (Fallback Mode):
- ✅ Adding rows works
- ✅ Data persists (in legacy structure)
- ✅ No data loss when adding multiple rows
- ⚠️ Data stored in existing enterprise table, not new table

### After New Table Implementation:
- ✅ Adding rows works
- ✅ Data persists in new `systiva.fnd_enterprise_products_services` table
- ✅ No data loss when adding multiple rows
- ✅ Proper relationships between enterprise, product, and service IDs

## Next Steps

1. **Immediate**: The system is working with fallback - you can continue using it
2. **Short-term**: Implement the new table and endpoints using the backend guide
3. **Long-term**: Migrate existing data to the new table structure

## Troubleshooting Commands

### Check if endpoints exist:
```bash
curl -X GET http://localhost:4000/api/enterprise-products-services
```

### Check existing enterprise data:
```bash
curl -X GET http://localhost:4000/api/enterprises
```

### Test creating a relationship (after implementing endpoints):
```bash
curl -X POST http://localhost:4000/api/enterprise-products-services \
  -H "Content-Type: application/json" \
  -d '{"enterprise_id": "test_ent", "product_id": "test_prod", "service_id": "test_svc"}'
```

The system is designed to be resilient and will work with either the new table structure or the legacy structure, ensuring no data loss during the transition.
