/**
 * Manage User Groups Table Configuration
 *
 * Configuration for the user groups management table with comprehensive
 * field definitions, validations, and interActive features.
 */

const ManageUserGroups_tableConfig = {
    // Main table configuration
    tableName: 'User Groups',

    // Number of subitem tables per row (0 for this use case)
    subitemTableCount: 0,

    // Main table columns configuration
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
            id: 'name',
            title: 'Group Name',
            type: 'text',
            width: 140,
            resizable: true,
            order: 1,
            pinned: false,
            required: true,
            maxLength: 100,
            validation: {
                required: true,
                maxLength: 100,
                pattern: /^[a-zA-Z0-9\s\-_]+$/,
                errorMessage:
                    'Group name is required and must be alphanumeric characters, spaces, hyphens, or underscores only (max 100 characters)',
            },
        },
        {
            id: 'description',
            title: 'Description',
            type: 'textarea',
            width: 200,
            resizable: true,
            order: 2,
            pinned: false,
            required: false,
            maxLength: 500,
            validation: {
                maxLength: 500,
                errorMessage: 'Description must be less than 500 characters',
            },
        },
        {
            id: 'group_code',
            title: 'Group Code',
            type: 'text',
            width: 100,
            resizable: true,
            order: 3,
            pinned: false,
            required: true,
            maxLength: 20,
            validation: {
                required: true,
                maxLength: 20,
                pattern: /^[A-Z0-9_]+$/,
                errorMessage:
                    'Group code is required and must be uppercase letters, numbers, or underscores only (max 20 characters)',
            },
        },
        {
            id: 'entity_name',
            title: 'Entity',
            type: 'select',
            width: 120,
            resizable: true,
            order: 4,
            pinned: false,
            required: false,
            options: [], // Will be populated dynamically
            validation: {
                errorMessage: 'Please select a valid entity',
            },
        },
        {
            id: 'status',
            title: 'Status',
            type: 'select',
            width: 90,
            resizable: true,
            order: 5,
            pinned: false,
            required: true,
            options: [
                {value: 'Active', label: 'Active'},
                {value: 'Inactive', label: 'Inactive'},
            ],
            validation: {
                required: true,
                errorMessage: 'Status is required',
            },
        },
        {
            id: 'memberCount',
            title: 'Members',
            type: 'number',
            width: 80,
            resizable: true,
            order: 6,
            pinned: false,
            required: false,
            readonly: true, // Calculated field
        },
        {
            id: 'created_at',
            title: 'Created',
            type: 'date',
            width: 100,
            resizable: true,
            order: 7,
            pinned: false,
            required: false,
            readonly: true,
        },
        {
            id: 'updated_at',
            title: 'Updated',
            type: 'date',
            width: 100,
            resizable: true,
            order: 8,
            pinned: false,
            required: false,
            readonly: true,
        },
        {
            id: 'actions',
            title: 'Actions',
            type: 'actions',
            width: 80,
            resizable: false,
            order: 9,
            pinned: false,
            actions: [
                {
                    id: 'edit',
                    label: 'Edit',
                    icon: 'pencil',
                    variant: 'primary',
                },
                {
                    id: 'members',
                    label: 'Manage Members',
                    icon: 'users',
                    variant: 'secondary',
                },
                {
                    id: 'permissions',
                    label: 'Permissions',
                    icon: 'shield',
                    variant: 'secondary',
                },
                {
                    id: 'delete',
                    label: 'Delete',
                    icon: 'trash',
                    variant: 'danger',
                    confirmation: {
                        title: 'Delete User Group',
                        message:
                            'Are you sure you want to delete this user group? This action cannot be undone.',
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                    },
                },
            ],
        },
    ],

    // Table features configuration
    features: {
        search: {
            enabled: true,
            placeholder: 'Search user groups...',
            columns: ['name', 'description', 'group_code', 'entity_name'], // Searchable columns
        },
        pagination: {
            enabled: true,
            pageSize: 25,
            pageSizeOptions: [10, 25, 50, 100],
            showPageInfo: true,
        },
        sorting: {
            enabled: true,
            defaultSort: {
                column: 'name',
                direction: 'asc',
            },
            multiSort: true,
        },
        filtering: {
            enabled: true,
            filters: [
                {
                    id: 'status',
                    label: 'Status',
                    type: 'select',
                    options: [
                        {value: 'Active', label: 'Active'},
                        {value: 'Inactive', label: 'Inactive'},
                    ],
                },
                {
                    id: 'entity_name',
                    label: 'Entity',
                    type: 'select',
                    options: [], // Will be populated dynamically
                },
            ],
        },
        grouping: {
            enabled: true,
            options: [
                {value: 'entity_name', label: 'By Entity'},
                {value: 'status', label: 'By Status'},
                {value: 'created_at', label: 'By Creation Date'},
            ],
        },
        bulkActions: {
            enabled: true,
            actions: [
                {
                    id: 'activate',
                    label: 'Activate Selected',
                    icon: 'check',
                    variant: 'success',
                    confirmation: {
                        title: 'Activate User Groups',
                        message:
                            'Are you sure you want to activate the selected user groups?',
                    },
                },
                {
                    id: 'deactivate',
                    label: 'Deactivate Selected',
                    icon: 'x',
                    variant: 'warning',
                    confirmation: {
                        title: 'Deactivate User Groups',
                        message:
                            'Are you sure you want to deactivate the selected user groups?',
                    },
                },
                {
                    id: 'delete',
                    label: 'Delete Selected',
                    icon: 'trash',
                    variant: 'danger',
                    confirmation: {
                        title: 'Delete User Groups',
                        message:
                            'Are you sure you want to delete the selected user groups? This action cannot be undone.',
                    },
                },
            ],
        },
        export: {
            enabled: true,
            formats: ['csv', 'xlsx', 'pdf'],
            filename: 'user_groups',
        },
        import: {
            enabled: true,
            formats: ['csv', 'xlsx'],
            template: {
                enabled: true,
                filename: 'user_groups_template',
            },
        },
        columnVisibility: {
            enabled: true,
            defaultVisible: [
                'checkbox',
                'name',
                'description',
                'group_code',
                'entity_name',
                'status',
                'memberCount',
                'actions',
            ],
        },
        rowActions: {
            enabled: true,
            quickActions: ['edit', 'members'],
            contextMenu: true,
        },
        inlineEditing: {
            enabled: true,
            doubleClickToEdit: true,
            editableColumns: [
                'name',
                'description',
                'group_code',
                'entity_name',
                'status',
            ],
            autoSave: true,
            autoSaveDelay: 1000,
        },
        dragAndDrop: {
            enabled: true,
            reorderRows: true,
            reorderColumns: false,
        },
        virtualScrolling: {
            enabled: true,
            rowHeight: 48, // Compact row height
            bufferSize: 10,
        },
    },

    // Visual customization
    styling: {
        compact: true,
        alternatingRows: true,
        hoverEffects: true,
        borderless: false,
        roundedCorners: true,
        shadows: true,
        verticalIndicator: {
            enabled: true,
            color: '#3b82f6', // Blue color for vertical line indicator
            width: 3,
        },
        rowHeight: 48, // Compact row height
        headerHeight: 40,
        fontSize: 'sm',
        spacing: 'compact',
    },

    // Accessibility
    accessibility: {
        enabled: true,
        ariaLabels: {
            table: 'User Groups Management Table',
            search: 'Search user groups',
            filter: 'Filter user groups',
            sort: 'Sort user groups',
            pagination: 'User groups pagination',
        },
        keyboardNavigation: true,
        focusManagement: true,
        screenReader: true,
    },

    // Performance
    performance: {
        virtualScrolling: true,
        lazyLoading: true,
        debounceSearch: 300,
        debounceFilter: 500,
        memoization: true,
    },

    // Data validation
    validation: {
        realTime: true,
        showErrors: true,
        errorPosition: 'tooltip',
        validateOnSubmit: true,
    },

    // API integration
    api: {
        endpoints: {
            list: '/api/user-groups',
            create: '/api/user-groups',
            update: '/api/user-groups/{id}',
            delete: '/api/user-groups/{id}',
            bulkUpdate: '/api/user-groups/bulk',
            bulkDelete: '/api/user-groups/bulk',
            export: '/api/user-groups/export',
        },
        methods: {
            list: 'GET',
            create: 'POST',
            update: 'PUT',
            delete: 'DELETE',
            bulkUpdate: 'PUT',
            bulkDelete: 'DELETE',
            export: 'GET',
        },
        responseFormat: {
            data: 'data',
            total: 'total',
            page: 'page',
            pageSize: 'pageSize',
            message: 'message',
            errors: 'errors',
        },
    },

    // Actions configuration (required by ReusableTableComponent)
    actions: {
        create: {
            enabled: true,
            label: 'Add User Group',
            icon: 'plus',
            color: 'primary',
        },
        edit: {
            enabled: true,
            label: 'Edit',
            icon: 'pencil',
            color: 'primary',
        },
        delete: {
            enabled: true,
            label: 'Delete',
            icon: 'trash',
            color: 'error',
            confirmRequired: true,
        },
        bulkDelete: {
            enabled: true,
            label: 'Delete Selected',
            icon: 'trash',
            color: 'error',
            confirmRequired: true,
        },
    },

    // API Configuration for auto-save
    api: {
        baseUrl: '/api/user-groups',
        endpoints: {
            create: '/api/user-groups',
            update: '/api/user-groups/{id}',
            delete: '/api/user-groups/{id}',
            bulkCreate: '/api/user-groups/bulk',
            bulkUpdate: '/api/user-groups/bulk',
            bulkDelete: '/api/user-groups/bulk',
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

    // Validation configuration
    validation: {
        validateOnChange: true,
        validateOnBlur: true,
        showValidationIcons: true,
        validationDelay: 500, // ms
        highlightInvalidFields: true,
    },

    // Export configuration
    export: {
        enableCSV: true,
        enableExcel: true,
        enablePDF: true,
        filename: 'user_groups_export',
        includeHeaders: true,
        excludeColumns: [], // No sensitive columns to exclude
    },
};

export default ManageUserGroups_tableConfig;
