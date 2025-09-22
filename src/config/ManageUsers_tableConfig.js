/**
 * Manage Users Table Configuration
 *
 * Configuration for the user management table with comprehensive
 * field definitions, validations, and interActive features.
 */

const ManageUsers_tableConfig = {
    // Main table configuration
    tableName: 'Manage Users',

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
            id: 'firstName',
            title: 'First Name',
            type: 'text',
            width: 140,
            resizable: true,
            order: 1,
            pinned: false,
            required: true,
            maxLength: 50,
            editable: true,
            validation: {
                required: true,
                maxLength: 50,
                pattern: /^[a-zA-Z\s]+$/,
                errorMessage:
                    'First name is required and must be alphabetic characters only (max 50 characters)',
            },
        },
        {
            id: 'middleName',
            title: 'Middle Name',
            type: 'text',
            width: 130,
            resizable: true,
            order: 2,
            pinned: false,
            required: false,
            maxLength: 50,
            editable: true,
            validation: {
                required: false,
                maxLength: 50,
                pattern: /^[a-zA-Z\s]*$/,
                errorMessage:
                    'Middle name must be alphabetic characters only (max 50 characters)',
            },
        },
        {
            id: 'lastName',
            title: 'Last Name',
            type: 'text',
            width: 140,
            resizable: true,
            order: 3,
            pinned: false,
            required: true,
            maxLength: 50,
            editable: true,
            validation: {
                required: true,
                maxLength: 50,
                pattern: /^[a-zA-Z\s]+$/,
                errorMessage:
                    'Last name is required and must be alphabetic characters only (max 50 characters)',
            },
        },
        {
            id: 'emailAddress',
            title: 'Email Address',
            type: 'email',
            width: 200,
            resizable: true,
            order: 4,
            pinned: false,
            required: true,
            primaryKey: true,
            editable: true,
            validation: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                errorMessage:
                    'Valid email address is required (serves as primary key)',
            },
        },
        {
            id: 'status',
            title: 'Status',
            type: 'toggle',
            width: 100,
            resizable: true,
            order: 5,
            pinned: false,
            required: true,
            defaultValue: '', // No default value
            toggleConfig: {
                ActiveValue: 'Active',
                InactiveValue: 'Inactive',
                ActiveLabel: 'Active',
                InactiveLabel: 'Inactive',
                ActiveColor: '#10b981', // Modern emerald green for Active
                InactiveColor: '#f97316', // Modern orange for Inactive
                textColor: '#ffffff', // White text
                borderRadius: '3px',
                fillCell: true,
                fullWidth: true,
                fullHeight: true,
                compactMode: true,
                clickableArea: 'full', // Entire cell is clickable
                animationDuration: 200,
                hoverEffect: true,
                showLabel: true,
                fontWeight: '600',
                fontSize: '10px',
            },
            ui: {
                displayStyle: 'fill-cell',
                borderRadius: '4px',
                padding: '0px',
                margin: '0px',
                border: 'none',
                fullWidth: true,
                fullHeight: true,
                overflow: 'hidden',
            },
            validation: {
                required: true,
                errorMessage: 'Status selection is required',
            },
        },
        {
            id: 'startDate',
            title: 'Start Date',
            type: 'datetime',
            width: 140,
            resizable: true,
            order: 6,
            pinned: false,
            required: true,
            defaultValue: '', // No default date
            dateConfig: {
                showCalendarIcon: true,
                showAddButton: true,
                slideAnimation: true,
                slideDirection: 'right',
                animationDuration: 300,
                allowTime: true,
                timeTogglePosition: 'top-right',
                timeToggleText: 'Use Time',
                defaultToCurrentDate: false,
                allowFutureDate: true,
                allowPastDate: false,
                format: 'YYYY-MM-DD HH:mm:ss',
                dateOnlyFormat: 'YYYY-MM-DD',
                calendarPosition: 'below',
                hoverTrigger: true,
                clickToOpen: true,
                autoClose: true,
                highlightToday: true,
                showWeekNumbers: false,
                firstDayOfWeek: 1, // Monday
            },
            ui: {
                hoverEffect: 'slide-icons',
                iconStyle: 'modern',
                buttonStyle: 'rounded',
                calendarTheme: 'light',
                showHoverHint: false,
            },
            validation: {
                required: true,
                minDate: new Date().toISOString().split('T')[0], // Today's date
                errorMessage:
                    'Start date is required and cannot be in the past',
            },
        },
        {
            id: 'endDate',
            title: 'End Date',
            type: 'datetime',
            width: 140,
            resizable: true,
            order: 7,
            pinned: false,
            required: false,
            dateConfig: {
                showCalendarIcon: true,
                showAddButton: true,
                slideAnimation: true,
                slideDirection: 'right',
                animationDuration: 300,
                allowTime: true,
                timeTogglePosition: 'top-right',
                timeToggleText: 'Use Time',
                defaultToCurrentDate: false,
                allowFutureDate: true,
                allowPastDate: false,
                format: 'YYYY-MM-DD HH:mm:ss',
                dateOnlyFormat: 'YYYY-MM-DD',
                calendarPosition: 'below',
                hoverTrigger: true,
                clickToOpen: true,
                autoClose: true,
                highlightToday: true,
                showWeekNumbers: false,
                firstDayOfWeek: 1, // Monday
            },
            ui: {
                hoverEffect: 'slide-icons',
                iconStyle: 'modern',
                buttonStyle: 'rounded',
                calendarTheme: 'light',
                showHoverHint: false,
            },
            validation: {
                required: false,
                minDate: new Date().toISOString().split('T')[0], // Today's date
                errorMessage: 'End date cannot be in the past',
            },
        },
        {
            id: 'password',
            title: 'Password',
            type: 'password',
            width: 110,
            resizable: true,
            order: 8,
            pinned: false,
            required: true,
            passwordConfig: {
                showKeyIcon: true,
                iconAnimation: 'pulse',
                modalPosition: 'below',
                modalTitle: 'Enter New Password',
                showValidationInfo: true,
                validationRules: [
                    {
                        rule: 'minLength',
                        value: 8,
                        message: 'Password must be at least 8 characters',
                        icon: 'length',
                    },
                    {
                        rule: 'hasNumber',
                        message: 'Must contain at least 1 number',
                        icon: 'number',
                    },
                    {
                        rule: 'hasUppercase',
                        message: 'Must contain at least 1 capital character',
                        icon: 'uppercase',
                    },
                    {
                        rule: 'hasLowercase',
                        message: 'Must contain at least 1 small case',
                        icon: 'lowercase',
                    },
                    {
                        rule: 'hasSpecialChar',
                        message: 'Must contain at least 1 special character',
                        icon: 'special',
                    },
                ],
                confirmPassword: true,
                updateButtonText: 'Update Password',
                successIconColor: '#00c875',
                pendingIconColor: '#fdab3d',
                setIconColor: '#4ba3ff',
            },
            validation: {
                required: true,
                minLength: 8,
                pattern:
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                errorMessage: 'Password must meet all security requirements',
            },
        },
        {
            id: 'technicalUser',
            title: 'Technical User',
            type: 'checkbox',
            width: 80,
            resizable: true,
            order: 9,
            pinned: false,
            required: false,
            defaultValue: false, // Default to unchecked
            checkboxConfig: {
                checkedText: 'Technical',
                uncheckedText: 'Regular',
                checkedColor: '#3b82f6', // Blue for technical user
                uncheckedColor: '#6b7280', // Gray for regular user
                showLabel: true,
                labelPosition: 'right',
                size: 'medium',
                style: 'modern',
                hoverEffect: true,
                animationDuration: 200,
                showTooltip: true,
                tooltipText: {
                    checked: 'This is a technical/system user account',
                    unchecked: 'This is a regular user account',
                },
                fillCell: false,
                centerAlign: true,
            },
            ui: {
                displayStyle: 'checkbox',
                alignment: 'center',
                padding: '4px',
                margin: '0px',
                borderRadius: '4px',
                fullWidth: false,
                fullHeight: false,
                showBorder: false,
            },
            validation: {
                required: false,
                errorMessage: 'Technical user flag is invalid',
            },
        },
        {
            id: 'assignedUserGroups',
            title: 'Assigned User Groups',
            type: 'userGroup',
            width: 160,
            resizable: true,
            order: 10,
            pinned: false,
            required: false,
            userGroupConfig: {
                showGroupIcon: true,
                showAddButton: true,
                slideAnimation: true,
                groupIcon: 'users', // 3 persons together icon
                hoverInfo: true,
                showGroupNames: true,
                allowRemove: true,
                removeIcon: 'cross',
                maxGroups: 10,
                searchable: true,
                multiSelect: true,
                customHoverTooltip: true, // Enable custom tooltip functionality
            },
            validation: {
                required: false,
                errorMessage: 'Invalid user group selection',
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
        horizontalScrollMode: 'auto', // 'auto', 'always', 'never'
        tableWidth: 'auto', // Let table expand naturally
        minTableWidth: '100%',
        maxTableWidth: 'none',

        // Row configuration
        defaultRowHeight: 36,
        compactMode: true,
        alternatingRowColors: true,
        headerHeight: 38,

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
        },
    },

    // Default values for new users
    defaults: {
        mainItem: {
            firstName: '',
            middleName: '',
            lastName: '',
            emailAddress: '',
            status: 'Active', // Default to Active status
            locked: false, // Default to unlocked
            startDate: new Date().toISOString().split('T')[0], // Default to today
            endDate: '',
            password: '',
            technicalUser: false, // Default to regular user
            assignedUserGroups: [],
        },
    },

    // Initial data - will be populated when create button is clicked
    initialData: [],

    // Advanced table features configuration
    features: {
        // Tree table functionality
        treeTable: false, // Set to true if hierarchical data needed
        parentChildRelationship: false,

        // Drag and drop functionality
        dragAndDrop: false,
        dragToReorder: false,
        dragToNest: false, // Set to true for tree nesting
        dragWithinGroups: false,

        // Hover controls and micro-interactions
        hoverControls: true,
        showHoverButtons: true,
        hoverButtonTypes: ['view', 'delete'],

        // Inline editing capabilities
        inlineEditing: true,
        doubleClickToEdit: true,
        instantEdit: true, // true for immediate edit mode

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
        zebraStriping: true,
        rowHoverEffect: true,
        selectionHighlight: true,
        focusIndicators: true,
        readOnlyMode: false,
        preventEditing: false,

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

        // Spacing - More generous for readability
        rowHeight: 'comfortable', // 'compact', 'normal', 'comfortable'
        cellPadding: '16px 20px',
        headerPadding: '16px 20px',

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
        enableEdit: true,
        enableDelete: true,
        enableBulkActions: true,
        autoSave: true,
        autoSaveDelay: 1000, // Auto-save after 1 second of inactivity

        // Hover edit configuration
        enableHoverEdit: true,
        hoverEditMode: 'immediate', // 'immediate', 'delayed'
        editTrigger: 'click', // 'hover', 'click', 'doubleClick'
        inlineEditing: true,
        quickEdit: true,
        bulkActions: [
            {
                id: 'activate',
                label: 'Activate Selected ',
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
        baseUrl: 'http://localhost:4000/api/users',
        endpoints: {
            create: 'http://localhost:4000/api/users',
            update: 'http://localhost:4000/api/users/{id}',
            delete: 'http://localhost:4000/api/users/{id}',
            bulkCreate: 'http://localhost:4000/api/users/bulk',
            bulkUpdate: 'http://localhost:4000/api/users/bulk',
            bulkDelete: 'http://localhost:4000/api/users/bulk',
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
        filename: 'manage_users_export',
        includeHeaders: true,
        excludeColumns: ['password'], // Don't export password column
    },
};

export default ManageUsers_tableConfig;
