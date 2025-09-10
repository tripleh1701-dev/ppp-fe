-- =====================================================
-- Simple Users Table Creation (without sample data)
-- =====================================================

-- Create the users table directly
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

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION acme.update_fnd_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_fnd_users_updated_at ON acme.fnd_users;
CREATE TRIGGER trigger_fnd_users_updated_at
    BEFORE UPDATE ON acme.fnd_users
    FOR EACH ROW EXECUTE FUNCTION acme.update_fnd_users_updated_at();

-- Verify table was created
SELECT 'Table acme.fnd_users created successfully!' as status;

-- Show table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'acme' AND table_name = 'fnd_users'
ORDER BY ordinal_position;
