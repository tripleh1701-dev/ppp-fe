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
            editable: true,
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
            editable: true,
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
            editable: true,
            options: [], // Will be populated from API
            apiEndpoint: 'http://localhost:4000/api/business-units/entities',
            apiParams: ['accountId', 'enterpriseId'], // Dynamic parameters
            validation: {
                required: true,
                errorMessage: 'Entity is required',
            },
            icon: `<svg class="w-4 h-4" fill="none" stroke="#4ba3ff" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>`,
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
            editable: true,
            options: [], // Will be populated from API
            apiEndpoint: 'http://localhost:4000/api/services',
            validation: {
                required: false,
                errorMessage: 'Please select a valid service',
            },
            icon: `<svg class="w-4 h-4" fill="none" stroke="#4ba3ff" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>`,
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
        {
            id: 'status',
            title: 'Status',
            type: 'select',
            width: 120,
            resizable: true,
            order: 6,
            pinned: false,
            required: false,
            editable: true,
            options: ['Active', 'Inactive', 'Pending'],
            validation: {
                required: false,
                errorMessage: 'Please select a valid status',
            },
            icon: `<svg class="w-4 h-4" fill="none" stroke="#4ba3ff" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
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
            status: 'Active',
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
        autoSave: true,
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

    // API Configuration for auto-save
    api: {
        baseUrl: 'http://localhost:4000/api/user-groups',
        endpoints: {
            create: 'http://localhost:4000/api/user-groups',
            update: 'http://localhost:4000/api/user-groups/{id}',
            delete: 'http://localhost:4000/api/user-groups/{id}',
            bulkCreate: 'http://localhost:4000/api/user-groups/bulk',
            bulkUpdate: 'http://localhost:4000/api/user-groups/bulk',
            bulkDelete: 'http://localhost:4000/api/user-groups/bulk',
        },
        autoSave: {
            enabled: true,
            debounceMs: 1000,
            batchSize: 10,
            retryAttempts: 3,
            retryDelay: 2000,
        },
        headers: {
            'Content-Type': 'application/json',
        },
    },

    // Additional table features for editing
    actions: {
        enableAdd: true,
        enableEdit: true,
        enableDelete: true,
        enableBulkActions: true,
        autoSave: true,
        autoSaveDelay: 1000, // Auto-save after 1 second of inactivity

        // Hover edit configuration
        enableHoverEdit: true,
        hoverEditMode: 'immediate', // 'immediate', 'delayed'
        editTrigger: 'hover', // 'hover', 'click', 'doubleClick'
        inlineEditing: true,
        quickEdit: true,
    },

    // Current user context for API calls
    currentUser: {
        accountId: 1,
        enterpriseId: 1,
    },
};

export default ManageUserGroups_tableConfig;
