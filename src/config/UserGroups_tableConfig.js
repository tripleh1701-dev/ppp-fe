const UserGroups_tableConfig = {
    tableName: 'User Groups Management',
    subitemTableCount: 0,
    mainTableColumns: [
        {
            id: 'checkbox',
            title: '',
            type: 'checkbox',
            width: 60,
            resizable: false,
            order: 0,
            pinned: true,
        },
        {
            id: 'name',
            title: 'Group',
            type: 'text',
            width: 200,
            resizable: true,
            order: 1,
            editable: true,
            icon: `<svg class="w-4 h-4" fill="none" stroke="#4ba3ff" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-5.523-4.477-10-10-10s-10 4.477-10 10v2m10 0H7m0 0H2v-2a3 3 0 015.196-2.121M7 20v-2m5-10a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>`,
        },
        {
            id: 'description',
            title: 'Description',
            type: 'text',
            width: 250,
            resizable: true,
            order: 2,
            editable: true,
            icon: `<svg class="w-4 h-4" fill="none" stroke="#4ba3ff" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>`,
        },
        {
            id: 'entity',
            title: 'Entity',
            type: 'select',
            width: 150,
            resizable: true,
            order: 3,
            editable: true,
            options: [], // Will be populated from API
            apiEndpoint: 'http://localhost:4000/api/business-units/entities',
            apiParams: ['accountId', 'enterpriseId'], // Dynamic parameters
            icon: `<svg class="w-4 h-4" fill="none" stroke="#4ba3ff" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>`,
        },
        {
            id: 'service',
            title: 'Service',
            type: 'select',
            width: 180,
            resizable: true,
            order: 4,
            editable: true,
            options: [], // Will be populated from API
            apiEndpoint: 'http://localhost:4000/api/services',
            icon: `<svg class="w-4 h-4" fill="none" stroke="#4ba3ff" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>`,
        },
        {
            id: 'rolesCount',
            title: 'Roles',
            type: 'button',
            width: 100,
            resizable: true,
            order: 5,
            editable: false,
            actionType: 'navigate',
            icon: `<svg class="w-4 h-4" fill="none" stroke="#4ba3ff" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>`,
        },
        {
            id: 'status',
            title: 'Status',
            type: 'select',
            options: ['Active', 'Inactive', 'Pending'],
            editable: true,
            width: 120,
            resizable: true,
            order: 6,
            icon: `<svg class="w-4 h-4" fill="none" stroke="#4ba3ff" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>`,
        },
    ],
    subitemTables: [],
    defaults: {
        mainItem: {
            group: '',
            description: '',
            entity: 'Local',
            service: 'User Services',
            rolesCount: 0,
            status: 'Active',
        },
    },
    autoSave: {
        enabled: true,
        debounceMs: 500,
        endpoint: '/api/user-groups',
    },
};

export default UserGroups_tableConfig;
