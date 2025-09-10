/**
 * Advanced Table Configuration
 * Unified configuration for all tables across the application
 * Provides consistent UI, features, and behavior
 */

export const ADVANCED_TABLE_CONFIG = {
    // UI Configuration - Standardized across all tables
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

        // Horizontal scroll configuration
        enableHorizontalScroll: true,
        horizontalScrollMode: 'auto', // 'auto', 'always', 'never'
        tableWidth: 'auto', // Let table expand naturally
        minTableWidth: '100%',
        maxTableWidth: 'none',

        // Row configuration
        defaultRowHeight: 20,
        compactMode: true,
        alternatingRowColors: true,
        headerHeight: 25,

        // Border configuration
        showCellBorders: true,
        showRowBorders: true,
        showColumnBorders: true,
        borderWidth: '1px',
        cellBorderStyle: 'solid',
        alwaysShowBorders: true,

        // Cell interaction configuration
        cellEditMode: 'hover', // 'hover', 'click', 'doubleClick'
        enableHoverEdit: true,
        hoverEditDelay: 200, // milliseconds before showing input on hover
        showEditIndicator: true,
        editIndicatorType: 'border', // 'border', 'background', 'icon'
        exitEditOnBlur: true,
        exitEditOnEnter: true,
        showEditHint: true,
        editHintText: 'Hover to edit',

        // Tree table configuration
        enableTreeView: true,
        showTreeConnectors: true,
        treeIndentSize: 20, // pixels
        treeConnectorColor: '#e5e7eb',
        treeConnectorWidth: '1px',
        expandIconSize: 16,

        // Advanced sorting configuration
        enableAdvancedSort: true,
        sortMode: 'hover', // 'hover', 'click', 'both'
        showSortPills: true,
        sortPillPosition: 'header', // 'header', 'floating'
        multiColumnSort: true,
        sortStates: ['asc', 'desc', 'off'], // Cycle through these states

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

            // Blue line indicator
            rowIndicatorColor: '#3b82f6',
            rowIndicatorWidth: '3px',
            rowIndicatorPosition: 'left',

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

            // Tree styling
            treeConnectorColor: '#e5e7eb',
            treeExpandIconColor: '#6b7280',
            treeExpandIconHoverColor: '#374151',

            // Sort pill styling
            sortPillBackground: '#f3f4f6',
            sortPillBorder: '#d1d5db',
            sortPillTextColor: '#374151',
            sortPillActiveBackground: '#3b82f6',
            sortPillActiveTextColor: '#ffffff',
        },

        // Animation settings
        animations: {
            enableRowAnimations: true,
            enableHoverAnimations: true,
            enableSlideAnimations: true,
            enableTreeAnimations: true,
            enableSortAnimations: true,
            animationDuration: 300,
            slideDistance: '10px',
            expandDuration: 250,
            sortTransitionDuration: 150,
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

            // Tree typography
            treeNodeFontWeight: 600,
            childNodeFontWeight: 400,
        },

        // Custom CSS overrides
        customStyles: {
            forceHeaderBold: true,
            forcePlaceholderGray: true,
            applyImmediately: true,
            enableMicroInteractions: true,
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
            expand: 'chevron-right',
            collapse: 'chevron-down',
            sort: 'arrows-up-down',
            sortAsc: 'arrow-up',
            sortDesc: 'arrow-down',
            clear: 'x-mark',
            save: 'check',
        },
    },

    // Feature Configuration
    features: {
        // Selection
        enableSelection: true,
        enableSelectAll: true,
        selectionMode: 'multiple', // 'single', 'multiple'

        // Editing
        enableInlineEdit: true,
        editTrigger: 'doubleClick', // 'click', 'doubleClick', 'hover'
        autoSave: true,
        autoSaveDelay: 1000,

        // Tree features
        enableExpandCollapse: true,
        defaultExpanded: false,
        expandOnClick: true,
        showExpandButton: true,

        // Sorting and filtering
        enableGlobalSearch: true,
        enableColumnFilters: true,
        enableQuickFilters: true,

        // Export and import
        enableCSVExport: true,
        enableExcelExport: true,
        enablePDFExport: true,
        enableImport: true,

        // Performance
        virtualScrolling: true,
        lazyLoading: true,
        paginationSize: 50,
    },

    // API Configuration Template
    api: {
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

    // Validation Configuration Template
    validation: {
        validateOnChange: true,
        validateOnBlur: true,
        showValidationIcons: true,
        validationDelay: 500,
        highlightInvalidFields: true,
    },
};

// Column Types with default configurations
export const COLUMN_TYPES = {
    text: {
        type: 'text',
        width: 120,
        resizable: true,
        sortable: true,
        filterable: true,
        editable: true,
    },
    email: {
        type: 'email',
        width: 160,
        resizable: true,
        sortable: true,
        filterable: true,
        editable: true,
        validation: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            errorMessage: 'Valid email address is required',
        },
    },
    select: {
        type: 'select',
        width: 100,
        resizable: true,
        sortable: true,
        filterable: true,
        editable: true,
        options: [],
    },
    date: {
        type: 'datetime',
        width: 110,
        resizable: true,
        sortable: true,
        filterable: true,
        editable: true,
    },
    number: {
        type: 'number',
        width: 80,
        resizable: true,
        sortable: true,
        filterable: true,
        editable: true,
    },
    checkbox: {
        type: 'checkbox',
        width: 40,
        resizable: false,
        sortable: false,
        filterable: false,
        editable: false,
    },
    toggle: {
        type: 'toggle',
        width: 80,
        resizable: true,
        sortable: true,
        filterable: true,
        editable: true,
    },
    password: {
        type: 'password',
        width: 90,
        resizable: true,
        sortable: false,
        filterable: false,
        editable: true,
    },
    userGroup: {
        type: 'userGroup',
        width: 130,
        resizable: true,
        sortable: true,
        filterable: true,
        editable: true,
    },
};

// Default actions configuration
export const DEFAULT_ACTIONS = {
    create: {
        enabled: true,
        label: 'Add Item',
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
    expand: {
        enabled: true,
        label: 'Expand',
        icon: 'expand',
        color: 'secondary',
    },
    collapse: {
        enabled: true,
        label: 'Collapse',
        icon: 'collapse',
        color: 'secondary',
    },
};

export default ADVANCED_TABLE_CONFIG;
