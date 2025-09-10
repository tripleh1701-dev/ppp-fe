-- =====================================================
-- PostgreSQL Users Table Creation
-- Schema: acme
-- Table: fnd_users
-- Purpose: Store user information with comprehensive profile management
-- =====================================================

-- Create the acme schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS acme;

-- =====================================================
-- STORED PROCEDURE: Create Users Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_users_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        middle_name VARCHAR(50),
        last_name VARCHAR(50) NOT NULL,
        email_address VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
        locked BOOLEAN DEFAULT FALSE,
        start_date DATE NOT NULL,
        end_date DATE,
        password_hash VARCHAR(255), -- Store hashed passwords only
        assigned_user_group VARCHAR(100),

        -- Foreign key references to existing tables
        enterprise_id INTEGER REFERENCES acme.fnd_enterprise(enterprise_id) ON DELETE SET NULL,
        account_id INTEGER REFERENCES acme.fnd_accounts(account_id) ON DELETE SET NULL,

        -- Audit fields
        created_by INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE,

        -- Additional security fields
        failed_login_attempts INTEGER DEFAULT 0,
        account_locked_until TIMESTAMP WITH TIME ZONE,
        password_expires_at TIMESTAMP WITH TIME ZONE,
        must_change_password BOOLEAN DEFAULT TRUE
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_fnd_users_username ON acme.fnd_users(username);
    CREATE INDEX IF NOT EXISTS idx_fnd_users_email ON acme.fnd_users(email_address);
    CREATE INDEX IF NOT EXISTS idx_fnd_users_status ON acme.fnd_users(status);
    CREATE INDEX IF NOT EXISTS idx_fnd_users_locked ON acme.fnd_users(locked);
    CREATE INDEX IF NOT EXISTS idx_fnd_users_enterprise_id ON acme.fnd_users(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_users_account_id ON acme.fnd_users(account_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_users_user_group ON acme.fnd_users(assigned_user_group);
    CREATE INDEX IF NOT EXISTS idx_fnd_users_start_date ON acme.fnd_users(start_date);
    CREATE INDEX IF NOT EXISTS idx_fnd_users_end_date ON acme.fnd_users(end_date);

    -- Create trigger for updating updated_at timestamp
    CREATE OR REPLACE FUNCTION acme.update_fnd_users_updated_at()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_fnd_users_updated_at ON acme.fnd_users;
    CREATE TRIGGER trigger_fnd_users_updated_at
        BEFORE UPDATE ON acme.fnd_users
        FOR EACH ROW EXECUTE FUNCTION acme.update_fnd_users_updated_at();

    RAISE NOTICE 'Table acme.fnd_users created successfully with indexes and triggers';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Create User Group Memberships Table
-- =====================================================
CREATE OR REPLACE FUNCTION acme.create_fnd_user_group_memberships_table()
RETURNS VOID AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS acme.fnd_user_group_memberships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_group_id INTEGER NOT NULL,
        assigned_date DATE DEFAULT CURRENT_DATE,
        effective_start_date DATE DEFAULT CURRENT_DATE,
        effective_end_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        assigned_by INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Ensure unique active membership per user-group combination
        UNIQUE(user_id, user_group_id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_memberships_user_id ON acme.fnd_user_group_memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_memberships_group_id ON acme.fnd_user_group_memberships(user_group_id);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_memberships_status ON acme.fnd_user_group_memberships(status);
    CREATE INDEX IF NOT EXISTS idx_fnd_user_group_memberships_dates ON acme.fnd_user_group_memberships(effective_start_date, effective_end_date);

    RAISE NOTICE 'Table acme.fnd_user_group_memberships created successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORED PROCEDURE: Add Additional Foreign Key Constraints (for optional tables)
-- =====================================================
CREATE OR REPLACE FUNCTION acme.add_fnd_users_foreign_keys()
RETURNS VOID AS $$
BEGIN

    -- Add foreign key constraint for created_by if needed
    ALTER TABLE acme.fnd_users
    ADD CONSTRAINT fk_users_created_by
    FOREIGN KEY (created_by) REFERENCES acme.fnd_users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added foreign key constraint for created_by';

    -- Add foreign key constraints for user_group_memberships table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'acme' AND table_name = 'fnd_user_group_memberships') THEN
        -- Add user_id foreign key
        ALTER TABLE acme.fnd_user_group_memberships
        ADD CONSTRAINT fk_memberships_user_id
        FOREIGN KEY (user_id) REFERENCES acme.fnd_users(id) ON DELETE CASCADE;

        -- Add user_group_id foreign key if fnd_user_groups exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'acme' AND table_name = 'fnd_user_groups') THEN
            ALTER TABLE acme.fnd_user_group_memberships
            ADD CONSTRAINT fk_memberships_user_group_id
            FOREIGN KEY (user_group_id) REFERENCES acme.fnd_user_groups(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint for user_group_id in memberships';
        END IF;

        -- Add assigned_by foreign key
        ALTER TABLE acme.fnd_user_group_memberships
        ADD CONSTRAINT fk_memberships_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES acme.fnd_users(id) ON DELETE SET NULL;

        RAISE NOTICE 'Added foreign key constraints for user_group_memberships';
    END IF;

    RAISE NOTICE 'Foreign key constraints added successfully (where parent tables exist)';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key constraints already exist - skipping';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding foreign key constraints: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXECUTION COMMANDS
-- =====================================================

-- Execute the functions to create tables
SELECT acme.create_fnd_users_table();
SELECT acme.create_fnd_user_group_memberships_table();

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================
CREATE OR REPLACE FUNCTION acme.insert_sample_users()
RETURNS VOID AS $$
DECLARE
    sample_enterprise_id INTEGER;
    sample_account_id INTEGER;
BEGIN
    -- Get the first available enterprise and account IDs
    SELECT enterprise_id INTO sample_enterprise_id FROM acme.fnd_enterprise LIMIT 1;
    SELECT account_id INTO sample_account_id FROM acme.fnd_accounts LIMIT 1;

    -- Check if we have valid IDs
    IF sample_enterprise_id IS NULL THEN
        RAISE NOTICE 'No enterprises found - skipping sample data insertion';
        RETURN;
    END IF;

    IF sample_account_id IS NULL THEN
        RAISE NOTICE 'No accounts found - skipping sample data insertion';
        RETURN;
    END IF;

    RAISE NOTICE 'Using enterprise_id: %, account_id: %', sample_enterprise_id, sample_account_id;

    -- Insert sample user groups if they don't exist and fnd_user_groups table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'acme' AND table_name = 'fnd_user_groups') THEN
        BEGIN
            INSERT INTO acme.fnd_user_groups (account_id, enterprise_id, name, description, group_code, status) VALUES
            (sample_account_id, sample_enterprise_id, 'Administrators', 'System administrators with full access', 'ADMIN', 'active'),
            (sample_account_id, sample_enterprise_id, 'Developers', 'Software developers with development access', 'DEV', 'active'),
            (sample_account_id, sample_enterprise_id, 'QA Team', 'Quality assurance team members', 'QA', 'active'),
            (sample_account_id, sample_enterprise_id, 'Operations', 'Operations team members', 'OPS', 'active'),
            (sample_account_id, sample_enterprise_id, 'Finance', 'Finance team members', 'FIN', 'active')
            ON CONFLICT (account_id, enterprise_id, group_code) DO NOTHING;
            RAISE NOTICE 'Sample user groups inserted/updated';
        EXCEPTION
            WHEN unique_violation THEN
                RAISE NOTICE 'User groups already exist - skipping insertion';
            WHEN OTHERS THEN
                RAISE NOTICE 'Error inserting user groups: %, continuing with user insertion', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'fnd_user_groups table does not exist - skipping user groups insertion';
    END IF;

    -- Insert sample users
    INSERT INTO acme.fnd_users (
        username, first_name, middle_name, last_name, email_address,
        status, locked, start_date, end_date, assigned_user_group,
        enterprise_id, account_id
    ) VALUES
    ('john.doe', 'John', 'M', 'Doe', 'john.doe@company.com', 'ACTIVE', FALSE, CURRENT_DATE, NULL, 'Administrators', sample_enterprise_id, sample_account_id),
    ('jane.smith', 'Jane', NULL, 'Smith', 'jane.smith@company.com', 'ACTIVE', FALSE, CURRENT_DATE, NULL, 'Developers', sample_enterprise_id, sample_account_id),
    ('mike.johnson', 'Mike', 'R', 'Johnson', 'mike.johnson@company.com', 'ACTIVE', FALSE, CURRENT_DATE, DATE(CURRENT_DATE + INTERVAL '1 year'), 'QA Team', sample_enterprise_id, sample_account_id),
    ('sarah.wilson', 'Sarah', 'L', 'Wilson', 'sarah.wilson@company.com', 'INACTIVE', TRUE, CURRENT_DATE - INTERVAL '30 days', NULL, 'Operations', sample_enterprise_id, sample_account_id)
    ON CONFLICT (username) DO NOTHING;

    RAISE NOTICE 'Sample users inserted successfully!';
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
SELECT acme.insert_sample_users();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify users table was created
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'acme' AND tablename LIKE '%users%'
ORDER BY tablename;

-- Show column information for users table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'acme' AND table_name = 'fnd_users'
ORDER BY ordinal_position;

-- Show sample users data
SELECT
    id,
    username,
    first_name,
    middle_name,
    last_name,
    email_address,
    status,
    locked,
    start_date,
    end_date,
    assigned_user_group
FROM acme.fnd_users
ORDER BY created_at DESC
LIMIT 10;
