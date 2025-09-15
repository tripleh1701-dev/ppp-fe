// Enterprise Configuration Table Configuration
// Using the reusable table component system

const enterpriseConfigurationTableConfig = {
    tableName: 'Enterprise Configuration',
    subitemTableCount: 0, // No subitem tables needed

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
            id: 'enterprise',
            title: 'Enterprise',
            type: 'select',
            width: 200,
            resizable: true,
            order: 1,
            pinned: false,
            editable: true,
            options: ['SAP', 'Enterprise A', 'Enterprise B', 'Enterprise C'], // Test options with API data
            apiEndpoint: '/api/enterprises',
            multiple: false,
            showAsChips: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        },
        {
            id: 'product',
            title: 'Product',
            type: 'select',
            width: 200,
            resizable: true,
            order: 2,
            pinned: false,
            editable: true,
            options: ['Core Platform', 'Product X', 'Product Y', 'Product Z'], // Test options with API data
            apiEndpoint: '/api/products',
            multiple: false,
            showAsChips: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        },
        {
            id: 'service',
            title: 'Service',
            type: 'select',
            width: 250,
            resizable: true,
            order: 3,
            pinned: false,
            editable: true,
            options: [
                'User Management Service',
                'Service Alpha',
                'Service Beta',
                'Service Gamma',
            ], // Test options with API data
            apiEndpoint: '/api/services',
            multiple: false,
            showAsChips: true,
            icon: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ba3ff" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        },
    ],

    // Subitem tables configuration (empty for this table)
    subitemTables: {},

    // Default UI configuration
    dragAndDropEnabled: true,
    bulkDeleteEnabled: true,
    searchEnabled: true,
    exportEnabled: true,
    columnCustomizationEnabled: true,
    sortingEnabled: true,
    filteringEnabled: true,
    paginationEnabled: false, // Keep all rows visible
    rowExpansionEnabled: false, // No subitems to expand
    addNewRowEnabled: true,

    // Default column reordering and visibility
    columnOrder: ['checkbox', 'enterprise', 'product', 'service'],
    visibleColumns: ['checkbox', 'enterprise', 'product', 'service'],

    // Table-specific properties
    selectedSort: null,
    selectedFilter: null,
    itemsPerPage: 50,
    currentPage: 1,

    // Default initial data structure
    initialData: [
        {
            id: '1',
            enterprise: '',
            product: '',
            service: [],
        },
    ],

    // Advanced features configuration
    enableColumnResize: true,
    enableCellEdit: true,
    enableRowSelection: true,
    enableKeyboardNavigation: true,
    enableTooltips: true,
    enableCompactMode: false,
    enableBorderlessMode: false,
    enableZebraStriping: true,
    enableHoverEffects: true,
    enableStickyHeader: true,
    enableVirtualScrolling: false,

    // Validation rules
    validation: {
        enterprise: {
            required: true,
            errorMessage: 'Enterprise selection is required',
        },
        product: {
            required: true,
            errorMessage: 'Product selection is required',
        },
        service: {
            required: true,
            errorMessage: 'At least one service must be selected',
        },
    },

    // Custom renderers for special functionality
    customRenderers: {},

    // Default values for new items
    defaults: {
        mainItem: {
            enterprise: '',
            product: '',
            service: '', // Single select
        },
        subitem: {
            // No subitems for this configuration
        },
    },

    // Dropdown configurations for API-based options
    dropdownConfigs: {
        enterprise: {
            apiEndpoint: '/api/enterprises',
            valueField: 'id',
            labelField: 'name',
            multiple: false,
        },
        product: {
            apiEndpoint: '/api/products',
            valueField: 'id',
            labelField: 'name',
            multiple: false,
        },
        service: {
            apiEndpoint: '/api/services',
            valueField: 'id',
            labelField: 'name',
            multiple: true,
        },
    },

    // Auto-save configuration
    autoSave: {
        enabled: true,
        debounceMs: 1000,
        endpoint: '/api/enterprise-configuration',
        onFieldChange: async (recordId, field, value) => {
            try {
                console.log(
                    `💾 Auto-saving field ${field} for record ${recordId}:`,
                    value,
                );
                // Import the save function dynamically to avoid circular imports
                const {saveEnterpriseConfigurationField} = await import(
                    '../utils/api'
                );
                await saveEnterpriseConfigurationField(recordId, field, value);
                console.log(`✅ Successfully saved ${field} = ${value}`);
                return {success: true};
            } catch (error) {
                console.error(`❌ Failed to save ${field}:`, error);
                return {success: false, error: error.message};
            }
        },
        onCreate: async (data) => {
            try {
                console.log('💾 Auto-saving new record:', data);
                const {createEnterpriseConfigurationRecord} = await import(
                    '../utils/api'
                );
                const result = await createEnterpriseConfigurationRecord(data);
                console.log('✅ Successfully created record:', result);
                return {success: true, data: result};
            } catch (error) {
                console.error('❌ Failed to create record:', error);
                return {success: false, error: error.message};
            }
        },
        onDelete: async (recordId) => {
            try {
                console.log('💾 Auto-deleting record:', recordId);
                const {deleteEnterpriseConfigurationRecord} = await import(
                    '../utils/api'
                );
                await deleteEnterpriseConfigurationRecord(recordId);
                console.log('✅ Successfully deleted record:', recordId);
                return {success: true};
            } catch (error) {
                console.error('❌ Failed to delete record:', error);
                return {success: false, error: error.message};
            }
        },
    },

    // Export configuration
    exportConfig: {
        filename: 'enterprise-configuration',
        formats: ['csv', 'xlsx', 'json'],
        includeHeaders: true,
        dateFormat: 'YYYY-MM-DD',
    },

    // Accessibility configuration
    accessibility: {
        ariaLabel: 'Enterprise Configuration Table',
        describedBy: 'enterprise-config-description',
        rowHeaderColumn: 'enterprise',
    },

    // Theme and styling
    theme: {
        primaryColor: '#4ba3ff',
        secondaryColor: '#f8fafc',
        borderColor: '#e2e8f0',
        headerBackground: '#f8fafc',
        evenRowBackground: '#fdfdfd',
        oddRowBackground: '#ffffff',
        hoverBackground: '#f1f5f9',
        selectedBackground: '#e3f2fd',
    },

    // Performance configuration
    performance: {
        virtualScrolling: false,
        lazyLoading: false,
        debounceSearch: 300,
        memoizeRows: true,
        optimizeRedraws: true,
    },
};

export default enterpriseConfigurationTableConfig;
