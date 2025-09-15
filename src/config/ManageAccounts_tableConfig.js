/**
 * Manage Accounts Table Configuration
 *
 * Configuration for the Manage Accounts page using the ReusableTableComponent.
 * This includes the main accounts table with two subitem tables:
 * 1. Technical Users
 * 2. License Details
 */

const manageAccountsTableConfig = {
    // Main table configuration
    tableName: 'Manage Accounts',

    // Number of subitem tables per row (2 for technical users and license details)
    subitemTableCount: 2,

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
            title: 'Master Account',
            type: 'text',
            width: 110,
            resizable: true,
            order: 1,
            pinned: false,
            editable: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        },
        {
            id: 'account',
            title: 'Account',
            type: 'text',
            width: 90,
            resizable: true,
            order: 2,
            pinned: false,
            editable: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        },
        {
            id: 'country',
            title: 'Country',
            type: 'text',
            width: 80,
            resizable: true,
            order: 3,
            pinned: false,
            editable: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
        },
        {
            id: 'addressLine1',
            title: 'Address Line 1',
            type: 'text',
            width: 100,
            resizable: true,
            order: 4,
            pinned: false,
            editable: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>',
        },
        {
            id: 'addressLine2',
            title: 'Address Line 2',
            type: 'text',
            width: 100,
            resizable: true,
            order: 5,
            pinned: false,
            editable: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>',
        },
        {
            id: 'city',
            title: 'City',
            type: 'text',
            width: 80,
            resizable: true,
            order: 6,
            pinned: false,
            editable: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>',
        },
        {
            id: 'state',
            title: 'State',
            type: 'text',
            width: 70,
            resizable: true,
            order: 7,
            pinned: false,
            editable: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><polygon points="3,11 22,2 13,21 11,13 3,11"/></svg>',
        },
        {
            id: 'pinZip',
            title: 'Pin/Zip',
            type: 'text',
            width: 70,
            resizable: true,
            order: 8,
            pinned: false,
            editable: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
        },
    ],

    // Subitem tables configuration
    subitemTables: {
        // Subitem Table 1: Technical Users
        table1: {
            title: 'Technical Details',
            columns: [
                {
                    id: 'name',
                    title: 'First Name',
                    type: 'text',
                    width: 80,
                    required: true,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                },
                {
                    id: 'middleName',
                    title: 'Middle Name',
                    type: 'text',
                    width: 80,
                    required: false,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                },
                {
                    id: 'lastName',
                    title: 'Last Name',
                    type: 'text',
                    width: 80,
                    required: true,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                },
                {
                    id: 'email',
                    title: 'Email Address',
                    type: 'text',
                    width: 120,
                    required: true,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
                },
                {
                    id: 'status',
                    title: 'Status',
                    type: 'select',
                    width: 70,
                    required: false,
                    options: ['Active', 'Inactive', 'Pending', 'Suspended'],
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>',
                },
                {
                    id: 'startDate',
                    title: 'Start Date',
                    type: 'date',
                    width: 90,
                    required: false,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                },
                {
                    id: 'endDate',
                    title: 'End Date',
                    type: 'date',
                    width: 90,
                    required: false,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                },
                {
                    id: 'password',
                    title: 'Password',
                    type: 'text',
                    width: 70,
                    required: false,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
                },
                {
                    id: 'technicalUser',
                    title: 'Technical User',
                    type: 'select',
                    width: 90,
                    required: false,
                    options: ['Yes', 'No'],
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3m18 0c0-1.66-4-3-9-3s-9 1.34-9 3m18 0v6c0 1.66-4 3-9 3s-9-1.34-9-3v-6"/></svg>',
                },
            ],
        },

        // Subitem Table 2: License Details
        table2: {
            title: 'License Details',
            columns: [
                {
                    id: 'name',
                    title: 'Product',
                    type: 'text',
                    width: 90,
                    required: true,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
                },
                {
                    id: 'service',
                    title: 'Service',
                    type: 'text',
                    width: 80,
                    required: false,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
                },
                {
                    id: 'licenseStartDate',
                    title: 'License Start Date',
                    type: 'date',
                    width: 110,
                    required: false,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                },
                {
                    id: 'licenseEndDate',
                    title: 'License End Date',
                    type: 'date',
                    width: 110,
                    required: false,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                },
                {
                    id: 'numberOfUsers',
                    title: 'Number of Users',
                    type: 'number',
                    width: 90,
                    required: false,
                    min: 1,
                    max: 10000,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
                },
                {
                    id: 'renewalNotice',
                    title: 'Renewal Notice',
                    type: 'select',
                    width: 90,
                    required: false,
                    options: ['30 Days', '60 Days', '90 Days', 'Custom'],
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
                },
                {
                    id: 'contactDetails',
                    title: 'Contact Details',
                    type: 'text',
                    width: 110,
                    required: false,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
                },
                {
                    id: 'noticePeriod',
                    title: 'Notice Period (Days)',
                    type: 'number',
                    width: 100,
                    required: false,
                    min: 1,
                    max: 365,
                    editable: true,
                    icon: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
                },
            ],
        },
    },

    // Features configuration
    features: {
        // Table Capabilities
        search: true,
        filter: true,
        sort: true,
        groupBy: true,
        export: true,
        import: false,
        bulk: true,
        pagination: true,

        // CRUD Operations
        create: true,
        read: true,
        update: true,
        delete: true,

        // Advanced Features
        columnReorder: true,
        columnResize: true,
        columnVisibility: true,
        rowSelection: true,
        rowExpansion: true, // Enable row expansion for subitem tables
        inlineEdit: true,
        bulkEdit: true,
        customActions: true,
        templates: false,
        validation: true,
        autoSave: true,
        newRowEditing: true,
        versionHistory: false,
        comments: false,
        attachments: false,
        workflow: false,
        permissions: true,
        audit: true,
        notifications: true,
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

        // Colors and themes - aligned with theme preference [[memory:5563855]]
        theme: {
            primaryColor: '#0d5eaf',
            successColor: '#00a651',
            warningColor: '#f57c00',
            errorColor: '#d32f2f',
            backgroundColor: '#ffffff',
            borderColor: '#e0e0e0',
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
            account: '',
            country: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pinZip: '',
        },

        // Default values for subitems
        subitem: {
            // Technical Users defaults
            name: '',
            middleName: '',
            lastName: '',
            email: '',
            status: 'Active',
            startDate: '',
            endDate: '',
            password: '',
            technicalUser: 'No',

            // License Details defaults
            service: '',
            licenseStartDate: '',
            licenseEndDate: '',
            numberOfUsers: 1,
            renewalNotice: '30 Days',
            contactDetails: '',
            noticePeriod: 30,
        },
    },

    // Sample initial data for development/testing
    initialData: [
        {
            id: 'account-1',
            name: 'Global Corp Enterprise',
            account: 'GCE-001',
            country: 'United States',
            addressLine1: '123 Business Avenue',
            addressLine2: 'Suite 100',
            city: 'New York',
            state: 'NY',
            pinZip: '10001',
            subitems1: [
                {
                    id: 'tech-user-1',
                    name: 'John',
                    middleName: 'Michael',
                    lastName: 'Smith',
                    email: 'john.smith@globalcorp.com',
                    status: 'Active',
                    startDate: '2024-01-15',
                    endDate: '',
                    password: '••••••••',
                    technicalUser: 'Yes',
                },
                {
                    id: 'tech-user-2',
                    name: 'Sarah',
                    middleName: '',
                    lastName: 'Johnson',
                    email: 'sarah.johnson@globalcorp.com',
                    status: 'Active',
                    startDate: '2024-02-01',
                    endDate: '',
                    password: '••••••••',
                    technicalUser: 'No',
                },
            ],
            subitems2: [
                {
                    id: 'license-1',
                    name: 'Enterprise Cloud Platform',
                    service: 'Cloud Infrastructure',
                    licenseStartDate: '2024-01-01',
                    licenseEndDate: '2024-12-31',
                    numberOfUsers: 500,
                    renewalNotice: '60 Days',
                    contactDetails: 'licenses@globalcorp.com',
                    noticePeriod: 60,
                },
                {
                    id: 'license-2',
                    name: 'Business Intelligence Suite',
                    service: 'Analytics Platform',
                    licenseStartDate: '2024-03-01',
                    licenseEndDate: '2025-02-28',
                    numberOfUsers: 150,
                    renewalNotice: '90 Days',
                    contactDetails: 'bi-admin@globalcorp.com',
                    noticePeriod: 90,
                },
            ],
        },
        {
            id: 'account-2',
            name: 'Tech Innovations Ltd',
            account: 'TIL-002',
            country: 'Germany',
            addressLine1: 'Technologie Strasse 45',
            addressLine2: '',
            city: 'Munich',
            state: 'Bavaria',
            pinZip: '80339',
            subitems1: [
                {
                    id: 'tech-user-3',
                    name: 'Hans',
                    middleName: '',
                    lastName: 'Mueller',
                    email: 'hans.mueller@techinnovations.de',
                    status: 'Active',
                    startDate: '2024-01-10',
                    endDate: '',
                    password: '••••••••',
                    technicalUser: 'Yes',
                },
            ],
            subitems2: [
                {
                    id: 'license-3',
                    name: 'Development Tools Suite',
                    service: 'Development Platform',
                    licenseStartDate: '2024-01-01',
                    licenseEndDate: '2024-12-31',
                    numberOfUsers: 25,
                    renewalNotice: '30 Days',
                    contactDetails: 'admin@techinnovations.de',
                    noticePeriod: 30,
                },
            ],
        },
        {
            id: 'account-3',
            name: 'Financial Services Group',
            account: 'FSG-003',
            country: 'United Kingdom',
            addressLine1: '10 Financial District',
            addressLine2: 'Floor 25',
            city: 'London',
            state: 'England',
            pinZip: 'EC2V 8RF',
            subitems1: [],
            subitems2: [
                {
                    id: 'license-4',
                    name: 'Security & Compliance Suite',
                    service: 'Security Platform',
                    licenseStartDate: '2024-02-01',
                    licenseEndDate: '2025-01-31',
                    numberOfUsers: 200,
                    renewalNotice: '90 Days',
                    contactDetails: 'security@fingroup.co.uk',
                    noticePeriod: 90,
                },
            ],
        },
    ],

    // Optional: Custom action handlers
    onAction: {
        onItemAdd: (item) => {
            console.log('New account added:', item);
        },
        onItemUpdate: (item) => {
            console.log('Account updated:', item);
        },
        onItemDelete: (itemId) => {
            console.log('Account deleted:', itemId);
        },
        onSubitemAdd: (parentId, subitem, tableType) => {
            console.log(
                'New subitem added to',
                parentId,
                ':',
                subitem,
                'in table:',
                tableType,
            );
        },
        onSubitemUpdate: (parentId, subitem, tableType) => {
            console.log(
                'Subitem updated in',
                parentId,
                ':',
                subitem,
                'in table:',
                tableType,
            );
        },
        onSubitemDelete: (parentId, subitemId, tableType) => {
            console.log(
                'Subitem deleted from',
                parentId,
                ':',
                subitemId,
                'in table:',
                tableType,
            );
        },
    },

    // Loading state
    loading: false,

    // Search and filtering (for future enhancements)
    searchTerm: '',
    groupBy: null,

    // Custom header renderer (optional)
    customHeaderRenderer: null,

    // Custom column renderers (optional)
    customRenderers: {
        // Add any custom cell renderers if needed
    },

    // API Configuration for auto-save
    api: {
        baseUrl: 'http://localhost:4000/api/accounts',
        endpoints: {
            create: 'http://localhost:4000/api/accounts',
            update: 'http://localhost:4000/api/accounts/{id}',
            delete: 'http://localhost:4000/api/accounts/{id}',
            bulkCreate: 'http://localhost:4000/api/accounts/bulk',
            bulkUpdate: 'http://localhost:4000/api/accounts/bulk',
            bulkDelete: 'http://localhost:4000/api/accounts/bulk',
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

    // Additional table features for editing
    actions: {
        enableAdd: true,
        enableEdit: true,
        enableDelete: true,
        enableBulkActions: true,
        autoSave: true,
        autoSaveDelay: 1000,

        // Hover edit configuration
        enableHoverEdit: true,
        hoverEditMode: 'immediate',
        editTrigger: 'hover',
        inlineEditing: true,
        quickEdit: true,
    },
};

export default manageAccountsTableConfig;
