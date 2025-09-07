-- =====================================================
-- PostgreSQL Stored Procedures for Access Control Tables
-- Schema: acme
-- Table Prefix: fnd_
-- Purpose: Create tables for User Groups, Entities, Services, Roles, and Attributes management
-- =====================================================

-- Create the acme schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS acme;

-- =====================================================
-- STORED PROCEDURE: Create Enterprises Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_enterprises_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_enterprises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        code VARCHAR(50) UNIQUE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_enterprises_code ON acme.fnd_enterprises(code);
    CREATE INDEX IF NOT EXISTS idx_fnd_enterprises_status ON acme.fnd_enterprises(status);

    RAISE NOTICE 'Table acme.fnd_enterprises created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create Accounts Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_accounts_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_accounts (
        id SERIAL PRIMARY KEY,
        enterprise_id INTEGER NOT NULL REFERENCES acme.fnd_enterprises(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        code VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(enterprise_id, code)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_accounts_enterprise_id ON acme.fnd_accounts(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_accounts_code ON acme.fnd_accounts(code);
    CREATE INDEX IF NOT EXISTS idx_fnd_accounts_status ON acme.fnd_accounts(status);

    RAISE NOTICE 'Table acme.fnd_accounts created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create Entities Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_entities_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_entities (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES acme.fnd_accounts(id) ON DELETE CASCADE,
        enterprise_id INTEGER NOT NULL REFERENCES acme.fnd_enterprises(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        entity_type VARCHAR(50) DEFAULT 'department',
        parent_entity_id INTEGER REFERENCES acme.fnd_entities(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_entities_account_id ON acme.fnd_entities(account_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_entities_enterprise_id ON acme.fnd_entities(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_entities_parent_id ON acme.fnd_entities(parent_entity_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_entities_type ON acme.fnd_entities(entity_type);
    CREATE INDEX IF NOT EXISTS idx_fnd_entities_status ON acme.fnd_entities(status);

    RAISE NOTICE 'Table acme.fnd_entities created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create Services Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_services_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        service_code VARCHAR(100) UNIQUE,
        category VARCHAR(100),
        endpoint_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_services_code ON acme.fnd_services(service_code);
    CREATE INDEX IF NOT EXISTS idx_fnd_services_category ON acme.fnd_services(category);
    CREATE INDEX IF NOT EXISTS idx_fnd_services_status ON acme.fnd_services(status);

    RAISE NOTICE 'Table acme.fnd_services created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create Roles Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_roles_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        role_code VARCHAR(100) UNIQUE,
        role_level INTEGER DEFAULT 1,
        permissions JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_roles_code ON acme.fnd_roles(role_code);
    CREATE INDEX IF NOT EXISTS idx_fnd_roles_level ON acme.fnd_roles(role_level);
    CREATE INDEX IF NOT EXISTS idx_fnd_roles_status ON acme.fnd_roles(status);
    CREATE INDEX IF NOT EXISTS idx_fnd_roles_permissions ON acme.fnd_roles USING GIN(permissions);

    RAISE NOTICE 'Table acme.fnd_roles created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create User Groups Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_user_groups_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_user_groups (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES acme.fnd_accounts(id) ON DELETE CASCADE,
        enterprise_id INTEGER NOT NULL REFERENCES acme.fnd_enterprises(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        group_code VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_by INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id, enterprise_id, group_code)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_user_groups_account_id ON acme.fnd_user_groups(account_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_groups_enterprise_id ON acme.fnd_user_groups(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_groups_code ON acme.fnd_user_groups(group_code);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_groups_status ON acme.fnd_user_groups(status);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_groups_created_by ON acme.fnd_user_groups(created_by);

    RAISE NOTICE 'Table acme.fnd_user_groups created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create User Group Entities Junction Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_user_group_entities_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_user_group_entities (
        id SERIAL PRIMARY KEY,
        user_group_id INTEGER NOT NULL REFERENCES acme.fnd_user_groups(id) ON DELETE CASCADE,
        entity_id INTEGER NOT NULL REFERENCES acme.fnd_entities(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        UNIQUE(user_group_id, entity_id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_entities_group_id ON acme.fnd_user_group_entities(user_group_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_entities_entity_id ON acme.fnd_user_group_entities(entity_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_entities_assigned_by ON acme.fnd_user_group_entities(assigned_by);

    RAISE NOTICE 'Table acme.fnd_user_group_entities created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create User Group Services Junction Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_user_group_services_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_user_group_services (
        id SERIAL PRIMARY KEY,
        user_group_id INTEGER NOT NULL REFERENCES acme.fnd_user_groups(id) ON DELETE CASCADE,
        service_id INTEGER NOT NULL REFERENCES acme.fnd_services(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        UNIQUE(user_group_id, service_id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_services_group_id ON acme.fnd_user_group_services(user_group_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_services_service_id ON acme.fnd_user_group_services(service_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_services_assigned_by ON acme.fnd_user_group_services(assigned_by);

    RAISE NOTICE 'Table acme.fnd_user_group_services created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create User Group Roles Junction Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_user_group_roles_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_user_group_roles (
        id SERIAL PRIMARY KEY,
        user_group_id INTEGER NOT NULL REFERENCES acme.fnd_user_groups(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES acme.fnd_roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        UNIQUE(user_group_id, role_id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_roles_group_id ON acme.fnd_user_group_roles(user_group_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_roles_role_id ON acme.fnd_user_group_roles(role_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_roles_assigned_by ON acme.fnd_user_group_roles(assigned_by);

    RAISE NOTICE 'Table acme.fnd_user_group_roles created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create Attributes Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_attributes_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_attributes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        attribute_code VARCHAR(100) UNIQUE,
        attribute_type VARCHAR(50) DEFAULT 'permission' CHECK (attribute_type IN ('permission', 'setting', 'feature')),
        default_value JSONB DEFAULT 'false',
        category VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_attributes_code ON acme.fnd_attributes(attribute_code);
    CREATE INDEX IF NOT EXISTS idx_fnd_attributes_type ON acme.fnd_attributes(attribute_type);
    CREATE INDEX IF NOT EXISTS idx_fnd_attributes_category ON acme.fnd_attributes(category);
    CREATE INDEX IF NOT EXISTS idx_fnd_attributes_status ON acme.fnd_attributes(status);

    RAISE NOTICE 'Table acme.fnd_attributes created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create Role Attributes Junction Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_role_attributes_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_role_attributes (
        id SERIAL PRIMARY KEY,
        role_id INTEGER NOT NULL REFERENCES acme.fnd_roles(id) ON DELETE CASCADE,
        attribute_id INTEGER NOT NULL REFERENCES acme.fnd_attributes(id) ON DELETE CASCADE,
        attribute_value JSONB DEFAULT 'true',
        is_enabled BOOLEAN DEFAULT true,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER,
        UNIQUE(role_id, attribute_id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_role_attributes_role_id ON acme.fnd_role_attributes(role_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_role_attributes_attribute_id ON acme.fnd_role_attributes(attribute_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_role_attributes_enabled ON acme.fnd_role_attributes(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_fnd_role_attributes_assigned_by ON acme.fnd_role_attributes(assigned_by);

    RAISE NOTICE 'Table acme.fnd_role_attributes created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create Audit Log Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_audit_log_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_audit_log (
        id SERIAL PRIMARY KEY,
        table_name VARCHAR(100) NOT NULL,
        record_id INTEGER NOT NULL,
        action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
        old_values JSONB,
        new_values JSONB,
        changed_by INTEGER,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_audit_log_table_name ON acme.fnd_audit_log(table_name);
    CREATE INDEX IF NOT EXISTS idx_fnd_audit_log_record_id ON acme.fnd_audit_log(record_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_audit_log_action ON acme.fnd_audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_fnd_audit_log_changed_by ON acme.fnd_audit_log(changed_by);
    CREATE INDEX IF NOT EXISTS idx_fnd_audit_log_changed_at ON acme.fnd_audit_log(changed_at);

    RAISE NOTICE 'Table acme.fnd_audit_log created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MASTER STORED PROCEDURE: Create All Access Control Tables
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_all_access_control_tables()
RETURNS VOID AS $$
BEGIN
    RAISE NOTICE 'Starting creation of all access control tables in acme schema...';

    -- Create tables in dependency order
    PERFORM acme.create_fnd_enterprises_table();
    PERFORM acme.create_fnd_accounts_table();
    PERFORM acme.create_fnd_entities_table();
    PERFORM acme.create_fnd_services_table();
    PERFORM acme.create_fnd_roles_table();
    PERFORM acme.create_fnd_user_groups_table();
    PERFORM acme.create_fnd_user_group_entities_table();
    PERFORM acme.create_fnd_user_group_services_table();
    PERFORM acme.create_fnd_user_group_roles_table();
    PERFORM acme.create_fnd_attributes_table();
    PERFORM acme.create_fnd_role_attributes_table();
    PERFORM acme.create_fnd_audit_log_table();

    RAISE NOTICE 'All access control tables created successfully in acme schema!';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Insert Sample Data
-- =====================================================
CREATE OR REPLACE FUNCTION acme.insert_sample_data()
RETURNS VOID AS $$
BEGIN
    RAISE NOTICE 'Inserting sample data...';

    -- Insert sample enterprise
    INSERT INTO acme.fnd_enterprises (name, description, code)
    VALUES ('ACME Corporation', 'Main enterprise', 'ACME001')
    ON CONFLICT (code) DO NOTHING;

    -- Insert sample account
    INSERT INTO acme.fnd_accounts (enterprise_id, name, description, code)
    VALUES (1, 'Main Account', 'Primary business account', 'ACC001')
    ON CONFLICT (enterprise_id, code) DO NOTHING;

    -- Insert sample entities
    INSERT INTO acme.fnd_entities (account_id, enterprise_id, name, description, entity_type) VALUES
    (1, 1, 'Finance Department', 'Financial operations and accounting', 'department'),
    (1, 1, 'HR Department', 'Human resources management', 'department'),
    (1, 1, 'IT Department', 'Information technology services', 'department'),
    (1, 1, 'Sales Department', 'Sales and marketing operations', 'department')
    ON CONFLICT DO NOTHING;

    -- Insert sample services
    INSERT INTO acme.fnd_services (name, description, service_code, category) VALUES
    ('User Management', 'Manage user accounts and permissions', 'USR_MGMT', 'Security'),
    ('Financial Reports', 'Generate and view financial reports', 'FIN_RPT', 'Finance'),
    ('Employee Management', 'Manage employee records and HR data', 'EMP_MGMT', 'HR'),
    ('System Configuration', 'Configure system settings', 'SYS_CFG', 'Administration'),
    ('Budget Management', 'Manage budgets and financial planning', 'BDG_MGMT', 'Finance'),
    ('Payroll Processing', 'Process employee payroll', 'PAY_PROC', 'HR')
    ON CONFLICT (service_code) DO NOTHING;

    -- Insert sample roles
    INSERT INTO acme.fnd_roles (name, description, role_code, role_level, permissions) VALUES
    ('Super Admin', 'Full system access', 'SUPER_ADMIN', 10, '["read", "write", "delete", "admin"]'),
    ('System Admin', 'System administration access', 'SYS_ADMIN', 8, '["read", "write", "admin"]'),
    ('Finance Manager', 'Financial operations management', 'FIN_MGR', 6, '["read", "write"]'),
    ('HR Manager', 'Human resources management', 'HR_MGR', 6, '["read", "write"]'),
    ('Accountant', 'Financial data access', 'ACCOUNTANT', 4, '["read"]'),
    ('HR Specialist', 'HR operations access', 'HR_SPEC', 4, '["read"]')
    ON CONFLICT (role_code) DO NOTHING;

    -- Insert sample attributes
    INSERT INTO acme.fnd_attributes (name, description, attribute_code, attribute_type, category) VALUES
    ('Read Access', 'Permission to read data', 'READ_ACCESS', 'permission', 'Data Access'),
    ('Write Access', 'Permission to modify data', 'WRITE_ACCESS', 'permission', 'Data Access'),
    ('Delete Access', 'Permission to delete data', 'DELETE_ACCESS', 'permission', 'Data Access'),
    ('Export Data', 'Permission to export data', 'EXPORT_DATA', 'permission', 'Data Operations'),
    ('Approve Transactions', 'Permission to approve financial transactions', 'APPROVE_TXN', 'permission', 'Finance'),
    ('Manage Users', 'Permission to manage user accounts', 'MANAGE_USERS', 'permission', 'User Management')
    ON CONFLICT (attribute_code) DO NOTHING;

    RAISE NOTICE 'Sample data inserted successfully!';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXECUTION COMMANDS
-- =====================================================

-- Execute the master function to create all tables
SELECT acme.create_all_access_control_tables();

-- Insert sample data
SELECT acme.insert_sample_data();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables were created
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'acme'
ORDER BY tablename;

-- Show table relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'acme'
ORDER BY tc.table_name, kcu.column_name;
