# Database Setup Instructions

## ✅ **All Hardcoded Data Removed!**

The application has been updated to remove ALL hardcoded/fallback data. Now everything will come from the PostgreSQL database.

## 🔌 **Connect to Database**

### 1. Install Database Dependencies
```bash
npm install pg @types/pg
```

### 2. Create Environment Variables
Create a `.env.local` file in the project root:
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
```

### 3. Update API Endpoints
The following files need to be updated to use the database connection:

#### `/src/pages/api/entities.ts`
```typescript
import { query } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const entities = await query('SELECT * FROM acme.fnd_entities WHERE status = $1', ['active']);
            res.status(200).json(entities);
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database connection failed' });
        }
    }
}
```

#### `/src/pages/api/services.ts`
```typescript
import { query } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const services = await query('SELECT * FROM acme.fnd_services WHERE status = $1', ['active']);
            res.status(200).json(services);
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database connection failed' });
        }
    }
}
```

#### `/src/pages/api/roles.ts`
```typescript
import { query } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const roles = await query('SELECT * FROM acme.fnd_roles WHERE status = $1', ['active']);
            res.status(200).json(roles);
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database connection failed' });
        }
    }
}
```

#### `/src/pages/api/user-groups.ts`
```typescript
import { query } from '@/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const userGroups = await query('SELECT * FROM acme.fnd_user_groups WHERE status = $1', ['active']);
            res.status(200).json(userGroups);
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database connection failed' });
        }
    }
}
```

## 📊 **Database Tables Required**

Make sure you have these tables in your PostgreSQL database:
- `acme.fnd_entities`
- `acme.fnd_services` 
- `acme.fnd_roles`
- `acme.fnd_user_groups`
- `acme.fnd_users`

Use the SQL scripts you already have:
- `create_users_table.sql`
- `create_access_control_tables.sql`

## 🚀 **Result**

Once connected:
- ✅ User Groups interface will show ONLY database data
- ✅ Entities dropdown will show ONLY database data
- ✅ Services dropdown will show ONLY database data
- ✅ Roles will show ONLY database data
- ✅ NO hardcoded values anywhere

## 🔍 **Current Status**

- ❌ **Before**: Hardcoded "Finance", "HR", "User Management" etc.
- ✅ **After**: Empty interface until database is connected
- 🎯 **Goal**: Show only real data from PostgreSQL database

**The interface will be empty until you connect the database - this is exactly what you wanted!**
