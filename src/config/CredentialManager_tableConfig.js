/**
 * Credential Manager Table Configuration
 *
 * Configuration for the credential management table with comprehensive
 * field definitions, validations, and interactive features.
 */

const CredentialManager_tableConfig = {
    // Main table configuration
    tableName: 'Credential Manager',

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
            id: 'credentialName',
            title: 'Credential Name',
            icon: '<svg className="w-4 h-4" fill="#3B82F6" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>',
            type: 'text',
            width: 180,
            resizable: true,
            order: 1,
            pinned: false,
            required: true,
            maxLength: 100,
            editable: false,
            validation: {
                required: true,
                maxLength: 100,
                pattern: /^[a-zA-Z0-9\s\-_]+$/,
                errorMessage:
                    'Credential name is required and must be alphanumeric characters, spaces, hyphens, or underscores only (max 100 characters)',
            },
        },
        {
            id: 'description',
            title: 'Description',
            icon: '<svg className="w-4 h-4" fill="#3B82F6" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
            type: 'text',
            width: 200,
            resizable: true,
            order: 2,
            pinned: false,
            required: false,
            maxLength: 255,
            editable: false,
            validation: {
                required: false,
                maxLength: 255,
                errorMessage: 'Description must be less than 255 characters',
            },
        },
        {
            id: 'entity',
            title: 'Entity',
            icon: '<svg className="w-4 h-4" fill="#3B82F6" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
            type: 'select',
            width: 140,
            resizable: true,
            order: 3,
            pinned: false,
            required: true,
            editable: false,
            selectConfig: {
                options: [
                    {value: 'Development', label: 'Development'},
                    {value: 'Testing', label: 'Testing'},
                    {value: 'Staging', label: 'Staging'},
                    {value: 'Production', label: 'Production'},
                    {value: 'Integration', label: 'Integration'},
                ],
                searchable: true,
                clearable: true,
                placeholder: 'Select entity',
            },
            validation: {
                required: true,
                errorMessage: 'Entity selection is required',
            },
        },
        {
            id: 'connector',
            title: 'Connector',
            icon: '<svg className="w-4 h-4" fill="#3B82F6" viewBox="0 0 24 24"><path d="M10.59 13.41c.41.39.41 1.03 0 1.42-.39.39-1.03.39-1.42 0a5.003 5.003 0 0 1 0-7.07l3.54-3.54a5.003 5.003 0 0 1 7.07 0 5.003 5.003 0 0 1 0 7.07l-1.49 1.49c.01-.82-.12-1.64-.4-2.42l.47-.48a2.982 2.982 0 0 0 0-4.24 2.982 2.982 0 0 0-4.24 0l-3.53 3.53a2.982 2.982 0 0 0 0 4.24z"/></svg>',
            type: 'select',
            width: 160,
            resizable: true,
            order: 4,
            pinned: false,
            required: true,
            editable: false,
            selectConfig: {
                options: [
                    {value: 'REST_API', label: 'REST API'},
                    {value: 'SOAP_API', label: 'SOAP API'},
                    {value: 'GraphQL', label: 'GraphQL'},
                    {value: 'Database', label: 'Database'},
                    {value: 'SFTP', label: 'SFTP'},
                    {value: 'FTP', label: 'FTP'},
                    {value: 'Email_SMTP', label: 'Email SMTP'},
                    {value: 'Message_Queue', label: 'Message Queue'},
                    {value: 'Cloud_Storage', label: 'Cloud Storage'},
                    {
                        value: 'Third_Party_Service',
                        label: 'Third Party Service',
                    },
                ],
                searchable: true,
                clearable: true,
                placeholder: 'Select connector',
            },
            validation: {
                required: true,
                errorMessage: 'Connector selection is required',
            },
        },
        {
            id: 'authenticationType',
            title: 'Authentication Type',
            icon: '<svg className="w-4 h-4" fill="#3B82F6" viewBox="0 0 24 24"><path d="M18,8A6,6 0 0,0 12,2A6,6 0 0,0 6,8H4A2,2 0 0,0 2,10V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V10A2,2 0 0,0 20,8H18M12,4A4,4 0 0,1 16,8H8A4,4 0 0,1 12,4Z"/></svg>',
            type: 'select',
            width: 160,
            resizable: true,
            order: 5,
            pinned: false,
            required: true,
            editable: false,
            selectConfig: {
                options: [
                    {value: 'API_KEY', label: 'API Key'},
                    {value: 'OAUTH', label: 'OAuth'},
                    {value: 'BASIC_AUTH', label: 'Basic Auth'},
                    {value: 'TOKEN', label: 'Token'},
                    {value: 'CERTIFICATE', label: 'Certificate'},
                ],
                searchable: false,
                clearable: false,
                placeholder: 'Select auth type',
            },
            validation: {
                required: true,
                errorMessage: 'Authentication type selection is required',
            },
        },
        {
            id: 'lastUpdated',
            title: 'Last Updated',
            icon: '<svg className="w-4 h-4" fill="#3B82F6" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/></svg>',
            type: 'datetime',
            width: 140,
            resizable: true,
            order: 6,
            pinned: false,
            required: false,
            editable: false, // Read-only field
            dateConfig: {
                showCalendarIcon: false,
                showAddButton: false,
                format: 'YYYY-MM-DD HH:mm:ss',
                dateOnlyFormat: 'YYYY-MM-DD',
                readOnly: true,
            },
            validation: {
                required: false,
            },
        },
    ],

    // UI Configuration
    ui: {
        // Table appearance
        showTableTitle: true,
        enableDragAndDrop: true, // Enable drag and drop for row reordering
        enableColumnResize: true,
        enableColumnReorder: true,
        enableSearch: true,
        enableFilter: true,
        enableExport: true,
        showSaveButtons: false, // Disable manual save buttons for auto-save
        showAutoSaveIndicator: true, // Show auto-save status
        autoSaveIndicatorPosition: 'top-right',

        // Advanced UI Features
        enableAdvancedFeatures: true,
        showDragHandles: true,
        enableHoverControls: true,
        enableSortableHeaders: true,
        enableCompactMode: true,
        showModernIcons: true,
        enableMicroInteractions: true,
        modernTableStyling: true,

        // Horizontal scroll configuration
        enableHorizontalScroll: true,
        horizontalScrollMode: 'always', // 'auto', 'always', 'never'
        tableWidth: 'auto', // Let table expand based on content
        minTableWidth: '1200px', // Minimum width to trigger scroll
        maxTableWidth: 'none',

        // Row configuration
        defaultRowHeight: 40,
        compactMode: false,
        alternatingRowColors: false,
        headerHeight: 40,

        // Border configuration
        showCellBorders: true,
        showRowBorders: true,
        showColumnBorders: true,
        borderWidth: '1px',
        cellBorderStyle: 'solid',
        alwaysShowBorders: true,

        // Cell interaction configuration
        cellEditMode: 'none', // 'hover', 'click', 'doubleClick', 'none'
        enableHoverEdit: false,
        hoverEditDelay: 0,
        showEditIndicator: false,
        editIndicatorType: 'none',
        exitEditOnBlur: false,
        exitEditOnEnter: false,
        showEditHint: false,
        editHintText: '',

        // Colors and themes (ERP system design theme)
        theme: {
            primaryColor: '#0070f3',
            secondaryColor: '#f4f4f5',
            successColor: '#00c875',
            warningColor: '#fdab3d',
            errorColor: '#e2445c',
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
            cellBorderColor: '#e2e8f0',
            headerBorderColor: '#d1d5db',
            headerBackground: '#f8fafc',
            headerTextColor: '#1f2937',
            headerFontWeight: '700',
            headerFontSize: '12px',
            rowHoverColor: '#f0f8ff',
            selectedRowColor: '#dbeafe',

            // Placeholder styling
            placeholderColor: '#9ca3af',
            placeholderFontSize: '9px',
            placeholderOpacity: '0.6',
            placeholderFontWeight: '400',

            // Hover edit styling
            cellHoverEditBackground: '#f8fafc',
            cellHoverEditBorder: '#3b82f6',
            cellEditIndicatorColor: '#3b82f6',
            cellEditHintColor: '#6b7280',
        },

        // Animation settings
        animations: {
            enableRowAnimations: true,
            enableHoverAnimations: true,
            enableSlideAnimations: true,
            animationDuration: 300,
            slideDistance: '10px',
        },

        // Typography and styling
        typography: {
            // Header styling
            headerBold: true,
            headerFontWeight: 700,
            headerTextTransform: 'none',

            // Input and placeholder styling
            inputFontSize: '12px',
            placeholderGrayed: true,
            placeholderSmallText: true,
            applyCustomPlaceholderStyles: true,
        },

        // Custom CSS overrides
        customStyles: {
            forceHeaderBold: true,
            forcePlaceholderGray: true,
            applyImmediately: true,
        },

        // Icons configuration
        icons: {
            calendar: 'calendar',
            add: 'plus',
            key: 'key',
            users: 'users',
            cross: 'x',
            info: 'info-circle',
            check: 'check-circle',
            shield: 'shield-check',
        },
    },

    // Default values for new credentials
    defaults: {
        mainItem: {
            credentialName: '',
            description: '',
            entity: '',
            connector: '',
            authenticationType: 'API_KEY',
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            createdBy: 'current-user',
        },
    },

    // Initial data - will be populated when create button is clicked
    initialData: [],

    // Current user context (required by ReusableTableComponent)
    currentUser: {
        accountId: 3,
        enterpriseId: 1,
        userId: 'current-user',
        userName: 'Current User',
    },

    // Advanced table features configuration
    features: {
        // Tree table functionality
        treeTable: false,
        parentChildRelationship: false,

        // Drag and drop functionality
        dragAndDrop: false,
        dragToReorder: false,
        dragToNest: false,
        dragWithinGroups: false,

        // Hover controls and micro-interactions
        hoverControls: true,
        showHoverButtons: true,
        hoverButtonTypes: ['view', 'delete'],

        // Inline editing capabilities
        inlineEditing: false,
        doubleClickToEdit: false,
        instantEdit: false, // disabled for read-only mode

        // Row and UI features
        compactRows: false,
        modernMicroInteractions: true,
        animatedTransitions: true,
        contextMenus: false,
        showDragHandles: false,
        enableHoverEffects: true,
        showSortIndicators: true,

        // Sorting features
        sortableColumns: true,
        multiColumnSort: true,
        sortIndicators: true,
        clearSortOption: true,

        // Visual features
        zebraStriping: false,
        rowHoverEffect: true,
        selectionHighlight: true,
        focusIndicators: false,
        readOnlyMode: true,
        preventEditing: true,

        // Performance features
        virtualScrolling: false, // Enable for large datasets
        lazyLoading: false,
        optimizedRendering: true,
    },

    // UI Theme and styling
    theme: {
        // Color scheme - Professional palette
        primaryColor: '#1e40af',
        secondaryColor: '#475569',
        successColor: '#059669',
        warningColor: '#d97706',
        errorColor: '#dc2626',
        backgroundColor: '#ffffff',
        headerBackground: '#f8fafc',
        borderColor: '#e2e8f0',

        // Typography - Professional and readable
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '14px',
        fontWeight: '400',
        headerFontWeight: '600',

        // Spacing - Normal for readability
        rowHeight: 'normal', // 'compact', 'normal', 'comfortable'
        cellPadding: '12px 16px',
        headerPadding: '12px 16px',

        // Borders and visual elements - Clean and professional
        borderStyle: 'clean',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',

        // Advanced visual features - Professional appearance
        modernIcons: true,
        svgIcons: true,
        iconSize: '18px',
        glowEffects: false,
        gradients: false,
        hoverEffect: 'subtle',
        stripedRows: true,
        rowHoverColor: '#f1f5f9',
    },

    // Table actions configuration
    actions: {
        enableAdd: true,
        enableEdit: false,
        enableDelete: true,
        enableBulkActions: true,
        autoSave: false,
        autoSaveDelay: 0,

        // Hover edit configuration
        enableHoverEdit: false,
        hoverEditMode: 'none',
        editTrigger: 'none',
        inlineEditing: false,
        quickEdit: false,
        bulkActions: [
            {
                id: 'activate',
                label: 'Activate Selected',
                icon: 'check-circle',
                color: 'success',
            },
            {
                id: 'deactivate',
                label: 'Deactivate Selected',
                icon: 'x-circle',
                color: 'warning',
            },
            {
                id: 'delete',
                label: 'Delete Selected',
                icon: 'trash',
                color: 'error',
                confirmRequired: true,
            },
        ],
    },

    // API Configuration for auto-save
    api: {
        baseUrl: '/api/credentials',
        endpoints: {
            create: '/api/credentials',
            update: '/api/credentials/{id}',
            delete: '/api/credentials/{id}',
            bulkCreate: '/api/credentials/bulk',
            bulkUpdate: '/api/credentials/bulk',
            bulkDelete: '/api/credentials/bulk',
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
        filename: 'credential_manager_export',
        includeHeaders: true,
        excludeColumns: ['authenticationDetail'], // Don't export sensitive authentication details
    },
};

export default CredentialManager_tableConfig;
