# Dropdown "Add" Button Behavior Fix

## Issue
Previously, when users clicked the "Add" button in dropdown fields (e.g., Group Name, Role Name), it would immediately create a database record via API call. This was problematic because:
- Records were created before all required fields were filled
- Users couldn't preview or cancel the entry
- It violated the expected workflow where Save button commits all changes

## Solution Applied

### Files Modified:
1. `src/components/ManageUserGroupsTable.tsx`
2. `src/components/ManageUserRolesTable.tsx`

### Changes Made:

#### For ManageUserGroupsTable.tsx (Line ~2707):
**Before:**
```typescript
if (type === 'groupName') {
    created = await api.post<{id: string; name: string}>(
        '/api/user-management/groups',
        {name, groupName: name},
    );
}
```

**After:**
```typescript
if (type === 'groupName') {
    // DON'T create database record immediately - just add to local dropdown options
    // The actual database record will be created when Save button is clicked
    created = { id: `temp-groupname-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name };
}
```

#### For ManageUserRolesTable.tsx (Line ~2707):
**Before:**
```typescript
if (type === 'roleName') {
    created = await api.post<{id: string; name: string}>(
        '/api/user-management/roles',
        {name, roleName: name},
    );
}
```

**After:**
```typescript
if (type === 'roleName') {
    // DON'T create database record immediately - just add to local dropdown options
    // The actual database record will be created when Save button is clicked
    created = { id: `temp-rolename-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name };
}
```

## New Behavior:

### Manage User Groups Screen:
1. User types a new group name and clicks "Add" in dropdown
2. The group name is added to local dropdown options with a temporary ID
3. User can select this group name and continue filling other fields
4. **Only when user clicks Save button**, the complete row (with all fields) is validated and saved to database
5. At that point, the temporary ID is replaced with the real database ID

### Manage User Roles Screen:
- Same behavior as User Groups, but for role names

### Assigned User Group Modal:
- Same behavior applies when creating new user groups from the modal
- New group names are added locally and only committed to database when Save is clicked

## Benefits:
1. ✅ No incomplete records in database
2. ✅ Users can cancel/modify before committing
3. ✅ Consistent with Save button workflow
4. ✅ All validation happens before database insertion
5. ✅ Better data integrity

## Testing:
- Test adding new group names via dropdown
- Verify temporary IDs are used initially
- Confirm database records are only created after Save button is clicked
- Test the same behavior in Assigned User Group Modal



