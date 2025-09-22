const Roles_tableConfig = {
    tableName: 'Assign Roles',
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
            title: 'Role Name',
            type: 'text',
            width: 250,
            resizable: true,
            order: 1,
            editable: true,
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>`,
        },
        {
            id: 'description',
            title: 'Role Description',
            type: 'text',
            width: 350,
            resizable: true,
            order: 2,
            editable: true,
            icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>`,
        },
        {
            id: 'scope',
            title: 'Scope',
            type: 'button',
            width: 120,
            resizable: true,
            order: 3,
            editable: false,
            actionType: 'configureScope',
            actionText: '',
            buttonStyle: 'icon',
            dynamicIcon: true, // Enable dynamic icon rendering
            iconRenderer: (item) => {
                const hasConfig = item.hasScopeConfig;
                const baseClasses = 'w-5 h-5 transition-all duration-300';
                const configuredClasses = hasConfig
                    ? 'text-green-600 hover:text-green-700 hover:scale-110 drop-shadow-sm'
                    : 'text-gray-400 hover:text-blue-500 hover:scale-110';

                return `<svg class="${baseClasses} ${configuredClasses}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    ${
                        hasConfig
                            ? '<circle cx="12" cy="12" r="2" fill="currentColor" class="animate-pulse"/>'
                            : ''
                    }
                </svg>`;
            },
            icon: `<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>`,
        },
    ],
    subitemTables: [],
    defaults: {
        mainItem: {
            roleName: '',
            description: '',
        },
    },
    autoSave: {
        enabled: true,
        debounceMs: 500,
        endpoint: '/api/roles',
    },
    // UI Configuration for compact rows
    ui: {
        rowHeight: 'compact', // 'compact', 'normal', 'comfortable'
        density: 'compact',
        padding: 'small',
        fontSize: 'sm',
        borderStyle: 'minimal',
        compactMode: true,
    },
};

export default Roles_tableConfig;
