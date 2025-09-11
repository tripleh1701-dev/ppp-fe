// Table configuration for Assign User Groups functionality
const AssignUserGroups_tableConfig = {
    title: 'User Groups Assignment',
    description:
        'Assign user groups to users with entity and service configurations',

    // Column definitions
    columns: [
        {
            id: 'select',
            header: '',
            width: '60px',
            type: 'checkbox',
            sortable: false,
            resizable: false,
        },
        {
            id: 'group',
            header: 'Group',
            width: '200px',
            type: 'text',
            sortable: true,
            resizable: true,
            required: true,
        },
        {
            id: 'description',
            header: 'Description',
            width: '250px',
            type: 'text',
            sortable: true,
            resizable: true,
        },
        {
            id: 'entity',
            header: 'Entity',
            width: '150px',
            type: 'dropdown',
            sortable: false,
            resizable: true,
            options: [], // Will be populated from API
            placeholder: 'Select Entity',
        },
        {
            id: 'service',
            header: 'Service',
            width: '150px',
            type: 'dropdown',
            sortable: false,
            resizable: true,
            options: [], // Will be populated from API
            placeholder: 'Select Service',
        },
        {
            id: 'roles',
            header: 'Roles',
            width: '120px',
            type: 'link',
            sortable: false,
            resizable: true,
            linkText: (value) => `${value || 0} roles`,
        },
    ],

    // Table settings
    settings: {
        pagination: {
            enabled: true,
            pageSize: 10,
            pageSizeOptions: [5, 10, 20, 50],
        },
        sorting: {
            enabled: true,
            defaultSort: {
                column: 'group',
                direction: 'asc',
            },
        },
        filtering: {
            enabled: true,
            searchPlaceholder: 'Search groups...',
        },
        selection: {
            enabled: true,
            mode: 'multiple', // 'single' or 'multiple'
            showSelectAll: true,
        },
        actions: {
            enabled: true,
            bulkActions: [
                {
                    id: 'assign',
                    label: 'Assign To User',
                    icon: 'user-plus',
                    variant: 'primary',
                },
            ],
            rowActions: [],
        },
    },

    // Data transformation functions
    dataTransform: {
        // Transform raw data to table format
        incoming: (data) => {
            return data.map((item) => ({
                id: item.id,
                select: false,
                group: item.name || item.groupName,
                description: item.description || 'No description provided',
                entity: item.entityId || null,
                service: item.serviceId || null,
                roles: item.roleCount || 0,
            }));
        },

        // Transform table data back to API format
        outgoing: (data) => {
            return data.map((item) => ({
                id: item.id,
                groupName: item.group,
                description: item.description,
                entityId: item.entity,
                serviceId: item.service,
                roleCount: item.roles,
            }));
        },
    },

    // API endpoints
    api: {
        fetch: '/api/user-groups',
        entities: '/api/business-units/entities',
        services: '/api/services',
        assign: '/api/users/{userId}/assign-groups',
        remove: '/api/users/{userId}/remove-group/{groupId}',
    },

    // Validation rules
    validation: {
        group: {
            required: true,
            minLength: 2,
            maxLength: 100,
        },
        description: {
            maxLength: 500,
        },
    },

    // UI customization
    ui: {
        theme: 'blue',
        compact: true,
        showBorders: true,
        alternatingRows: true,
        hoverEffects: true,
    },
};

export default AssignUserGroups_tableConfig;
