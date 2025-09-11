-- =====================================================
-- Access Control Management Stored Procedures
-- Schema: acme
-- Table Prefix: fnd_
-- =====================================================

-- =====================================================
-- USER GROUP MANAGEMENT PROCEDURES
-- =====================================================

-- Create a new user group
CREATE OR REPLACE FUNCTION acme.create_fnd_user_group(
    p_account_id INTEGER,
    p_enterprise_id INTEGER,
    p_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_group_code VARCHAR(50) DEFAULT NULL,
    p_created_by VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    group_code VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_group_id INTEGER;
    v_generated_code VARCHAR(50);
BEGIN
    -- Generate group code if not provided
    IF p_group_code IS NULL THEN
        v_generated_code := 'UG_' || UPPER(REPLACE(p_name, ' ', '_')) || '_' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    ELSE
        v_generated_code := p_group_code;
    END IF;

    -- Insert new user group
    INSERT INTO acme.fnd_user_groups (
        account_id, enterprise_id, name, description, group_code,
        status, created_by, created_at, updated_at
    )
    VALUES (
        p_account_id, p_enterprise_id, p_name, p_description, v_generated_code,
        'Active', p_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING fnd_user_groups.id INTO v_group_id;

    -- Return the created user group
    RETURN QUERY
    SELECT
        ug.id,
        ug.name,
        ug.description,
        ug.group_code,
        ug.status,
        ug.created_at
    FROM acme.fnd_user_groups ug
    WHERE ug.id = v_group_id;

    -- Log the action
    INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
    VALUES ('fnd_user_groups', v_group_id, 'CREATE', p_created_by, CURRENT_TIMESTAMP,
            jsonb_build_object('name', p_name, 'status', 'Active'));
END;
$$ LANGUAGE plpgsql;

-- Get all user groups for an account
CREATE OR REPLACE FUNCTION acme.get_fnd_user_groups(
    p_account_id INTEGER,
    p_enterprise_id INTEGER DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'Active'
)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    group_code VARCHAR(50),
    status VARCHAR(20),
    entity_count BIGINT,
    service_count BIGINT,
    role_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ug.id,
        ug.name,
        ug.description,
        ug.group_code,
        ug.status,
        COALESCE(entity_counts.count, 0) as entity_count,
        COALESCE(service_counts.count, 0) as service_count,
        COALESCE(role_counts.count, 0) as role_count,
        ug.created_at,
        ug.updated_at
    FROM acme.fnd_user_groups ug
    LEFT JOIN (
        SELECT user_group_id, COUNT(*) as count
        FROM acme.fnd_user_group_entities
        GROUP BY user_group_id
    ) entity_counts ON ug.id = entity_counts.user_group_id
    LEFT JOIN (
        SELECT user_group_id, COUNT(*) as count
        FROM acme.fnd_user_group_services
        GROUP BY user_group_id
    ) service_counts ON ug.id = service_counts.user_group_id
    LEFT JOIN (
        SELECT user_group_id, COUNT(*) as count
        FROM acme.fnd_user_group_roles
        GROUP BY user_group_id
    ) role_counts ON ug.id = role_counts.user_group_id
    WHERE ug.account_id = p_account_id
    AND (p_enterprise_id IS NULL OR ug.enterprise_id = p_enterprise_id)
    AND (p_status IS NULL OR ug.status = p_status)
    ORDER BY ug.name;
END;
$$ LANGUAGE plpgsql;

-- Update user group
CREATE OR REPLACE FUNCTION acme.update_fnd_user_group(
    p_group_id INTEGER,
    p_name VARCHAR(255) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT NULL,
    p_updated_by VARCHAR(100) DEFAULT 'system'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_record RECORD;
    v_changes JSONB := '{}'::jsonb;
BEGIN
    -- Get current record for audit
    SELECT * INTO v_old_record FROM acme.fnd_user_groups WHERE id = p_group_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Build changes object
    IF p_name IS NOT NULL AND p_name != v_old_record.name THEN
        v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', v_old_record.name, 'new', p_name));
    END IF;

    IF p_description IS NOT NULL AND p_description != COALESCE(v_old_record.description, '') THEN
        v_changes := v_changes || jsonb_build_object('description', jsonb_build_object('old', v_old_record.description, 'new', p_description));
    END IF;

    IF p_status IS NOT NULL AND p_status != v_old_record.status THEN
        v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', v_old_record.status, 'new', p_status));
    END IF;

    -- Update the record
    UPDATE acme.fnd_user_groups
    SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status),
        updated_by = p_updated_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_group_id;

    -- Log the changes if any
    IF v_changes != '{}'::jsonb THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_user_groups', p_group_id, 'UPDATE', p_updated_by, CURRENT_TIMESTAMP, v_changes);
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Delete user group (soft delete)
CREATE OR REPLACE FUNCTION acme.delete_fnd_user_group(
    p_group_id INTEGER,
    p_deleted_by VARCHAR(100) DEFAULT 'system'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Soft delete by setting status to Inactive
    UPDATE acme.fnd_user_groups
    SET
        status = 'Inactive',
        updated_by = p_deleted_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_group_id;

    IF FOUND THEN
        -- Log the deletion
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_user_groups', p_group_id, 'DELETE', p_deleted_by, CURRENT_TIMESTAMP,
                jsonb_build_object('status', jsonb_build_object('old', 'Active', 'new', 'Inactive')));
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USER GROUP ENTITY ASSIGNMENT PROCEDURES
-- =====================================================

-- Assign entities to user group
CREATE OR REPLACE FUNCTION acme.assign_fnd_entities_to_group(
    p_group_id INTEGER,
    p_entity_ids INTEGER[],
    p_assigned_by VARCHAR(100) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    v_entity_id INTEGER;
    v_assigned_count INTEGER := 0;
BEGIN
    -- Loop through entity IDs and assign them
    FOREACH v_entity_id IN ARRAY p_entity_ids
    LOOP
        -- Insert if not already assigned
        INSERT INTO acme.fnd_user_group_entities (user_group_id, entity_id, assigned_by, assigned_at)
        VALUES (p_group_id, v_entity_id, p_assigned_by, CURRENT_TIMESTAMP)
        ON CONFLICT (user_group_id, entity_id) DO NOTHING;

        IF FOUND THEN
            v_assigned_count := v_assigned_count + 1;
        END IF;
    END LOOP;

    -- Log the assignment
    IF v_assigned_count > 0 THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_user_group_entities', p_group_id, 'ASSIGN', p_assigned_by, CURRENT_TIMESTAMP,
                jsonb_build_object('entity_ids', p_entity_ids, 'assigned_count', v_assigned_count));
    END IF;

    RETURN v_assigned_count;
END;
$$ LANGUAGE plpgsql;

-- Remove entities from user group
CREATE OR REPLACE FUNCTION acme.remove_fnd_entities_from_group(
    p_group_id INTEGER,
    p_entity_ids INTEGER[],
    p_removed_by VARCHAR(100) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    v_removed_count INTEGER;
BEGIN
    -- Remove the assignments
    DELETE FROM acme.fnd_user_group_entities
    WHERE user_group_id = p_group_id
    AND entity_id = ANY(p_entity_ids);

    GET DIAGNOSTICS v_removed_count = ROW_COUNT;

    -- Log the removal
    IF v_removed_count > 0 THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_user_group_entities', p_group_id, 'REMOVE', p_removed_by, CURRENT_TIMESTAMP,
                jsonb_build_object('entity_ids', p_entity_ids, 'removed_count', v_removed_count));
    END IF;

    RETURN v_removed_count;
END;
$$ LANGUAGE plpgsql;

-- Get entities assigned to user group
CREATE OR REPLACE FUNCTION acme.get_fnd_group_entities(
    p_group_id INTEGER
)
RETURNS TABLE(
    entity_id INTEGER,
    entity_name VARCHAR(255),
    entity_description TEXT,
    entity_type VARCHAR(50),
    assigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as entity_id,
        e.name as entity_name,
        e.description as entity_description,
        e.entity_type,
        uge.assigned_at,
        uge.assigned_by
    FROM acme.fnd_user_group_entities uge
    JOIN acme.fnd_entities e ON uge.entity_id = e.id
    WHERE uge.user_group_id = p_group_id
    AND e.status = 'Active'
    ORDER BY e.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USER GROUP SERVICE ASSIGNMENT PROCEDURES
-- =====================================================

-- Assign services to user group
CREATE OR REPLACE FUNCTION acme.assign_fnd_services_to_group(
    p_group_id INTEGER,
    p_service_ids INTEGER[],
    p_assigned_by VARCHAR(100) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    v_service_id INTEGER;
    v_assigned_count INTEGER := 0;
BEGIN
    -- Loop through service IDs and assign them
    FOREACH v_service_id IN ARRAY p_service_ids
    LOOP
        -- Insert if not already assigned
        INSERT INTO acme.fnd_user_group_services (user_group_id, service_id, assigned_by, assigned_at)
        VALUES (p_group_id, v_service_id, p_assigned_by, CURRENT_TIMESTAMP)
        ON CONFLICT (user_group_id, service_id) DO NOTHING;

        IF FOUND THEN
            v_assigned_count := v_assigned_count + 1;
        END IF;
    END LOOP;

    -- Log the assignment
    IF v_assigned_count > 0 THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_user_group_services', p_group_id, 'ASSIGN', p_assigned_by, CURRENT_TIMESTAMP,
                jsonb_build_object('service_ids', p_service_ids, 'assigned_count', v_assigned_count));
    END IF;

    RETURN v_assigned_count;
END;
$$ LANGUAGE plpgsql;

-- Remove services from user group
CREATE OR REPLACE FUNCTION acme.remove_fnd_services_from_group(
    p_group_id INTEGER,
    p_service_ids INTEGER[],
    p_removed_by VARCHAR(100) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    v_removed_count INTEGER;
BEGIN
    -- Remove the assignments
    DELETE FROM acme.fnd_user_group_services
    WHERE user_group_id = p_group_id
    AND service_id = ANY(p_service_ids);

    GET DIAGNOSTICS v_removed_count = ROW_COUNT;

    -- Log the removal
    IF v_removed_count > 0 THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_user_group_services', p_group_id, 'REMOVE', p_removed_by, CURRENT_TIMESTAMP,
                jsonb_build_object('service_ids', p_service_ids, 'removed_count', v_removed_count));
    END IF;

    RETURN v_removed_count;
END;
$$ LANGUAGE plpgsql;

-- Get services assigned to user group
CREATE OR REPLACE FUNCTION acme.get_fnd_group_services(
    p_group_id INTEGER
)
RETURNS TABLE(
    service_id INTEGER,
    service_name VARCHAR(255),
    service_description TEXT,
    service_code VARCHAR(50),
    category VARCHAR(100),
    assigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as service_id,
        s.name as service_name,
        s.description as service_description,
        s.service_code,
        s.category,
        ugs.assigned_at,
        ugs.assigned_by
    FROM acme.fnd_user_group_services ugs
    JOIN acme.fnd_services s ON ugs.service_id = s.id
    WHERE ugs.user_group_id = p_group_id
    AND s.status = 'Active'
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROLE MANAGEMENT PROCEDURES
-- =====================================================

-- Create a new role
CREATE OR REPLACE FUNCTION acme.create_fnd_role(
    p_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_role_code VARCHAR(50) DEFAULT NULL,
    p_role_level INTEGER DEFAULT 1,
    p_permissions JSONB DEFAULT '{}'::jsonb,
    p_created_by VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    role_code VARCHAR(50),
    role_level INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_role_id INTEGER;
    v_generated_code VARCHAR(50);
BEGIN
    -- Generate role code if not provided
    IF p_role_code IS NULL THEN
        v_generated_code := 'ROLE_' || UPPER(REPLACE(p_name, ' ', '_')) || '_' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    ELSE
        v_generated_code := p_role_code;
    END IF;

    -- Insert new role
    INSERT INTO acme.fnd_roles (
        name, description, role_code, role_level, permissions,
        status, created_by, created_at, updated_at
    )
    VALUES (
        p_name, p_description, v_generated_code, p_role_level, p_permissions,
        'Active', p_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING fnd_roles.id INTO v_role_id;

    -- Return the created role
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.description,
        r.role_code,
        r.role_level,
        r.status,
        r.created_at
    FROM acme.fnd_roles r
    WHERE r.id = v_role_id;

    -- Log the action
    INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
    VALUES ('fnd_roles', v_role_id, 'CREATE', p_created_by, CURRENT_TIMESTAMP,
            jsonb_build_object('name', p_name, 'role_level', p_role_level, 'status', 'Active'));
END;
$$ LANGUAGE plpgsql;

-- Get all roles
CREATE OR REPLACE FUNCTION acme.get_fnd_roles(
    p_status VARCHAR(20) DEFAULT 'Active',
    p_role_level INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    role_code VARCHAR(50),
    role_level INTEGER,
    permissions JSONB,
    status VARCHAR(20),
    attribute_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.name,
        r.description,
        r.role_code,
        r.role_level,
        r.permissions,
        r.status,
        COALESCE(attr_counts.count, 0) as attribute_count,
        r.created_at,
        r.updated_at
    FROM acme.fnd_roles r
    LEFT JOIN (
        SELECT role_id, COUNT(*) as count
        FROM acme.fnd_role_attributes
        WHERE is_enabled = true
        GROUP BY role_id
    ) attr_counts ON r.id = attr_counts.role_id
    WHERE (p_status IS NULL OR r.status = p_status)
    AND (p_role_level IS NULL OR r.role_level = p_role_level)
    ORDER BY r.role_level, r.name;
END;
$$ LANGUAGE plpgsql;

-- Update role
CREATE OR REPLACE FUNCTION acme.update_fnd_role(
    p_role_id INTEGER,
    p_name VARCHAR(255) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_role_level INTEGER DEFAULT NULL,
    p_permissions JSONB DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT NULL,
    p_updated_by VARCHAR(100) DEFAULT 'system'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_record RECORD;
    v_changes JSONB := '{}'::jsonb;
BEGIN
    -- Get current record for audit
    SELECT * INTO v_old_record FROM acme.fnd_roles WHERE id = p_role_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Build changes object
    IF p_name IS NOT NULL AND p_name != v_old_record.name THEN
        v_changes := v_changes || jsonb_build_object('name', jsonb_build_object('old', v_old_record.name, 'new', p_name));
    END IF;

    IF p_description IS NOT NULL AND p_description != COALESCE(v_old_record.description, '') THEN
        v_changes := v_changes || jsonb_build_object('description', jsonb_build_object('old', v_old_record.description, 'new', p_description));
    END IF;

    IF p_role_level IS NOT NULL AND p_role_level != v_old_record.role_level THEN
        v_changes := v_changes || jsonb_build_object('role_level', jsonb_build_object('old', v_old_record.role_level, 'new', p_role_level));
    END IF;

    IF p_status IS NOT NULL AND p_status != v_old_record.status THEN
        v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('old', v_old_record.status, 'new', p_status));
    END IF;

    -- Update the record
    UPDATE acme.fnd_roles
    SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        role_level = COALESCE(p_role_level, role_level),
        permissions = COALESCE(p_permissions, permissions),
        status = COALESCE(p_status, status),
        updated_by = p_updated_by,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_role_id;

    -- Log the changes if any
    IF v_changes != '{}'::jsonb THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_roles', p_role_id, 'UPDATE', p_updated_by, CURRENT_TIMESTAMP, v_changes);
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USER GROUP ROLE ASSIGNMENT PROCEDURES
-- =====================================================

-- Assign roles to user group
CREATE OR REPLACE FUNCTION acme.assign_fnd_roles_to_group(
    p_group_id INTEGER,
    p_role_ids INTEGER[],
    p_assigned_by VARCHAR(100) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    v_role_id INTEGER;
    v_assigned_count INTEGER := 0;
BEGIN
    -- Loop through role IDs and assign them
    FOREACH v_role_id IN ARRAY p_role_ids
    LOOP
        -- Insert if not already assigned
        INSERT INTO acme.fnd_user_group_roles (user_group_id, role_id, assigned_by, assigned_at)
        VALUES (p_group_id, v_role_id, p_assigned_by, CURRENT_TIMESTAMP)
        ON CONFLICT (user_group_id, role_id) DO NOTHING;

        IF FOUND THEN
            v_assigned_count := v_assigned_count + 1;
        END IF;
    END LOOP;

    -- Log the assignment
    IF v_assigned_count > 0 THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_user_group_roles', p_group_id, 'ASSIGN', p_assigned_by, CURRENT_TIMESTAMP,
                jsonb_build_object('role_ids', p_role_ids, 'assigned_count', v_assigned_count));
    END IF;

    RETURN v_assigned_count;
END;
$$ LANGUAGE plpgsql;

-- Remove roles from user group
CREATE OR REPLACE FUNCTION acme.remove_fnd_roles_from_group(
    p_group_id INTEGER,
    p_role_ids INTEGER[],
    p_removed_by VARCHAR(100) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    v_removed_count INTEGER;
BEGIN
    -- Remove the assignments
    DELETE FROM acme.fnd_user_group_roles
    WHERE user_group_id = p_group_id
    AND role_id = ANY(p_role_ids);

    GET DIAGNOSTICS v_removed_count = ROW_COUNT;

    -- Log the removal
    IF v_removed_count > 0 THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_user_group_roles', p_group_id, 'REMOVE', p_removed_by, CURRENT_TIMESTAMP,
                jsonb_build_object('role_ids', p_role_ids, 'removed_count', v_removed_count));
    END IF;

    RETURN v_removed_count;
END;
$$ LANGUAGE plpgsql;

-- Get roles assigned to user group
CREATE OR REPLACE FUNCTION acme.get_fnd_group_roles(
    p_group_id INTEGER
)
RETURNS TABLE(
    role_id INTEGER,
    role_name VARCHAR(255),
    role_description TEXT,
    role_code VARCHAR(50),
    role_level INTEGER,
    permissions JSONB,
    assigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id as role_id,
        r.name as role_name,
        r.description as role_description,
        r.role_code,
        r.role_level,
        r.permissions,
        ugr.assigned_at,
        ugr.assigned_by
    FROM acme.fnd_user_group_roles ugr
    JOIN acme.fnd_roles r ON ugr.role_id = r.id
    WHERE ugr.user_group_id = p_group_id
    AND r.status = 'Active'
    ORDER BY r.role_level, r.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ATTRIBUTE MANAGEMENT PROCEDURES
-- =====================================================

-- Create a new attribute
CREATE OR REPLACE FUNCTION acme.create_fnd_attribute(
    p_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_attribute_code VARCHAR(50) DEFAULT NULL,
    p_attribute_type VARCHAR(50) DEFAULT 'permission',
    p_category VARCHAR(100) DEFAULT 'general',
    p_default_value TEXT DEFAULT NULL,
    p_validation_rules JSONB DEFAULT '{}'::jsonb,
    p_created_by VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    attribute_code VARCHAR(50),
    attribute_type VARCHAR(50),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_attribute_id INTEGER;
    v_generated_code VARCHAR(50);
BEGIN
    -- Generate attribute code if not provided
    IF p_attribute_code IS NULL THEN
        v_generated_code := 'ATTR_' || UPPER(REPLACE(p_name, ' ', '_')) || '_' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    ELSE
        v_generated_code := p_attribute_code;
    END IF;

    -- Insert new attribute
    INSERT INTO acme.fnd_attributes (
        name, description, attribute_code, attribute_type, category,
        default_value, validation_rules, status, created_by, created_at, updated_at
    )
    VALUES (
        p_name, p_description, v_generated_code, p_attribute_type, p_category,
        p_default_value, p_validation_rules, 'Active', p_created_by, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING fnd_attributes.id INTO v_attribute_id;

    -- Return the created attribute
    RETURN QUERY
    SELECT
        a.id,
        a.name,
        a.description,
        a.attribute_code,
        a.attribute_type,
        a.category,
        a.created_at
    FROM acme.fnd_attributes a
    WHERE a.id = v_attribute_id;

    -- Log the action
    INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
    VALUES ('fnd_attributes', v_attribute_id, 'CREATE', p_created_by, CURRENT_TIMESTAMP,
            jsonb_build_object('name', p_name, 'attribute_type', p_attribute_type, 'category', p_category));
END;
$$ LANGUAGE plpgsql;

-- Get all attributes
CREATE OR REPLACE FUNCTION acme.get_fnd_attributes(
    p_category VARCHAR(100) DEFAULT NULL,
    p_attribute_type VARCHAR(50) DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'Active'
)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    attribute_code VARCHAR(50),
    attribute_type VARCHAR(50),
    category VARCHAR(100),
    default_value TEXT,
    validation_rules JSONB,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.name,
        a.description,
        a.attribute_code,
        a.attribute_type,
        a.category,
        a.default_value,
        a.validation_rules,
        a.status,
        a.created_at,
        a.updated_at
    FROM acme.fnd_attributes a
    WHERE (p_category IS NULL OR a.category = p_category)
    AND (p_attribute_type IS NULL OR a.attribute_type = p_attribute_type)
    AND (p_status IS NULL OR a.status = p_status)
    ORDER BY a.category, a.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROLE ATTRIBUTE ASSIGNMENT PROCEDURES
-- =====================================================

-- Assign attributes to role
CREATE OR REPLACE FUNCTION acme.assign_fnd_attributes_to_role(
    p_role_id INTEGER,
    p_attribute_ids INTEGER[],
    p_attribute_values TEXT[] DEFAULT NULL,
    p_assigned_by VARCHAR(100) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    v_attribute_id INTEGER;
    v_attribute_value TEXT;
    v_assigned_count INTEGER := 0;
    v_index INTEGER := 1;
BEGIN
    -- Loop through attribute IDs and assign them
    FOREACH v_attribute_id IN ARRAY p_attribute_ids
    LOOP
        -- Get corresponding value if provided
        IF p_attribute_values IS NOT NULL AND array_length(p_attribute_values, 1) >= v_index THEN
            v_attribute_value := p_attribute_values[v_index];
        ELSE
            v_attribute_value := NULL;
        END IF;

        -- Insert if not already assigned
        INSERT INTO acme.fnd_role_attributes (
            role_id, attribute_id, attribute_value, is_enabled, assigned_by, assigned_at
        )
        VALUES (
            p_role_id, v_attribute_id, v_attribute_value, true, p_assigned_by, CURRENT_TIMESTAMP
        )
        ON CONFLICT (role_id, attribute_id)
        DO UPDATE SET
            attribute_value = EXCLUDED.attribute_value,
            is_enabled = true,
            assigned_by = EXCLUDED.assigned_by,
            assigned_at = EXCLUDED.assigned_at;

        v_assigned_count := v_assigned_count + 1;
        v_index := v_index + 1;
    END LOOP;

    -- Log the assignment
    IF v_assigned_count > 0 THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_role_attributes', p_role_id, 'ASSIGN', p_assigned_by, CURRENT_TIMESTAMP,
                jsonb_build_object('attribute_ids', p_attribute_ids, 'assigned_count', v_assigned_count));
    END IF;

    RETURN v_assigned_count;
END;
$$ LANGUAGE plpgsql;

-- Remove attributes from role
CREATE OR REPLACE FUNCTION acme.remove_fnd_attributes_from_role(
    p_role_id INTEGER,
    p_attribute_ids INTEGER[],
    p_removed_by VARCHAR(100) DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
    v_removed_count INTEGER;
BEGIN
    -- Disable the attributes (soft delete)
    UPDATE acme.fnd_role_attributes
    SET
        is_enabled = false,
        assigned_by = p_removed_by,
        assigned_at = CURRENT_TIMESTAMP
    WHERE role_id = p_role_id
    AND attribute_id = ANY(p_attribute_ids)
    AND is_enabled = true;

    GET DIAGNOSTICS v_removed_count = ROW_COUNT;

    -- Log the removal
    IF v_removed_count > 0 THEN
        INSERT INTO acme.fnd_audit_log (table_name, record_id, action, changed_by, changed_at, changes)
        VALUES ('fnd_role_attributes', p_role_id, 'REMOVE', p_removed_by, CURRENT_TIMESTAMP,
                jsonb_build_object('attribute_ids', p_attribute_ids, 'removed_count', v_removed_count));
    END IF;

    RETURN v_removed_count;
END;
$$ LANGUAGE plpgsql;

-- Get attributes assigned to role
CREATE OR REPLACE FUNCTION acme.get_fnd_role_attributes(
    p_role_id INTEGER,
    p_enabled_only BOOLEAN DEFAULT true
)
RETURNS TABLE(
    attribute_id INTEGER,
    attribute_name VARCHAR(255),
    attribute_description TEXT,
    attribute_code VARCHAR(50),
    attribute_type VARCHAR(50),
    category VARCHAR(100),
    attribute_value TEXT,
    is_enabled BOOLEAN,
    assigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id as attribute_id,
        a.name as attribute_name,
        a.description as attribute_description,
        a.attribute_code,
        a.attribute_type,
        a.category,
        ra.attribute_value,
        ra.is_enabled,
        ra.assigned_at,
        ra.assigned_by
    FROM acme.fnd_role_attributes ra
    JOIN acme.fnd_attributes a ON ra.attribute_id = a.id
    WHERE ra.role_id = p_role_id
    AND (NOT p_enabled_only OR ra.is_enabled = true)
    AND a.status = 'Active'
    ORDER BY a.category, a.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPREHENSIVE ACCESS CONTROL QUERIES
-- =====================================================

-- Get complete user group details with all assignments
CREATE OR REPLACE FUNCTION acme.get_fnd_complete_user_group(
    p_group_id INTEGER
)
RETURNS TABLE(
    -- Group details
    group_id INTEGER,
    group_name VARCHAR(255),
    group_description TEXT,
    group_code VARCHAR(50),
    group_status VARCHAR(20),
    -- Entities
    entities JSONB,
    -- Services
    services JSONB,
    -- Roles with attributes
    roles JSONB,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ug.id as group_id,
        ug.name as group_name,
        ug.description as group_description,
        ug.group_code,
        ug.status as group_status,
        -- Aggregate entities
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', e.id,
                    'name', e.name,
                    'description', e.description,
                    'entity_type', e.entity_type,
                    'assigned_at', uge.assigned_at
                )
            )
            FROM acme.fnd_user_group_entities uge
            JOIN acme.fnd_entities e ON uge.entity_id = e.id
            WHERE uge.user_group_id = ug.id AND e.status = 'Active'),
            '[]'::jsonb
        ) as entities,
        -- Aggregate services
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'description', s.description,
                    'service_code', s.service_code,
                    'category', s.category,
                    'assigned_at', ugs.assigned_at
                )
            )
            FROM acme.fnd_user_group_services ugs
            JOIN acme.fnd_services s ON ugs.service_id = s.id
            WHERE ugs.user_group_id = ug.id AND s.status = 'Active'),
            '[]'::jsonb
        ) as services,
        -- Aggregate roles with their attributes
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'name', r.name,
                    'description', r.description,
                    'role_code', r.role_code,
                    'role_level', r.role_level,
                    'permissions', r.permissions,
                    'assigned_at', ugr.assigned_at,
                    'attributes', COALESCE(role_attrs.attributes, '[]'::jsonb)
                )
            )
            FROM acme.fnd_user_group_roles ugr
            JOIN acme.fnd_roles r ON ugr.role_id = r.id
            LEFT JOIN (
                SELECT
                    ra.role_id,
                    jsonb_agg(
                        jsonb_build_object(
                            'id', a.id,
                            'name', a.name,
                            'attribute_code', a.attribute_code,
                            'attribute_type', a.attribute_type,
                            'category', a.category,
                            'value', ra.attribute_value
                        )
                    ) as attributes
                FROM acme.fnd_role_attributes ra
                JOIN acme.fnd_attributes a ON ra.attribute_id = a.id
                WHERE ra.is_enabled = true AND a.status = 'Active'
                GROUP BY ra.role_id
            ) role_attrs ON r.id = role_attrs.role_id
            WHERE ugr.user_group_id = ug.id AND r.status = 'Active'),
            '[]'::jsonb
        ) as roles,
        ug.created_at,
        ug.updated_at
    FROM acme.fnd_user_groups ug
    WHERE ug.id = p_group_id;
END;
$$ LANGUAGE plpgsql;

-- Get audit trail for access control changes
CREATE OR REPLACE FUNCTION acme.get_fnd_access_control_audit(
    p_table_name VARCHAR(100) DEFAULT NULL,
    p_record_id INTEGER DEFAULT NULL,
    p_changed_by VARCHAR(100) DEFAULT NULL,
    p_from_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_to_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
    id INTEGER,
    table_name VARCHAR(100),
    record_id INTEGER,
    action VARCHAR(50),
    changes JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP WITH TIME ZONE,
    client_ip INET
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.table_name,
        al.record_id,
        al.action,
        al.changes,
        al.changed_by,
        al.changed_at,
        al.client_ip
    FROM acme.fnd_audit_log al
    WHERE (p_table_name IS NULL OR al.table_name = p_table_name)
    AND (p_record_id IS NULL OR al.record_id = p_record_id)
    AND (p_changed_by IS NULL OR al.changed_by = p_changed_by)
    AND (p_from_date IS NULL OR al.changed_at >= p_from_date)
    AND (p_to_date IS NULL OR al.changed_at <= p_to_date)
    ORDER BY al.changed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UTILITY PROCEDURES
-- =====================================================

-- Get available entities for assignment
CREATE OR REPLACE FUNCTION acme.get_fnd_available_entities(
    p_account_id INTEGER,
    p_enterprise_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    entity_type VARCHAR(50),
    parent_entity_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.description,
        e.entity_type,
        pe.name as parent_entity_name
    FROM acme.fnd_entities e
    LEFT JOIN acme.fnd_entities pe ON e.parent_entity_id = pe.id
    WHERE e.account_id = p_account_id
    AND (p_enterprise_id IS NULL OR e.enterprise_id = p_enterprise_id)
    AND e.status = 'Active'
    ORDER BY e.entity_type, e.name;
END;
$$ LANGUAGE plpgsql;

-- Get available services for assignment
CREATE OR REPLACE FUNCTION acme.get_fnd_available_services(
    p_category VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE(
    id INTEGER,
    name VARCHAR(255),
    description TEXT,
    service_code VARCHAR(50),
    category VARCHAR(100),
    endpoint_url VARCHAR(500)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.name,
        s.description,
        s.service_code,
        s.category,
        s.endpoint_url
    FROM acme.fnd_services s
    WHERE (p_category IS NULL OR s.category = p_category)
    AND s.status = 'Active'
    ORDER BY s.category, s.name;
END;
$$ LANGUAGE plpgsql;

-- Execute all procedures to create them
SELECT 'Access Control Stored Procedures Created Successfully!' as status;
