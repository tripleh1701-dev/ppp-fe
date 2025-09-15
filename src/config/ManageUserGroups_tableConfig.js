/**
 * Configuration file for Manage User Groups table using ReusableTableComponent
 * Defines columns, features, and behavior for user group management
 */

const ManageUserGroups_tableConfig = {
    // Main table column definitions
    mainTableColumns: [
        {
            id: 'checkbox',
            title: '',
            type: 'checkbox',
            width: 40,
            resizable: false,
            order: 0,
            pinned: true,
            selectAll: true, // Enable select all functionality
        },
        {
            id: 'groupName',
            title: 'Group Name',
            type: 'text',
            width: 180,
            resizable: true,
            order: 1,
            pinned: false,
            required: true,
            maxLength: 100,
            validation: {
                required: true,
                maxLength: 100,
                pattern: /^[a-zA-Z0-9\s_-]+$/,
                errorMessage:
                    'Group name is required and must contain only alphanumeric characters, spaces, hyphens, or underscores (max 100 characters)',
            },
        },
        {
            id: 'description',
            title: 'Description',
            type: 'textarea',
            width: 250,
            resizable: true,
            order: 2,
            pinned: false,
            required: false,
            maxLength: 500,
            validation: {
                required: false,
                maxLength: 500,
                errorMessage: 'Description must be less than 500 characters',
            },
        },
        {
            id: 'entity',
            title: 'Entity',
            type: 'select',
            width: 150,
            resizable: true,
            order: 3,
            pinned: false,
            required: true,
            options: [
                {value: 'Finance', label: 'Finance'},
                {value: 'HR', label: 'HR'},
                {value: 'IT Operations', label: 'IT Operations'},
                {value: 'Sales', label: 'Sales'},
                {value: 'Marketing', label: 'Marketing'},
                {value: 'Engineering', label: 'Engineering'},
                {value: 'Operations', label: 'Operations'},
                {value: 'Legal', label: 'Legal'},
            ],
            validation: {
                required: true,
                errorMessage: 'Entity is required',
            },
        },
        {
            id: 'service',
            title: 'Service',
            type: 'select',
            width: 150,
            resizable: true,
            order: 4,
            pinned: false,
            required: false,
            options: [
                {value: 'Budget Management', label: 'Budget Management'},
                {value: 'Employee Relations', label: 'Employee Relations'},
                {value: 'Infrastructure', label: 'Infrastructure'},
                {value: 'Strategy Management', label: 'Strategy Management'},
                {value: 'Communications', label: 'Communications'},
                {value: 'Quality Control', label: 'Quality Control'},
                {value: 'Process Improvement', label: 'Process Improvement'},
                {value: 'Compliance', label: 'Compliance'},
            ],
            validation: {
                required: false,
                errorMessage: 'Please select a valid service',
            },
        },
        {
            id: 'roles',
            title: 'Roles',
            type: 'custom',
            width: 180,
            resizable: true,
            order: 5,
            pinned: false,
            required: false,
            customRenderer: 'rolesCount',
        },
    ],

    // Default values for new items
    defaults: {
        mainItem: {
            groupName: '',
            description: '',
            entity: '',
            service: '',
            roles: [],
            status: 'active',
            createdDate: new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString(),
        },
        subitem: {
            name: '',
            status: 'pending',
        },
    },

    // Features configuration
    features: {
        // Table Capabilities
        search: true,
        filter: true,
        sort: true,
        groupBy: true,
        export: true,
        import: false,
        bulk: true,
        pagination: true,

        // CRUD Operations
        create: true,
        read: true,
        update: true,
        delete: true,

        // Advanced Features
        columnReorder: true,
        columnResize: true,
        columnVisibility: true,
        rowSelection: true,
        rowExpansion: false, // User groups don't need sub-items
        inlineEdit: true,
        bulkEdit: true,
        customActions: true,
        templates: false,
        validation: true,
        autoSave: false,
        newRowEditing: true, // Enable editing for new rows
        versionHistory: false,
        comments: false,
        attachments: false,
        workflow: false,
        permissions: true,
        audit: true,
        notifications: true,
    },

    // Search configuration
    search: {
        placeholder: 'Search user groups...',
        fields: ['groupName', 'description', 'entity', 'service'],
        highlight: true,
        caseSensitive: false,
        wholeWord: false,
        regex: false,
    },

    // Filter options
    filters: [
        {
            id: 'entity',
            label: 'Entity',
            type: 'select',
            options: [
                {value: 'Finance', label: 'Finance'},
                {value: 'HR', label: 'HR'},
                {value: 'IT Operations', label: 'IT Operations'},
                {value: 'Sales', label: 'Sales'},
                {value: 'Marketing', label: 'Marketing'},
                {value: 'Engineering', label: 'Engineering'},
                {value: 'Operations', label: 'Operations'},
                {value: 'Legal', label: 'Legal'},
            ],
        },
        {
            id: 'service',
            label: 'Service',
            type: 'select',
            options: [
                {value: 'Budget Management', label: 'Budget Management'},
                {value: 'Employee Relations', label: 'Employee Relations'},
                {value: 'Infrastructure', label: 'Infrastructure'},
                {value: 'Strategy Management', label: 'Strategy Management'},
                {value: 'Communications', label: 'Communications'},
                {value: 'Quality Control', label: 'Quality Control'},
                {value: 'Process Improvement', label: 'Process Improvement'},
                {value: 'Compliance', label: 'Compliance'},
            ],
        },
        {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
                {value: 'active', label: 'Active'},
                {value: 'inactive', label: 'Inactive'},
                {value: 'draft', label: 'Draft'},
            ],
        },
    ],

    // Grouping options
    grouping: [
        {
            id: 'entity',
            label: 'Group by Entity',
            field: 'entity',
        },
        {
            id: 'service',
            label: 'Group by Service',
            field: 'service',
        },
        {
            id: 'status',
            label: 'Group by Status',
            field: 'status',
        },
    ],

    // Actions configuration
    actions: {
        // Row-level actions
        row: [
            {
                id: 'save',
                label: 'Save Group',
                icon: 'save',
                type: 'success',
                permission: 'create',
                showOnNew: true, // Only show for new rows
            },
            {
                id: 'cancel',
                label: 'Cancel',
                icon: 'cancel',
                type: 'secondary',
                permission: 'create',
                showOnNew: true, // Only show for new rows
            },
            {
                id: 'edit',
                label: 'Edit Group',
                icon: 'edit',
                type: 'primary',
                permission: 'edit',
                hideOnNew: true, // Hide for new rows
            },
            {
                id: 'duplicate',
                label: 'Duplicate Group',
                icon: 'copy',
                type: 'secondary',
                permission: 'create',
                hideOnNew: true, // Hide for new rows
            },
            {
                id: 'delete',
                label: 'Delete Group',
                icon: 'delete',
                type: 'danger',
                permission: 'delete',
                confirm: true,
                confirmMessage:
                    'Are you sure you want to delete this user group?',
                hideOnNew: true, // Hide for new rows
            },
        ],

        // Bulk actions
        bulk: [
            {
                id: 'bulkEdit',
                label: 'Edit Selected',
                icon: 'edit',
                type: 'primary',
                permission: 'edit',
            },
            {
                id: 'bulkDelete',
                label: 'Delete Selected',
                icon: 'delete',
                type: 'danger',
                permission: 'delete',
                confirm: true,
                confirmMessage:
                    'Are you sure you want to delete the selected user groups?',
            },
            {
                id: 'bulkExport',
                label: 'Export Selected',
                icon: 'export',
                type: 'secondary',
                permission: 'read',
            },
        ],
    },

    // Validation rules
    validation: {
        rules: {
            groupName: {
                required: true,
                minLength: 2,
                maxLength: 100,
                pattern: /^[a-zA-Z0-9\s_-]+$/,
                unique: true,
            },
            description: {
                maxLength: 500,
            },
            entity: {
                required: true,
            },
        },
        messages: {
            required: 'This field is required',
            minLength: 'Minimum length is {min} characters',
            maxLength: 'Maximum length is {max} characters',
            pattern: 'Invalid format',
            unique: 'This value already exists',
        },
    },

    // Pagination settings
    pagination: {
        pageSize: 25,
        pageSizeOptions: [10, 25, 50, 100],
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: true,
    },

    // Export settings
    export: {
        filename: 'user-groups',
        formats: ['csv', 'excel', 'pdf'],
        includeFilters: true,
        includeColumns: [
            'groupName',
            'description',
            'entity',
            'service',
            'roles',
        ],
    },

    // UI Configuration
    ui: {
        theme: 'modern',
        density: 'comfortable',
        striped: true,
        bordered: true,
        hover: true,
        loading: true,
        emptyState: {
            title: 'No User Groups Found',
            description: 'Create your first user group to get started',
            action: 'Create User Group',
        },
    },
};

export default ManageUserGroups_tableConfig;
