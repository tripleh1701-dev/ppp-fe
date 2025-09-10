-- =====================================================
-- Diagnostic queries to check existing table structures
-- =====================================================

-- Check the structure of fnd_enterprise table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'acme' AND table_name = 'fnd_enterprise'
ORDER BY ordinal_position;

-- Check the structure of fnd_accounts table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'acme' AND table_name = 'fnd_accounts'
ORDER BY ordinal_position;

-- Check primary key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'acme'
    AND tc.table_name IN ('fnd_enterprise', 'fnd_accounts')
    AND tc.constraint_type = 'PRIMARY KEY';
