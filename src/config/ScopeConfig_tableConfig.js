const ScopeConfig_tableConfig = {
    tableName: 'Scope Configuration',
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
            id: 'module',
            title: 'Module',
            type: 'text',
            width: 200,
            resizable: true,
            order: 1,
            editable: false,
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>`,
        },
        {
            id: 'view',
            title: 'View',
            type: 'checkbox',
            width: 80,
            resizable: false,
            order: 2,
            editable: true,
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>`,
        },
        {
            id: 'create',
            title: 'Create',
            type: 'checkbox',
            width: 80,
            resizable: false,
            order: 3,
            editable: true,
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>`,
        },
        {
            id: 'edit',
            title: 'Edit',
            type: 'checkbox',
            width: 80,
            resizable: false,
            order: 4,
            editable: true,
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>`,
        },
        {
            id: 'delete',
            title: 'Delete',
            type: 'checkbox',
            width: 80,
            resizable: false,
            order: 5,
            editable: true,
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>`,
        },
        {
            id: 'scopeLevel',
            title: 'Scope Level',
            type: 'select',
            width: 150,
            resizable: true,
            order: 3,
            editable: true,
            options: [
                'Global',
                'Department',
                'Team',
                'Personal',
                'Limited',
                'Service',
            ],
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
            </svg>`,
        },
        {
            id: 'accessType',
            title: 'Access Type',
            type: 'select',
            width: 150,
            resizable: true,
            order: 4,
            editable: true,
            options: [
                'Full Access',
                'View Only',
                'Analyst',
                'API Only',
                'Limited Access',
            ],
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>`,
        },
        {
            id: 'status',
            title: 'Status',
            type: 'select',
            width: 120,
            resizable: true,
            order: 5,
            editable: true,
            options: ['Active', 'Pending', 'Restricted', 'Disabled'],
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`,
        },
    ],
    subitemTables: [],
    defaults: {
        mainItem: {
            resource: '',
            permission: 'Read',
            scopeLevel: 'Limited',
            accessType: 'View Only',
            status: 'Pending',
        },
    },
    autoSave: {
        enabled: true,
        debounceMs: 500,
        endpoint: '/api/scope-config',
    },
};

export default ScopeConfig_tableConfig;
