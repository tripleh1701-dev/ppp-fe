/**
 * Manage Users Table Configuration
 *
 * Configuration for the user management table with comprehensive
 * field definitions, validations, and interactive features.
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
            width: 150,
            resizable: true,
            order: 1,
            pinned: false,
            required: true,
            maxLength: 50,
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
            width: 150,
            resizable: true,
            order: 2,
            pinned: false,
            required: false,
            maxLength: 50,
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
            width: 150,
            resizable: true,
            order: 3,
            pinned: false,
            required: true,
            maxLength: 50,
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
            type: 'select',
            width: 120,
            resizable: true,
            order: 5,
            pinned: false,
            required: true,
            options: ['ACTIVE', 'INACTIVE'],
            optionLabels: {
                ACTIVE: 'Active',
                INACTIVE: 'Inactive',
            },
            optionStyles: {
                ACTIVE: {
                    color: '#ffffff',
                    backgroundColor: '#22c55e',
                    borderColor: 'transparent',
                    borderRadius: '0px',
                },
                INACTIVE: {
                    color: '#ffffff',
                    backgroundColor: '#ef4444',
                    borderColor: 'transparent',
                    borderRadius: '0px',
                },
            },
            defaultValue: 'ACTIVE', // Default to Active
            placeholder: 'Select Status',
            selectConfig: {
                showIcons: false,
                showColors: true,
                modernStyle: true,
                dropdownAnimation: 'slideDown',
                animationDuration: 300,
                hoverEffect: true,
                searchable: false,
                clearable: false,
                badgeStyle: false,
                compactMode: true,
                fitCellSize: true,
                rectangularShape: true,
                inlineDisplay: true,
                fillCell: true,
                noBorder: true,
                noPadding: true,
                noRoundedCorners: true,
                dropdownStyle: 'simple',
                showSearchBar: false,
                enableSearch: false,
                containWithinCell: true,
                preventOverflow: true,
                autoResize: true,
                fullWidth: true,
                fullHeight: true,
            },
            ui: {
                displayStyle: 'fill-cell',
                borderRadius: '0px',
                padding: '0px',
                margin: '0px',
                border: 'none',
                fullWidth: true,
                fullHeight: true,
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
            width: 180,
            resizable: true,
            order: 6,
            pinned: false,
            required: true,
            defaultValue: () => new Date().toISOString().split('T')[0], // System date
            dateConfig: {
                showCalendarIcon: true,
                showAddButton: true,
                slideAnimation: true,
                slideDirection: 'right',
                animationDuration: 300,
                allowTime: true,
                timeTogglePosition: 'top-right',
                timeToggleText: 'Use Time',
                defaultToCurrentDate: true,
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
                showHoverHint: true,
                hoverHintText: 'Click to select date',
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
            width: 180,
            resizable: true,
            order: 7,
            pinned: false,
            required: false,
            placeholder: 'Select End Date',
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
                showHoverHint: true,
                hoverHintText: 'Click to select end date',
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
            width: 120,
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
            id: 'assignedUserGroup',
            title: 'Assigned User Group',
            type: 'userGroup',
            width: 200,
            resizable: true,
            order: 9,
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
            status: 'ACTIVE', // Default to Active status
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            password: '',
            assignedUserGroup: [{name: 'Administrators'}, {name: 'HR Team'}],
        },
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
        editTrigger: 'hover', // 'hover', 'click', 'doubleClick'
        inlineEditing: true,
        quickEdit: true,
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
        baseUrl: '/api/users',
        endpoints: {
            create: '/api/users',
            update: '/api/users/{id}',
            delete: '/api/users/{id}',
            bulkCreate: '/api/users/bulk',
            bulkUpdate: '/api/users/bulk',
            bulkDelete: '/api/users/bulk',
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
