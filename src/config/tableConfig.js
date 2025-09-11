/**
 * Reusable Table Configuration
 *
 * This is the main configuration file for the ReusableTableComponent.
 * Modify this file to customize your table structure, or create separate
 * config files for different pages and pass them as props.
 */

const tableConfig = {
    // Main table configuration
    tableName: 'Project Task Board',

    // Number of subitem tables per row (1-10 recommended)
    subitemTableCount: 3,

    // Main table columns configuration
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
            title: 'Task Name',
            type: 'text',
            width: 300,
            resizable: true,
            order: 1,
            pinned: false,
        },
        {
            id: 'account',
            title: 'Account',
            type: 'text',
            width: 150,
            resizable: true,
            order: 2,
            pinned: false,
        },
        {
            id: 'status',
            title: 'Status',
            type: 'select',
            width: 140,
            resizable: true,
            order: 3,
            pinned: false,
            options: ['Active', 'Inactive'],
        },
        {
            id: 'dueDate',
            title: 'Due Date',
            type: 'date',
            width: 130,
            resizable: true,
            order: 4,
            pinned: false,
        },
    ],

    // Subitem tables configuration
    subitemTables: {
        // Subitem Table 1 Configuration
        table1: {
            title: 'Development Tasks',
            columns: [
                {
                    id: 'name',
                    title: 'Task Name',
                    type: 'text',
                    width: 250,
                    required: true,
                },
                {
                    id: 'assignee',
                    title: 'Developer',
                    type: 'text',
                    width: 150,
                    required: false,
                },
                {
                    id: 'priority',
                    title: 'Priority',
                    type: 'select',
                    width: 120,
                    required: false,
                    options: ['Low', 'Medium', 'High', 'Critical'],
                },
                {
                    id: 'status',
                    title: 'Status',
                    type: 'select',
                    width: 140,
                    required: false,
                    options: [
                        'To Do',
                        'In Progress',
                        'Code Review',
                        'Testing',
                        'Done',
                    ],
                },
                {
                    id: 'dueDate',
                    title: 'Due Date',
                    type: 'date',
                    width: 130,
                    required: false,
                },
                {
                    id: 'effort',
                    title: 'Effort (hrs)',
                    type: 'number',
                    width: 100,
                    required: false,
                    min: 0,
                    max: 1000,
                },
            ],
        },

        // Subitem Table 2 Configuration
        table2: {
            title: 'Testing & QA Tasks',
            columns: [
                {
                    id: 'name',
                    title: 'Test Case',
                    type: 'text',
                    width: 250,
                    required: true,
                },
                {
                    id: 'tester',
                    title: 'Tester',
                    type: 'text',
                    width: 150,
                    required: false,
                },
                {
                    id: 'testType',
                    title: 'Test Type',
                    type: 'select',
                    width: 140,
                    required: false,
                    options: [
                        'Unit Test',
                        'Integration Test',
                        'E2E Test',
                        'Manual Test',
                        'Performance Test',
                    ],
                },
                {
                    id: 'status',
                    title: 'Status',
                    type: 'select',
                    width: 120,
                    required: false,
                    options: [
                        'Not Started',
                        'In Progress',
                        'Passed',
                        'Failed',
                        'Blocked',
                    ],
                },
                {
                    id: 'severity',
                    title: 'Severity',
                    type: 'select',
                    width: 100,
                    required: false,
                    options: ['Low', 'Medium', 'High', 'Critical'],
                },
                {
                    id: 'dueDate',
                    title: 'Due Date',
                    type: 'date',
                    width: 130,
                    required: false,
                },
            ],
        },

        // Subitem Table 3 Configuration (example for more tables)
        table3: {
            title: 'Documentation Tasks',
            columns: [
                {
                    id: 'name',
                    title: 'Document Name',
                    type: 'text',
                    width: 250,
                    required: true,
                },
                {
                    id: 'author',
                    title: 'Author',
                    type: 'text',
                    width: 150,
                    required: false,
                },
                {
                    id: 'docType',
                    title: 'Document Type',
                    type: 'select',
                    width: 140,
                    required: false,
                    options: [
                        'Technical Spec',
                        'User Guide',
                        'API Docs',
                        'README',
                        'Release Notes',
                    ],
                },
                {
                    id: 'status',
                    title: 'Status',
                    type: 'select',
                    width: 120,
                    required: false,
                    options: ['Draft', 'Review', 'Approved', 'Published'],
                },
                {
                    id: 'dueDate',
                    title: 'Due Date',
                    type: 'date',
                    width: 130,
                    required: false,
                },
            ],
        },
    },

    // UI Configuration
    ui: {
        // Table appearance
        showTableTitle: true,
        enableDragAndDrop: true,
        enableColumnResize: true,
        enableColumnReorder: true,

        // Row configuration
        defaultRowHeight: 50,
        compactMode: false,

        // Colors and themes
        theme: {
            primaryColor: '#4ba3ff',
            successColor: '#00c875',
            warningColor: '#fdab3d',
            errorColor: '#e2445c',
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
        },

        // Animation settings
        animations: {
            enableConnectorAnimations: true,
            enableRowAnimations: true,
            animationDuration: 300,
        },
    },

    // Default values for new items
    defaults: {
        mainItem: {
            name: '',
            account: 'Unassigned',
            status: 'Active',
            statusColor: '#FDAB3D',
            dueDate: '',
            overdue: false,
        },

        // Default values for subitems (will be applied to all subitem tables)
        subitem: {
            name: '',
            assignee: 'Unassigned',
            priority: 'Medium',
            status: 'To Do',
            dueDate: '',
            effort: 0,
        },
    },
};

export default tableConfig;
