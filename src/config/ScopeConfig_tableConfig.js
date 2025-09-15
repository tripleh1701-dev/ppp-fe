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
            id: 'resource',
            title: 'Resource',
            type: 'text',
            width: 200,
            resizable: true,
            order: 1,
            editable: true,
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>`,
        },
        {
            id: 'permission',
            title: 'Permission',
            type: 'select',
            width: 180,
            resizable: true,
            order: 2,
            editable: true,
            options: [
                'Read',
                'Write',
                'Delete',
                'Execute',
                'Read, Write',
                'Read, Write, Delete',
                'Read, Analyze',
                'Read, Support',
            ],
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
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
