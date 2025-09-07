# Access Control Tables with fnd_ Prefix

## Updated Table Names

All tables have been updated to use the `fnd_` prefix in the `acme` schema:

### Core Business Tables
1. `acme.fnd_enterprises` - Enterprise entities
2. `acme.fnd_accounts` - Business accounts within enterprises
3. `acme.fnd_entities` - Business units/departments (Finance, HR, IT, etc.)
4. `acme.fnd_services` - Available services/applications
5. `acme.fnd_roles` - User roles with permissions
6. `acme.fnd_attributes` - Role attributes/permissions

### User Groups Management Tables
7. `acme.fnd_user_groups` - Main user groups table
8. `acme.fnd_user_group_entities` - Junction table for group-entity relationships
9. `acme.fnd_user_group_services` - Junction table for group-service relationships
10. `acme.fnd_user_group_roles` - Junction table for group-role relationships
11. `acme.fnd_role_attributes` - Junction table for role-attribute relationships

### Audit & Tracking Tables
12. `acme.fnd_audit_log` - Comprehensive audit trail for all changes

## Updated Stored Procedures

All stored procedure names have been updated:
- `acme.create_fnd_enterprises_table()`
- `acme.create_fnd_accounts_table()`
- `acme.create_fnd_entities_table()`
- `acme.create_fnd_services_table()`
- `acme.create_fnd_roles_table()`
- `acme.create_fnd_user_groups_table()`
- `acme.create_fnd_user_group_entities_table()`
- `acme.create_fnd_user_group_services_table()`
- `acme.create_fnd_user_group_roles_table()`
- `acme.create_fnd_attributes_table()`
- `acme.create_fnd_role_attributes_table()`
- `acme.create_fnd_audit_log_table()`

## Updated Foreign Key References

All foreign key references have been updated to point to the new table names:
- `enterprise_id` references `acme.fnd_enterprises(id)`
- `account_id` references `acme.fnd_accounts(id)`
- `entity_id` references `acme.fnd_entities(id)`
- `service_id` references `acme.fnd_services(id)`
- `role_id` references `acme.fnd_roles(id)`
- `attribute_id` references `acme.fnd_attributes(id)`
- `user_group_id` references `acme.fnd_user_groups(id)`

## Updated Index Names

All indexes have been updated with the `fnd_` prefix:
- `idx_fnd_enterprises_code`
- `idx_fnd_accounts_enterprise_id`
- `idx_fnd_entities_account_id`
- `idx_fnd_services_code`
- `idx_fnd_roles_code`
- `idx_fnd_user_groups_account_id`
- And many more...

## API Mapping Updates Required

The frontend APIs will need to be updated to query the new table names:
- `/api/user-groups` → Query `acme.fnd_user_groups`
- `/api/business-units/entities` → Query `acme.fnd_entities`
- `/api/services` → Query `acme.fnd_services`
- `/api/roles` → Query `acme.fnd_roles`
- `/api/attributes` → Query `acme.fnd_attributes`

## Execution

To create all tables with the new naming convention:

```sql
-- Execute the master function to create all tables
SELECT acme.create_all_access_control_tables();

-- Insert sample data
SELECT acme.insert_sample_data();
```

All tables will be created with the `fnd_` prefix and properly linked foreign key relationships.
