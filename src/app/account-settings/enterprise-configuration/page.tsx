'use client';

import {useState, useEffect, useRef} from 'react';
import {motion} from 'framer-motion';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    EyeSlashIcon,
    RectangleStackIcon,
} from '@heroicons/react/24/outline';
import {api} from '@/utils/api';
import EnterpriseAccountsTable, {
    AccountRow,
} from '@/components/EnterpriseAccountsTable';

// Reusable trash button (copied from manage accounts)
function ToolbarTrashButton({
    onClick,
    bounce = false,
}: {
    onClick?: () => void;
    bounce?: boolean;
}) {
    const [over, setOver] = useState(false);
    return (
        <motion.button
            id='accounts-trash-target'
            type='button'
            onClick={onClick}
            aria-label='Trash'
            aria-dropeffect='move'
            className={`group relative ml-3 inline-flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-300 transform ${
                over
                    ? 'bg-gradient-to-br from-red-400 to-red-600 border-red-500 ring-4 ring-red-300/50 scale-110 shadow-lg'
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:from-red-500 hover:to-red-600 hover:border-red-500 hover:shadow-lg hover:scale-105'
            } ${over ? 'drag-over' : ''}`}
            title='Trash'
            whileHover={{
                scale: 1.1,
                rotate: [0, -8, 8, 0],
                transition: {duration: 0.4},
            }}
            whileTap={{
                scale: 0.95,
                transition: {duration: 0.1},
            }}
            onDragOver={(e) => {
                e.preventDefault();
                try {
                    e.dataTransfer.dropEffect = 'move';
                } catch {}
                if (!over) setOver(true);
            }}
            onDragEnter={() => setOver(true)}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                console.log('🎯 Drop event on trash button triggered');
                setOver(false);
                try {
                    const json = e.dataTransfer.getData('application/json');
                    console.log('📦 Drag data received:', json);
                    if (!json) {
                        console.warn('⚠️ No drag data found');
                        return;
                    }
                    const payload = JSON.parse(json);
                    console.log('📋 Parsed payload:', payload);
                    const rowId = payload?.rowId as string | undefined;
                    if (!rowId) {
                        console.warn('⚠️ No rowId in payload');
                        return;
                    }
                    console.log(
                        '🚀 Dispatching accounts-row-drop-trash event for rowId:',
                        rowId,
                    );
                    const event = new CustomEvent('accounts-row-drop-trash', {
                        detail: {rowId},
                    });
                    window.dispatchEvent(event);
                } catch (error) {
                    console.error('❌ Error in drop handler:', error);
                }
            }}
        >
            {/* Animated background glow */}
            <div className='absolute inset-0 bg-red-400 rounded-full opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300'></div>

            {/* Enhanced trash icon */}
            <svg
                viewBox='0 0 24 24'
                className={`w-5 h-5 relative z-10 transition-all duration-300 ${
                    over
                        ? 'text-white animate-pulse'
                        : 'text-red-500 group-hover:text-white group-hover:animate-pulse'
                } ${bounce ? 'trash-bounce' : ''}`}
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                {/* Animated SVG paths */}
                <motion.path
                    d='M3 6h18'
                    initial={{pathLength: 0}}
                    animate={{pathLength: 1}}
                    transition={{duration: 0.5, delay: 0.1}}
                />
                <motion.path
                    className='trash-lid'
                    d='M8 6l1-2h6l1 2'
                    initial={{pathLength: 0}}
                    animate={{pathLength: 1}}
                    transition={{duration: 0.5, delay: 0.2}}
                />
                <motion.path
                    d='M6 6l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13'
                    initial={{pathLength: 0}}
                    animate={{pathLength: 1}}
                    transition={{duration: 0.5, delay: 0.3}}
                />
                <motion.path
                    d='M10 10v7M14 10v7'
                    initial={{pathLength: 0}}
                    animate={{pathLength: 1}}
                    transition={{duration: 0.5, delay: 0.4}}
                />
            </svg>

            {/* Tooltip */}
            <span
                className={`pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-md bg-slate-900 text-white text-xs px-2 py-1 shadow-lg transition-opacity duration-200 ${
                    over ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
            >
                Drag a row here to delete
            </span>

            {/* Ripple effect on click */}
            <div className='absolute inset-0 rounded-full opacity-0 group-active:opacity-40 bg-red-300 animate-ping'></div>
            <style jsx>{`
                .trash-lid {
                    transform-box: fill-box;
                    transform-origin: 60% 30%;
                }
                .group:hover .trash-lid,
                .drag-over .trash-lid {
                    animation: trash-lid-wiggle 0.55s ease-in-out;
                }
                @keyframes trash-lid-wiggle {
                    0% {
                        transform: rotate(0deg) translateY(0);
                    }
                    35% {
                        transform: rotate(-16deg) translateY(-1px);
                    }
                    65% {
                        transform: rotate(-6deg) translateY(-0.5px);
                    }
                    100% {
                        transform: rotate(0deg) translateY(0);
                    }
                }
            `}</style>
        </motion.button>
    );
}

export default function EnterpriseConfiguration() {
    console.log('🏗️ EnterpriseConfiguration component mounting...');

    // Accounts data state
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingAccount, setEditingAccount] = useState<any>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [tableVersion, setTableVersion] = useState(0);
    const [savingRows, setSavingRows] = useState<Set<string>>(new Set());

    // Navigation warning state
    const [showNavigationWarning, setShowNavigationWarning] = useState(false);
    const [incompleteRows, setIncompleteRows] = useState<string[]>([]);
    const [pendingNavigation, setPendingNavigation] = useState<
        (() => void) | null
    >(null);

    // Delete confirmation modal state
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [pendingDeleteRowId, setPendingDeleteRowId] = useState<string | null>(
        null,
    );
    const [deletingRow, setDeletingRow] = useState(false);

    // Row animation states
    const [compressingRowId, setCompressingRowId] = useState<string | null>(
        null,
    );
    const [foldingRowId, setFoldingRowId] = useState<string | null>(null);

    // Dropdown options for chips
    const [dropdownOptions, setDropdownOptions] = useState({
        enterprises: [] as Array<{id: string; name: string}>,
        products: [] as Array<{id: string; name: string}>,
        services: [] as Array<{id: string; name: string}>,
    });

    // Toolbar controls state
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [sortOpen, setSortOpen] = useState(false);
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [hideOpen, setHideOpen] = useState(false);
    const [hideQuery, setHideQuery] = useState('');
    const [groupOpen, setGroupOpen] = useState(false);
    const [ActiveGroupLabel, setActiveGroupLabel] = useState<
        'None' | 'Enterprise' | 'Product' | 'Service'
    >('None');
    const [visibleCols, setVisibleCols] = useState<ColumnType[]>([
        'masterAccount',
        'accountName',
        'country',
    ]);
    const [trashBounce, setTrashBounce] = useState(false);

    // Refs for dropdowns
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);

    // All available columns
    type ColumnType = 'masterAccount' | 'accountName' | 'country';
    const allCols: ColumnType[] = ['masterAccount', 'accountName', 'country'];

    // Helper functions
    const handleFilter = (field: string, value: string) => {
        setActiveFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const clearFilters = () => {
        setActiveFilters({});
    };

    const setGroupByFromLabel = (label: string) => {
        const l = label as 'None' | 'Enterprise' | 'Product' | 'Service';
        setActiveGroupLabel(l);
    };

    const groupByProp =
        ActiveGroupLabel === 'Enterprise'
            ? 'enterpriseName'
            : ActiveGroupLabel === 'Product'
            ? 'productName'
            : ActiveGroupLabel === 'Service'
            ? 'serviceName'
            : 'none';

    // Load dropdown options from API
    const loadDropdownOptions = async () => {
        try {
            const [enterprisesRes, productsRes, servicesRes] =
                await Promise.all([
                    api.get<Array<{id: string; name: string}>>(
                        '/api/enterprises',
                    ),
                    api.get<Array<{id: string; name: string}>>('/api/products'),
                    api.get<Array<{id: string; name: string}>>('/api/services'),
                ]);

            setDropdownOptions({
                enterprises: enterprisesRes || [],
                products: productsRes || [],
                services: servicesRes || [],
            });
        } catch (error) {
            console.error('Failed to load dropdown options:', error);
        }
    };

    // Create missing entities (enterprises, products, services) when they don't exist
    const createMissingEntities = async (
        enterpriseName: string,
        productName: string,
        serviceNames: string[],
        existingEnterprise?: any,
        existingProduct?: any,
        existingServices?: any[],
    ) => {
        const result = {
            enterprise: existingEnterprise,
            product: existingProduct,
            services: existingServices || [],
        };

        try {
            // Reload dropdown options first to ensure we have the latest data
            await loadDropdownOptions();

            // Re-check if entities exist after reload
            let foundEnterprise =
                existingEnterprise ||
                dropdownOptions.enterprises.find(
                    (e) => e.name === enterpriseName,
                );
            let foundProduct =
                existingProduct ||
                dropdownOptions.products.find((p) => p.name === productName);
            let foundServices = serviceNames
                .map((serviceName) =>
                    dropdownOptions.services.find(
                        (s) => s.name === serviceName,
                    ),
                )
                .filter(Boolean);

            // Create enterprise if still missing
            if (!foundEnterprise && enterpriseName) {
                console.log('🏢 Creating new enterprise:', enterpriseName);
                const newEnterprise = await api.post<{
                    id: string;
                    name: string;
                }>('/api/enterprises', {name: enterpriseName});
                if (newEnterprise) {
                    foundEnterprise = newEnterprise;
                    // Update dropdown options
                    setDropdownOptions((prev) => ({
                        ...prev,
                        enterprises: [...prev.enterprises, newEnterprise],
                    }));
                }
            }

            // Create product if still missing
            if (!foundProduct && productName) {
                console.log('📦 Creating new product:', productName);
                const newProduct = await api.post<{id: string; name: string}>(
                    '/api/products',
                    {name: productName},
                );
                if (newProduct) {
                    foundProduct = newProduct;
                    // Update dropdown options
                    setDropdownOptions((prev) => ({
                        ...prev,
                        products: [...prev.products, newProduct],
                    }));
                }
            }

            // Create missing services
            const missingServiceNames = serviceNames.filter(
                (serviceName) =>
                    !foundServices.some((s) => s && s.name === serviceName),
            );

            if (missingServiceNames.length > 0) {
                console.log('🔧 Creating new services:', missingServiceNames);
                const newServices: {id: string; name: string}[] = [];

                for (const serviceName of missingServiceNames) {
                    const newService = await api.post<{
                        id: string;
                        name: string;
                    }>('/api/services', {
                        name: serviceName,
                    });
                    if (newService) {
                        newServices.push(newService);
                        foundServices.push(newService);
                    }
                }

                // Update dropdown options
                if (newServices.length > 0) {
                    setDropdownOptions((prev) => ({
                        ...prev,
                        services: [...prev.services, ...newServices],
                    }));
                }
            }

            // Update result with found/created entities
            result.enterprise = foundEnterprise;
            result.product = foundProduct;
            result.services = foundServices;

            console.log('✅ Entity creation completed:', {
                enterprise: result.enterprise?.name,
                product: result.product?.name,
                services: result.services.map((s) => s?.name).filter(Boolean),
            });

            return result;
        } catch (error) {
            console.error('❌ Error creating missing entities:', error);
            return result;
        }
    };

    // Auto-save new row when all required fields are filled
    const autoSaveNewRow = async (tempRowId: string, updatedAccount?: any) => {
        try {
            console.log(
                '🚀 autoSaveNewRow function called with tempRowId:',
                tempRowId,
            );

            // Mark row as saving
            setSavingRows((prev) => new Set([...Array.from(prev), tempRowId]));

            // Use the provided updated account or find it from state
            const account =
                updatedAccount || accounts.find((a) => a.id === tempRowId);
            if (!account) {
                console.error('❌ Account not found for auto-save:', tempRowId);
                console.log(
                    '📋 Available accounts:',
                    accounts.map((a) => ({
                        id: a.id,
                        enterprise: a.enterpriseName || a.masterAccount,
                        product: a.productName || a.accountName,
                    })),
                );
                setSavingRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(tempRowId);
                    return newSet;
                });
                return;
            }

            console.log('💾 Auto-saving new row:', account);
            console.log('📊 Current dropdown options:', dropdownOptions);
            console.log(
                '🔄 Using updated account data:',
                updatedAccount ? 'YES' : 'NO',
            );

            // Find the enterprise, product, and service IDs from dropdown options
            const enterpriseName =
                account.masterAccount || account.enterpriseName;
            const productName = account.accountName || account.productName;

            // Debug the raw service value
            const rawServiceValue =
                account.address?.country || account.serviceName || '';
            console.log(
                '🔍 Raw service value:',
                rawServiceValue,
                'Type:',
                typeof rawServiceValue,
            );
            console.log('🔍 Full account.address object:', account.address);

            const serviceNames = rawServiceValue.split(', ').filter(Boolean);

            console.log('🔍 Parsed service names:', serviceNames);

            let enterprise = dropdownOptions.enterprises.find(
                (e) => e.name === enterpriseName,
            );
            let product = dropdownOptions.products.find(
                (p) => p.name === productName,
            );
            let services = serviceNames
                .map((serviceName: string) =>
                    dropdownOptions.services.find(
                        (s: any) => s.name === serviceName,
                    ),
                )
                .filter(Boolean);

            console.log('🔍 Debug - Looking for IDs:', {
                enterpriseName,
                productName,
                serviceNames,
                availableEnterprises: dropdownOptions.enterprises.map(
                    (e) => e.name,
                ),
                availableProducts: dropdownOptions.products.map((p) => p.name),
                availableServices: dropdownOptions.services.map((s) => s.name),
                foundEnterprise: enterprise,
                foundProduct: product,
                foundServices: services,
            });

            if (!enterprise || !product || services.length === 0) {
                console.error('❌ Missing required IDs for auto-save:', {
                    enterprise: enterprise?.id,
                    product: product?.id,
                    services: services.map((s: any) => s?.id),
                    missingEnterprise: !enterprise,
                    missingProduct: !product,
                    missingServices: services.length === 0,
                });

                console.log('🔧 Creating missing entities...');

                // Create missing entities (this will handle both empty dropdown and missing specific entities)
                const createdEntities = await createMissingEntities(
                    enterpriseName,
                    productName,
                    serviceNames,
                    enterprise, // Pass existing found entities (could be null)
                    product,
                    services,
                );

                if (
                    !createdEntities.enterprise ||
                    !createdEntities.product ||
                    createdEntities.services.length === 0
                ) {
                    console.error(
                        '❌ Failed to create missing entities, cannot auto-save',
                    );
                    setSavingRows((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(tempRowId);
                        return newSet;
                    });
                    return;
                }

                // Update the variables for the rest of the function
                enterprise = createdEntities.enterprise;
                product = createdEntities.product;
                services = createdEntities.services;
            }

            // Check if a record with the same enterprise + product already exists
            const existingRecord = accounts.find((acc) => {
                const accEnterprise = acc.masterAccount || acc.enterpriseName;
                const accProduct = acc.accountName || acc.productName;
                return (
                    accEnterprise === enterpriseName &&
                    accProduct === productName &&
                    !acc.id.toString().startsWith('tmp-') // Exclude temporary rows
                );
            });

            if (existingRecord) {
                console.log(
                    '🔄 Found existing record for same Enterprise + Product:',
                    {
                        existingId: existingRecord.id,
                        enterprise: enterpriseName,
                        product: productName,
                        newServices: serviceNames,
                        existingServices:
                            existingRecord.address?.country
                                ?.split(', ')
                                .filter(Boolean) || [],
                    },
                );

                // Merge services: combine existing services with new ones (avoid duplicates)
                const existingServices =
                    existingRecord.address?.country
                        ?.split(', ')
                        .filter(Boolean) || [];
                const allServices = Array.from(
                    new Set([...existingServices, ...serviceNames]),
                );

                console.log('🔄 Merging services:', {
                    existing: existingServices,
                    new: serviceNames,
                    merged: allServices,
                });

                // Find service IDs for all merged services
                const mergedServiceObjects = allServices
                    .map((serviceName: string) =>
                        dropdownOptions.services.find(
                            (s: any) => s.name === serviceName,
                        ),
                    )
                    .filter(Boolean);

                const linkageData = {
                    enterpriseId: enterprise!.id,
                    productId: product!.id,
                    serviceIds: mergedServiceObjects.map((s: any) => s!.id),
                };

                console.log(
                    '📤 Updating existing enterprise linkage:',
                    linkageData,
                );

                // Update the existing record via PUT
                const updatedLinkage = await api.put(
                    `/api/enterprise-products-services/${existingRecord.id}`,
                    linkageData,
                );

                console.log('📥 Update API Response:', updatedLinkage);

                if (updatedLinkage) {
                    console.log(
                        '✅ Services merged into existing record successfully',
                    );

                    // Update the existing record in local state with merged services
                    setAccounts(
                        (prev) =>
                            prev
                                .map((acc) => {
                                    if (acc.id === existingRecord.id) {
                                        // Update existing record with merged services
                                        return {
                                            ...acc,
                                            address: {
                                                ...acc.address,
                                                country: allServices.join(', '),
                                            },
                                        };
                                    }
                                    return acc;
                                })
                                .filter((acc) => acc.id !== tempRowId), // Remove the temporary row
                    );

                    console.log(
                        '🎉 Services successfully merged into existing enterprise configuration!',
                    );
                }
            } else {
                // No existing record found, create new one
                const linkageData = {
                    enterpriseId: enterprise!.id,
                    productId: product!.id,
                    serviceIds: services.map((s: any) => s!.id),
                };

                console.log('📤 Creating new enterprise linkage:', linkageData);

                const createdLinkage = await api.post(
                    '/api/enterprise-products-services',
                    linkageData,
                );

                console.log('📥 API Response:', createdLinkage);

                if (createdLinkage) {
                    console.log('✅ Auto-save successful:', createdLinkage);

                    // Update the account with the real ID from the backend
                    setAccounts((prev) =>
                        prev.map((acc) =>
                            acc.id === tempRowId
                                ? {...acc, id: (createdLinkage as any).id}
                                : acc,
                        ),
                    );

                    // Show success feedback
                    console.log(
                        '🎉 New enterprise configuration saved automatically!',
                    );
                }
            }
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
            // You could add a toast notification here to inform the user
        } finally {
            // Remove from saving state
            setSavingRows((prev) => {
                const newSet = new Set(Array.from(prev));
                newSet.delete(tempRowId);
                return newSet;
            });
        }
    };

    // Handle new item creation from dropdowns
    const handleNewItemCreated = (
        type: 'enterprises' | 'products' | 'services',
        item: {id: string; name: string},
    ) => {
        console.log('🆕 New item created:', type, item);

        // Update dropdown options with the new item
        setDropdownOptions((prev) => ({
            ...prev,
            [type]: [...prev[type], item],
        }));
    };

    // Test function to manually create a linkage
    const testManualLinkageCreation = async () => {
        try {
            console.log('🧪 Testing manual linkage creation...');

            // Get the first available enterprise, product, and service
            const enterprise = dropdownOptions.enterprises[0];
            const product = dropdownOptions.products[0];
            const service = dropdownOptions.services[0];

            if (!enterprise || !product || !service) {
                console.error('❌ Missing required items for test:', {
                    enterprise: !!enterprise,
                    product: !!product,
                    service: !!service,
                });
                return;
            }

            const testLinkage = {
                enterpriseId: enterprise.id,
                productId: product.id,
                serviceIds: [service.id],
            };

            console.log('📤 Creating test linkage:', testLinkage);

            const result = await api.post(
                '/api/enterprise-products-services',
                testLinkage,
            );
            console.log('✅ Test linkage created successfully:', result);
        } catch (error) {
            console.error('❌ Test linkage creation failed:', error);
        }
    };

    // Function to check for incomplete rows
    const getIncompleteRows = () => {
        return accounts
            .filter((account) => {
                const isTemporary = String(account.id).startsWith('tmp-');
                if (!isTemporary) return false; // Only check temporary rows

                const hasEnterprise =
                    account.masterAccount || account.enterpriseName;
                const hasProduct = account.accountName || account.productName;
                const hasServices =
                    account.address?.country || account.serviceName;

                // Row is incomplete if it has some data but not all required fields
                const hasAnyData = hasEnterprise || hasProduct || hasServices;
                const hasAllData = hasEnterprise && hasProduct && hasServices;

                return hasAnyData && !hasAllData;
            })
            .map((account) => account.id);
    };

    // Function to check if there's a completely blank row
    const hasBlankRow = () => {
        return accounts.some((account) => {
            const isTemporary = String(account.id).startsWith('tmp-');
            const isEmpty =
                !account.masterAccount &&
                !account.enterpriseName &&
                !account.accountName &&
                !account.productName &&
                !account.address?.country &&
                !account.serviceName;
            return isTemporary && isEmpty;
        });
    };

    // Navigation warning handler
    const handleNavigationAttempt = (navigationFn: () => void) => {
        const incomplete = getIncompleteRows();
        if (incomplete.length > 0) {
            setIncompleteRows(incomplete);
            setPendingNavigation(() => navigationFn);
            setShowNavigationWarning(true);
        } else {
            navigationFn();
        }
    };

    // Add beforeunload event listener for browser navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const incomplete = getIncompleteRows();
            if (incomplete.length > 0) {
                e.preventDefault();
                e.returnValue =
                    'You have incomplete enterprise configurations. Your changes will be lost if you leave.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [accounts, getIncompleteRows]);

    // Add test functions (temporary for debugging)
    if (typeof window !== 'undefined') {
        (window as any).testLinkageCreation = testManualLinkageCreation;
        (window as any).addTestRow = () => {
            const newId = `tmp-${Date.now()}`;
            const testRow = {
                id: newId,
                accountName: '',
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                status: 'Active',
                servicesCount: 0,
                enterpriseName: '',
                productName: '',
                serviceName: '',
                masterAccount: '',
                address: {
                    country: '',
                },
            } as any;
            setAccounts((prev) => [...prev, testRow]);
            console.log('🧪 Added test row:', newId);
        };
        (window as any).testAutoSave = (tempRowId?: string) => {
            const rowId = tempRowId || `tmp-${Date.now()}`;
            console.log('🧪 Testing auto-save for row:', rowId);
            autoSaveNewRow(rowId);
        };
        (window as any).showAccounts = () => {
            console.log('📋 Current accounts:', accounts);
            console.log('📊 Current dropdown options:', dropdownOptions);
        };
        (window as any).testNavigationWarning = () => {
            const incomplete = getIncompleteRows();
            console.log(
                '🧪 Testing navigation warning, incomplete rows:',
                incomplete,
            );
            if (incomplete.length > 0) {
                setIncompleteRows(incomplete);
                setShowNavigationWarning(true);
            } else {
                console.log('No incomplete rows found');
            }
        };

        // Test animation function
        (window as any).testAnimation = (rowId?: string) => {
            const testRowId =
                rowId || (accounts.length > 0 ? accounts[0].id : 'test-id');
            console.log('🧪 Testing animation for row:', testRowId);
            startRowCompressionAnimation(testRowId);
        };
    }

    // Handle dropdown option updates (edit/delete)
    const handleDropdownOptionUpdate = async (
        type: 'enterprises' | 'products' | 'services',
        action: 'update' | 'delete',
        oldName: string,
        newName?: string,
    ) => {
        console.log(`🔄 Updating ${type} - ${action}:`, {oldName, newName});

        // Update dropdown options
        if (action === 'update' && newName) {
            setDropdownOptions((prev) => {
                const updated = {
                    ...prev,
                    [type]: prev[type].map((item) =>
                        item.name === oldName ? {...item, name: newName} : item,
                    ),
                };
                console.log(
                    `✅ Updated dropdown options for ${type}:`,
                    updated[type],
                );
                return updated;
            });
        } else if (action === 'delete') {
            setDropdownOptions((prev) => {
                const updated = {
                    ...prev,
                    [type]: prev[type].filter((item) => item.name !== oldName),
                };
                console.log(
                    `🗑️ Removed from dropdown options for ${type}:`,
                    updated[type],
                );
                return updated;
            });
        }

        // Update all affected rows in the table
        setAccounts((prev) => {
            let updatedCount = 0;
            const updatedAccounts = prev.map((account) => {
                const updatedAccount = {...account};
                let wasUpdated = false;

                if (type === 'enterprises') {
                    if (
                        updatedAccount.masterAccount === oldName ||
                        updatedAccount.enterpriseName === oldName
                    ) {
                        if (action === 'update' && newName) {
                            updatedAccount.masterAccount = newName;
                            updatedAccount.enterpriseName = newName;
                            wasUpdated = true;
                        } else if (action === 'delete') {
                            updatedAccount.masterAccount = '';
                            updatedAccount.enterpriseName = '';
                            wasUpdated = true;
                        }
                    }
                } else if (type === 'products') {
                    if (
                        updatedAccount.accountName === oldName ||
                        updatedAccount.productName === oldName
                    ) {
                        if (action === 'update' && newName) {
                            updatedAccount.accountName = newName;
                            updatedAccount.productName = newName;
                            wasUpdated = true;
                        } else if (action === 'delete') {
                            updatedAccount.accountName = '';
                            updatedAccount.productName = '';
                            wasUpdated = true;
                        }
                    }
                } else if (type === 'services') {
                    // Services are stored in address.country as comma-separated values
                    if (updatedAccount.address?.country) {
                        const services = updatedAccount.address.country
                            .split(', ')
                            .filter(Boolean);
                        if (services.includes(oldName)) {
                            if (action === 'update' && newName) {
                                const updatedServices = services.map(
                                    (s: string) =>
                                        s === oldName ? newName : s,
                                );
                                updatedAccount.address.country =
                                    updatedServices.join(', ');
                                updatedAccount.serviceName =
                                    updatedServices.join(', ');
                                wasUpdated = true;
                            } else if (action === 'delete') {
                                const updatedServices = services.filter(
                                    (s: string) => s !== oldName,
                                );
                                updatedAccount.address.country =
                                    updatedServices.join(', ');
                                updatedAccount.serviceName =
                                    updatedServices.join(', ');
                                wasUpdated = true;
                            }
                        }
                    }
                }

                if (wasUpdated) {
                    updatedCount++;
                }

                return updatedAccount;
            });

            console.log(
                `📊 Updated ${updatedCount} table rows for ${type} ${action}`,
            );
            return updatedAccounts;
        });

        // Force table re-render by incrementing version
        setTableVersion((prev) => prev + 1);

        // Force a small delay to ensure state updates are processed
        await new Promise((resolve) => setTimeout(resolve, 50));
        console.log(`✨ Completed ${type} ${action} update`);
    };

    // Load enterprise-product-service linkages from API

    // Load data on component mount
    useEffect(() => {
        (async () => {
            try {
                setIsLoading(true);
                console.log('🔄 Loading enterprise linkages...');

                // Load both linkages and dropdown options in parallel
                const [linkagesRes] = await Promise.all([
                    api.get<
                        Array<{
                            id: string;
                            enterpriseId: string;
                            productId: string;
                            serviceIds: string[];
                            enterprise: {
                                id: string;
                                name: string;
                            };
                            product: {
                                id: string;
                                name: string;
                            };
                            services: Array<{
                                id: string;
                                name: string;
                            }>;
                            createdAt: string;
                            updatedAt: string;
                        }>
                    >('/api/enterprise-products-services'),
                    loadDropdownOptions(),
                ]);

                console.log(
                    '📊 Loaded enterprise linkages:',
                    linkagesRes?.length || 0,
                );

                if (!linkagesRes || linkagesRes.length === 0) {
                    console.log('ℹ️ No enterprise linkages found');
                    setAccounts([]);
                    setIsLoading(false);
                    // Don't return here - dropdown options are still loaded and ready for new records
                    return;
                }

                // Transform linkage data to AccountRow format
                const transformedAccounts = linkagesRes.map((linkage) => ({
                    id: linkage.id,
                    globalClientName: linkage.enterprise.name || '',
                    accountName: linkage.product.name || '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    status: 'Active' as const,
                    servicesCount: linkage.services?.length || 0,
                    enterpriseName: linkage.enterprise.name || '',
                    servicesSummary: (linkage.services || [])
                        .map((service) => service.name)
                        .join(', '),
                    productName: linkage.product.name || '',
                    serviceName: (linkage.services || [])
                        .map((service) => service.name)
                        .join(', '),
                    masterAccount: linkage.enterprise.name || '',
                    address: {
                        country: (linkage.services || [])
                            .map((service) => service.name)
                            .join(', '), // Store services in country field for display
                    },
                }));

                setAccounts(transformedAccounts);
                console.log(
                    '✅ Enterprise linkages loaded and transformed successfully',
                );
            } catch (error) {
                console.error('❌ Failed to load enterprise linkages:', error);
                setAccounts([]);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    // Force table re-render when accounts data changes
    useEffect(() => {
        console.log(
            '📋 Accounts data changed, current count:',
            accounts.length,
        );
    }, [accounts]);

    // Handle drag-and-drop delete events
    useEffect(() => {
        const handleRowDropTrash = (event: CustomEvent) => {
            console.log(
                '🗑️ Drag-and-drop delete event received:',
                event.detail,
            );
            const {rowId} = event.detail;
            if (rowId) {
                const row = accounts.find((account) => account.id === rowId);
                if (row) {
                    console.log('🎯 Found row for animation:', row);
                    // Start the compression animation sequence
                    startRowCompressionAnimation(rowId);
                } else {
                    console.warn('⚠️ Row not found for ID:', rowId);
                }
            } else {
                console.warn('⚠️ No rowId in event detail');
            }
        };

        window.addEventListener(
            'accounts-row-drop-trash',
            handleRowDropTrash as EventListener,
        );
        return () => {
            window.removeEventListener(
                'accounts-row-drop-trash',
                handleRowDropTrash as EventListener,
            );
        };
    }, [accounts]);

    // Row compression animation sequence
    const startRowCompressionAnimation = async (rowId: string) => {
        console.log('🎬 Starting compression animation for row:', rowId);

        // Step 1: Compress the row horizontally
        setCompressingRowId(rowId);

        // Wait for compression animation
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Step 2: Fold the row vertically
        setFoldingRowId(rowId);
        setCompressingRowId(null);

        // Wait for folding animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Step 3: Show confirmation modal
        setPendingDeleteRowId(rowId);
        setShowDeleteConfirmation(true);
        setFoldingRowId(null);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!pendingDeleteRowId) return;

        setDeletingRow(true);
        try {
            console.log('🗑️ Deleting enterprise linkage:', pendingDeleteRowId);

            // Call the backend delete API
            await api.del(
                `/api/enterprise-products-services/${pendingDeleteRowId}`,
            );

            // Remove from local state
            setAccounts((prev) =>
                prev.filter((account) => account.id !== pendingDeleteRowId),
            );

            console.log('✅ Enterprise linkage deleted successfully');

            // Close modal and reset state
            setShowDeleteConfirmation(false);
            setPendingDeleteRowId(null);

            // Trigger table re-render
            setTableVersion((prev) => prev + 1);
        } catch (error) {
            console.error('❌ Failed to delete enterprise linkage:', error);
            // You could show an error toast here
            alert(
                'Failed to delete the enterprise configuration. Please try again.',
            );
        } finally {
            setDeletingRow(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirmation(false);
        setPendingDeleteRowId(null);
    };

    return (
        <div className='h-full bg-secondary flex flex-col'>
            {/* Header Section */}
            <div className='bg-white px-6 py-4 border-b border-slate-200'>
                <div className='max-w-7xl mx-auto'>
                    <h1 className='text-2xl font-bold text-slate-900'>
                        Enterprise Configuration
                    </h1>
                    <p className='mt-2 text-sm text-slate-600 leading-relaxed'>
                        Create, edit, and manage enterprise-product-service
                        linkages at scale with advanced grouping, filtering, and
                        quick actions for streamlined configuration management.
                    </p>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-sap-light-gray px-6 py-3 text-primary border-y border-light'>
                <div className='flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-3 flex-wrap'>
                        {/* Create New Enterprise Button */}
                        <button
                            onClick={() => {
                                // Check if there's already a blank row
                                if (hasBlankRow()) {
                                    alert(
                                        'Please complete the existing blank row before adding a new one.',
                                    );
                                    return;
                                }

                                const newId = `tmp-${Date.now()}`;
                                const blank = {
                                    id: newId,
                                    accountName: '',
                                    firstName: '',
                                    lastName: '',
                                    email: '',
                                    phone: '',
                                    status: 'Active',
                                    servicesCount: 0,
                                    enterpriseName: '',
                                    productName: '',
                                    serviceName: '',
                                    masterAccount: '',
                                    address: {
                                        country: '',
                                    },
                                } as any;
                                setAccounts((prev) => [...prev, blank]);
                                console.log('➕ Added new blank row:', newId);
                                // scroll to bottom where the new row is rendered
                                setTimeout(() => {
                                    window.scrollTo({
                                        top: document.body.scrollHeight,
                                        behavior: 'smooth',
                                    });
                                }, 0);
                            }}
                            disabled={isLoading}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md shadow-sm ${
                                isLoading
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                            }`}
                        >
                            {isLoading ? (
                                <div className='h-4 w-4 animate-spin'>
                                    <svg
                                        className='h-full w-full'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                    >
                                        <circle
                                            className='opacity-25'
                                            cx='12'
                                            cy='12'
                                            r='10'
                                            stroke='currentColor'
                                            strokeWidth='4'
                                        />
                                        <path
                                            className='opacity-75'
                                            fill='currentColor'
                                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                        />
                                    </svg>
                                </div>
                            ) : (
                                <PlusIcon className='h-4 w-4' />
                            )}
                            <span className='text-sm'>
                                {isLoading ? 'Loading...' : 'New Enterprise'}
                            </span>
                        </button>

                        {/* Search Button */}
                        <div className='flex items-center'>
                            {showSearchBar && (
                                <div className='relative w-72 mr-3'>
                                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                        <MagnifyingGlassIcon className='h-5 w-5 text-secondary' />
                                    </div>
                                    <input
                                        type='text'
                                        placeholder='Search accounts...'
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className='block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400'
                                        autoFocus
                                    />
                                </div>
                            )}
                            <button
                                onClick={() => setShowSearchBar((v) => !v)}
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    showSearchBar
                                        ? 'border-blue-300 bg-blue-50 text-blue-600 shadow-blue-200 shadow-lg'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-lg'
                                }`}
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform duration-300 ${
                                        showSearchBar
                                            ? 'rotate-90'
                                            : 'group-hover:scale-110'
                                    }`}
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                                    />
                                </svg>
                                <span className='text-sm'>Search</span>
                                {showSearchBar && (
                                    <div className='absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-500 rounded-full animate-pulse'></div>
                                )}
                            </button>
                        </div>

                        {/* Filter Button */}
                        <div className='relative'>
                            <button
                                onClick={() => setFilterVisible(!filterVisible)}
                                className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all duration-300 transform hover:scale-105 ${
                                    filterVisible ||
                                    Object.keys(activeFilters).length > 0
                                        ? 'border-purple-300 bg-purple-50 text-purple-600 shadow-purple-200 shadow-lg'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 hover:shadow-lg'
                                }`}
                            >
                                <svg
                                    className='w-4 h-4 transition-transform duration-300 group-hover:scale-110'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z'
                                    />
                                </svg>
                                <span className='text-sm'>Filter</span>
                                {Object.keys(activeFilters).length > 0 && (
                                    <div className='absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-bounce'></div>
                                )}
                            </button>

                            {/* Filter Dropdown */}
                            {filterVisible && (
                                <div className='absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-80'>
                                    <div className='p-4'>
                                        <div className='text-sm font-medium text-gray-700 mb-3'>
                                            Apply Filters:
                                        </div>

                                        {/* Enterprise Filter */}
                                        <div className='mb-3'>
                                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                                                Enterprise:
                                            </label>
                                            <input
                                                type='text'
                                                value={
                                                    activeFilters.masterAccount ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    handleFilter(
                                                        'masterAccount',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder='Search by enterprise...'
                                                className='w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                            />
                                        </div>

                                        {/* Product Filter */}
                                        <div className='mb-3'>
                                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                                                Product:
                                            </label>
                                            <input
                                                type='text'
                                                value={
                                                    activeFilters.accountName ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    handleFilter(
                                                        'accountName',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder='Search by product...'
                                                className='w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                            />
                                        </div>

                                        {/* Services Filter */}
                                        <div className='mb-4'>
                                            <label className='block text-xs font-medium text-gray-600 mb-1'>
                                                Services:
                                            </label>
                                            <input
                                                type='text'
                                                value={
                                                    activeFilters.country || ''
                                                }
                                                onChange={(e) =>
                                                    handleFilter(
                                                        'country',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder='Search by services...'
                                                className='w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className='flex gap-2'>
                                            <button
                                                onClick={clearFilters}
                                                className='px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200'
                                            >
                                                Clear All
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setFilterVisible(false)
                                                }
                                                className='px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded border border-purple-200'
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sort Button */}
                        <div ref={sortRef} className='relative'>
                            <button
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                title='Sort'
                                onClick={() => setSortOpen((v) => !v)}
                            >
                                <ArrowsUpDownIcon className='h-4 w-4' />
                                <span className='text-sm'>Sort</span>
                                {!!sortColumn && (
                                    <span className='absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary-600 animate-pulse'></span>
                                )}
                            </button>
                            {sortOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[420px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                    <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                        <div className='text-sm font-semibold'>
                                            Sort by
                                        </div>
                                    </div>
                                    <div className='p-3 space-y-2'>
                                        <div className='flex gap-2 items-center'>
                                            <select
                                                value={sortColumn}
                                                onChange={(e) =>
                                                    setSortColumn(
                                                        e.target.value,
                                                    )
                                                }
                                                className='flex-1 bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                            >
                                                <option value=''>
                                                    Choose column
                                                </option>
                                                <option value='masterAccount'>
                                                    Enterprise
                                                </option>
                                                <option value='accountName'>
                                                    Product
                                                </option>
                                                <option value='country'>
                                                    Services
                                                </option>
                                            </select>
                                            <div className='shrink-0 inline-flex rounded-md border border-light overflow-hidden'>
                                                <button
                                                    className={`px-2.5 py-1.5 text-xs ${
                                                        sortDirection === 'asc'
                                                            ? 'bg-slate-100 text-primary'
                                                            : 'bg-white text-secondary'
                                                    }`}
                                                    onClick={() =>
                                                        setSortDirection('asc')
                                                    }
                                                >
                                                    Asc
                                                </button>
                                                <button
                                                    className={`px-2.5 py-1.5 text-xs border-l border-light ${
                                                        sortDirection === 'desc'
                                                            ? 'bg-slate-100 text-primary'
                                                            : 'bg-white text-secondary'
                                                    }`}
                                                    onClick={() =>
                                                        setSortDirection('desc')
                                                    }
                                                >
                                                    Desc
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hide Columns Button */}
                        <div ref={hideRef} className='relative'>
                            <button
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                onClick={() => setHideOpen((v) => !v)}
                            >
                                <EyeSlashIcon className='h-4 w-4' />
                                <span className='text-sm'>Hide</span>
                                {visibleCols.length < allCols.length && (
                                    <span className='absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary-600 animate-pulse'></span>
                                )}
                            </button>
                            {hideOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[420px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                    <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                        <div className='text-sm font-semibold'>
                                            Hide columns
                                        </div>
                                    </div>
                                    <div className='p-3 space-y-2'>
                                        <input
                                            value={hideQuery}
                                            onChange={(e) =>
                                                setHideQuery(e.target.value)
                                            }
                                            placeholder='Search columns'
                                            className='w-full bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                        />
                                        <div className='max-h-56 overflow-auto divide-y divide-light'>
                                            {allCols
                                                .filter((c) =>
                                                    c
                                                        .toLowerCase()
                                                        .includes(
                                                            hideQuery.toLowerCase(),
                                                        ),
                                                )
                                                .map((c) => (
                                                    <label
                                                        key={c}
                                                        className='flex items-center justify-between py-2'
                                                    >
                                                        <span className='text-sm capitalize'>
                                                            {c ===
                                                            'masterAccount'
                                                                ? 'Enterprise'
                                                                : c ===
                                                                  'accountName'
                                                                ? 'Product'
                                                                : c ===
                                                                  'country'
                                                                ? 'Services'
                                                                : c}
                                                        </span>
                                                        <input
                                                            type='checkbox'
                                                            checked={visibleCols.includes(
                                                                c as ColumnType,
                                                            )}
                                                            onChange={(e) => {
                                                                const checked =
                                                                    e.target
                                                                        .checked;
                                                                setVisibleCols(
                                                                    (prev) => {
                                                                        if (
                                                                            checked
                                                                        )
                                                                            return Array.from(
                                                                                new Set(
                                                                                    [
                                                                                        ...prev,
                                                                                        c as ColumnType,
                                                                                    ],
                                                                                ),
                                                                            );
                                                                        return prev.filter(
                                                                            (
                                                                                x,
                                                                            ) =>
                                                                                x !==
                                                                                c,
                                                                        );
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                    </label>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Group By Button */}
                        <div
                            ref={groupRef}
                            className='relative flex items-center'
                        >
                            <button
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                onClick={() => setGroupOpen((v) => !v)}
                            >
                                <RectangleStackIcon className='h-4 w-4' />
                                <span className='text-sm'>Group by</span>
                                {ActiveGroupLabel !== 'None' && (
                                    <span className='absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary-600 animate-pulse'></span>
                                )}
                            </button>
                            {groupOpen && (
                                <div className='absolute left-0 top-full z-50 mt-2 w-[420px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                    <div className='flex items-center justify-between px-4 py-2.5 border-b border-light'>
                                        <div className='text-sm font-semibold'>
                                            Group by
                                        </div>
                                    </div>
                                    <div className='p-3 space-y-2'>
                                        <select
                                            value={ActiveGroupLabel}
                                            onChange={(e) =>
                                                setGroupByFromLabel(
                                                    e.target.value,
                                                )
                                            }
                                            className='w-full bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                        >
                                            <option>None</option>
                                            <option>Enterprise</option>
                                            <option>Product</option>
                                            <option>Service</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className='inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'>
                            <span className='text-xl leading-none'>…</span>
                        </button>

                        <ToolbarTrashButton
                            onClick={() => {}}
                            bounce={trashBounce}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 p-6 overflow-hidden'>
                <div className='h-full space-y-6'>
                    {/* Account Details Table - Copied from Manage Accounts */}
                    <div className='bg-card border border-light rounded-lg p-6 h-full flex flex-col'>
                        {/* <div className='mb-4'>
                            <h2 className='text-lg font-semibold text-primary'>
                                Enterprise Account Details
                            </h2>
                            <p className='text-sm text-secondary mt-1'>
                                Complete account information with all features
                                from the Manage Accounts screen.
                            </p>
                        </div> */}

                        {isLoading ? (
                            // Loading State
                            <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                                <div className='mx-auto max-w-md'>
                                    <div className='mx-auto h-12 w-12 text-primary-600 animate-spin'>
                                        <svg
                                            className='h-full w-full'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                        >
                                            <circle
                                                className='opacity-25'
                                                cx='12'
                                                cy='12'
                                                r='10'
                                                stroke='currentColor'
                                                strokeWidth='4'
                                            />
                                            <path
                                                className='opacity-75'
                                                fill='currentColor'
                                                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                            />
                                        </svg>
                                    </div>
                                    <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                        Loading Enterprise Configurations
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        Please wait while we fetch your
                                        enterprise-product-service linkages...
                                    </p>
                                </div>
                            </div>
                        ) : accounts.length === 0 ? (
                            // Empty State
                            <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
                                <div className='mx-auto max-w-md'>
                                    <svg
                                        className='mx-auto h-12 w-12 text-slate-400'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                        aria-hidden='true'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6m-6 4h6'
                                        />
                                    </svg>
                                    <h3 className='mt-4 text-lg font-semibold text-slate-900'>
                                        No Enterprise Configurations
                                    </h3>
                                    <p className='mt-2 text-sm text-slate-500'>
                                        No enterprise-product-service linkages
                                        have been configured yet. Create your
                                        first enterprise configuration to get
                                        started.
                                    </p>
                                    <div className='mt-6'>
                                        <button
                                            onClick={() => {
                                                // Trigger the "New Enterprise" action
                                                const newId = `tmp-${Date.now()}`;
                                                const blank = {
                                                    id: newId,
                                                    accountName: '',
                                                    firstName: '',
                                                    lastName: '',
                                                    email: '',
                                                    phone: '',
                                                    status: 'Active',
                                                    servicesCount: 0,
                                                    enterpriseName: '',
                                                    productName: '',
                                                    serviceName: '',
                                                    masterAccount: '',
                                                    address: {
                                                        country: '',
                                                    },
                                                } as any;
                                                setAccounts([blank]);
                                            }}
                                            className='inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                                        >
                                            <PlusIcon className='-ml-1 mr-2 h-5 w-5' />
                                            Create First Enterprise
                                            Configuration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className='flex-1 overflow-auto'>
                                <EnterpriseAccountsTable
                                    key={`table-v${tableVersion}-${accounts.length}`}
                                    // title='Account Details'
                                    hideRowExpansion={true}
                                    customColumnLabels={{
                                        masterAccount: 'Enterprise',
                                        accountName: 'Product',
                                        country: 'Services',
                                    }}
                                    enableDropdownChips={true}
                                    dropdownOptions={dropdownOptions}
                                    onDropdownOptionUpdate={
                                        handleDropdownOptionUpdate
                                    }
                                    onNewItemCreated={handleNewItemCreated}
                                    incompleteRowIds={getIncompleteRows()}
                                    hasBlankRow={hasBlankRow()}
                                    compressingRowId={compressingRowId}
                                    foldingRowId={foldingRowId}
                                    onUpdateField={async (
                                        rowId,
                                        field,
                                        value,
                                    ) => {
                                        console.log(
                                            '🔄 onUpdateField called:',
                                            {
                                                rowId,
                                                field,
                                                value,
                                                isTemporary:
                                                    rowId.startsWith('tmp-'),
                                            },
                                        );

                                        // Update local state immediately for responsiveness
                                        setAccounts((prev) =>
                                            prev.map((account) =>
                                                account.id === rowId
                                                    ? {
                                                          ...account,
                                                          [field]: value,
                                                      }
                                                    : account,
                                            ),
                                        );

                                        // Handle field-specific updates for enterprise linkages
                                        try {
                                            const account = accounts.find(
                                                (a) => a.id === rowId,
                                            );
                                            if (!account) return;

                                            let updateData: any = {};

                                            if (field === 'masterAccount') {
                                                // Enterprise field updated
                                                updateData.enterpriseName =
                                                    value;
                                            } else if (
                                                field === 'accountName'
                                            ) {
                                                // Product field updated
                                                updateData.productName = value;
                                            } else if (
                                                field === 'address' &&
                                                value?.country
                                            ) {
                                                // Services field updated (stored in address.country)
                                                updateData.serviceNames =
                                                    value.country
                                                        .split(', ')
                                                        .filter(Boolean);
                                            }

                                            // For new rows (temporary IDs), check if we can auto-save
                                            if (rowId.startsWith('tmp-')) {
                                                console.log(
                                                    '🔄 Updating temporary row:',
                                                    rowId,
                                                    field,
                                                    value,
                                                );

                                                // Check if all required fields are filled for auto-save
                                                const updatedAccount =
                                                    accounts.find(
                                                        (a) => a.id === rowId,
                                                    );
                                                if (updatedAccount) {
                                                    // Apply the current update to check completeness
                                                    const accountWithUpdate = {
                                                        ...updatedAccount,
                                                        [field]: value,
                                                    };

                                                    // Check if we have enterprise, product, and at least one service
                                                    const hasEnterprise =
                                                        accountWithUpdate.masterAccount ||
                                                        accountWithUpdate.enterpriseName;
                                                    const hasProduct =
                                                        accountWithUpdate.accountName ||
                                                        accountWithUpdate.productName;
                                                    const hasServices =
                                                        accountWithUpdate
                                                            .address?.country ||
                                                        accountWithUpdate.serviceName;

                                                    console.log(
                                                        '🔍 Auto-save check:',
                                                        {
                                                            rowId,
                                                            field,
                                                            value,
                                                            accountWithUpdate,
                                                            hasEnterprise,
                                                            hasProduct,
                                                            hasServices,
                                                            willAutoSave:
                                                                hasEnterprise &&
                                                                hasProduct &&
                                                                hasServices,
                                                        },
                                                    );

                                                    if (
                                                        hasEnterprise &&
                                                        hasProduct &&
                                                        hasServices
                                                    ) {
                                                        console.log(
                                                            '✅ All required fields filled, auto-saving new row...',
                                                        );
                                                        console.log(
                                                            '⏰ Setting timeout to call autoSaveNewRow in 500ms',
                                                        );
                                                        // Auto-save the new row
                                                        setTimeout(() => {
                                                            console.log(
                                                                '⏰ Timeout triggered, calling autoSaveNewRow now',
                                                            );
                                                            autoSaveNewRow(
                                                                rowId,
                                                                accountWithUpdate,
                                                            );
                                                        }, 500); // Small delay to ensure state is updated
                                                    } else {
                                                        console.log(
                                                            '❌ Auto-save conditions not met:',
                                                            {
                                                                hasEnterprise,
                                                                hasProduct,
                                                                hasServices,
                                                                enterpriseValue:
                                                                    accountWithUpdate.masterAccount ||
                                                                    accountWithUpdate.enterpriseName,
                                                                productValue:
                                                                    accountWithUpdate.accountName ||
                                                                    accountWithUpdate.productName,
                                                                servicesValue:
                                                                    accountWithUpdate
                                                                        .address
                                                                        ?.country ||
                                                                    accountWithUpdate.serviceName,
                                                            },
                                                        );
                                                    }
                                                }
                                                return;
                                            }

                                            // For existing rows, attempt to update via API
                                            console.log(
                                                '🔄 Updating enterprise linkage:',
                                                rowId,
                                                updateData,
                                            );

                                            // Update the enterprise linkage via API
                                            try {
                                                const account = accounts.find(
                                                    (a) => a.id === rowId,
                                                );
                                                if (account) {
                                                    // Create updated account with the new value
                                                    const updatedAccount = {
                                                        ...account,
                                                        [field]: value,
                                                    };

                                                    // Find the IDs for the current values (use updated account)
                                                    const enterpriseName =
                                                        updatedAccount.masterAccount ||
                                                        updatedAccount.enterpriseName;
                                                    const productName =
                                                        updatedAccount.accountName ||
                                                        updatedAccount.productName;
                                                    const rawServiceValue =
                                                        updatedAccount.address
                                                            ?.country ||
                                                        updatedAccount.serviceName ||
                                                        '';
                                                    const serviceNames =
                                                        rawServiceValue
                                                            .split(', ')
                                                            .filter(Boolean);

                                                    console.log(
                                                        '🔍 Service update debug:',
                                                        {
                                                            field,
                                                            oldRawServiceValue:
                                                                account.address
                                                                    ?.country ||
                                                                account.serviceName ||
                                                                '',
                                                            newRawServiceValue:
                                                                rawServiceValue,
                                                            serviceNames,
                                                            serviceCount:
                                                                serviceNames.length,
                                                        },
                                                    );

                                                    // Check if Enterprise or Product changed - this might create a duplicate
                                                    const oldEnterpriseName =
                                                        account.masterAccount ||
                                                        account.enterpriseName;
                                                    const oldProductName =
                                                        account.accountName ||
                                                        account.productName;

                                                    if (
                                                        (field ===
                                                            'masterAccount' &&
                                                            enterpriseName !==
                                                                oldEnterpriseName) ||
                                                        (field ===
                                                            'accountName' &&
                                                            productName !==
                                                                oldProductName)
                                                    ) {
                                                        // Check if the new Enterprise + Product combination already exists
                                                        const duplicateRecord =
                                                            accounts.find(
                                                                (acc) => {
                                                                    const accEnterprise =
                                                                        acc.masterAccount ||
                                                                        acc.enterpriseName;
                                                                    const accProduct =
                                                                        acc.accountName ||
                                                                        acc.productName;
                                                                    return (
                                                                        accEnterprise ===
                                                                            enterpriseName &&
                                                                        accProduct ===
                                                                            productName &&
                                                                        acc.id !==
                                                                            rowId && // Different record
                                                                        !acc.id
                                                                            .toString()
                                                                            .startsWith(
                                                                                'tmp-',
                                                                            ) // Not temporary
                                                                    );
                                                                },
                                                            );

                                                        if (duplicateRecord) {
                                                            console.log(
                                                                '⚠️ Enterprise + Product change would create duplicate:',
                                                                {
                                                                    currentId:
                                                                        rowId,
                                                                    duplicateId:
                                                                        duplicateRecord.id,
                                                                    enterprise:
                                                                        enterpriseName,
                                                                    product:
                                                                        productName,
                                                                },
                                                            );

                                                            // Merge services into the existing duplicate record
                                                            const existingServices =
                                                                duplicateRecord.address?.country
                                                                    ?.split(
                                                                        ', ',
                                                                    )
                                                                    .filter(
                                                                        Boolean,
                                                                    ) || [];
                                                            const currentServices =
                                                                account.address?.country
                                                                    ?.split(
                                                                        ', ',
                                                                    )
                                                                    .filter(
                                                                        Boolean,
                                                                    ) || [];
                                                            const allServices =
                                                                Array.from(
                                                                    new Set([
                                                                        ...existingServices,
                                                                        ...currentServices,
                                                                    ]),
                                                                );

                                                            // Update the duplicate record with merged services
                                                            const mergedServiceObjects =
                                                                allServices
                                                                    .map(
                                                                        (
                                                                            serviceName: string,
                                                                        ) =>
                                                                            dropdownOptions.services.find(
                                                                                (
                                                                                    s: any,
                                                                                ) =>
                                                                                    s.name ===
                                                                                    serviceName,
                                                                            ),
                                                                    )
                                                                    .filter(
                                                                        Boolean,
                                                                    );

                                                            const enterprise =
                                                                dropdownOptions.enterprises.find(
                                                                    (e) =>
                                                                        e.name ===
                                                                        enterpriseName,
                                                                );
                                                            const product =
                                                                dropdownOptions.products.find(
                                                                    (p) =>
                                                                        p.name ===
                                                                        productName,
                                                                );

                                                            if (
                                                                enterprise &&
                                                                product &&
                                                                mergedServiceObjects.length >
                                                                    0
                                                            ) {
                                                                const linkageData =
                                                                    {
                                                                        enterpriseId:
                                                                            enterprise.id,
                                                                        productId:
                                                                            product.id,
                                                                        serviceIds:
                                                                            mergedServiceObjects.map(
                                                                                (
                                                                                    s: any,
                                                                                ) =>
                                                                                    s!
                                                                                        .id,
                                                                            ),
                                                                    };

                                                                // Update the existing duplicate record
                                                                await api.put(
                                                                    `/api/enterprise-products-services/${duplicateRecord.id}`,
                                                                    linkageData,
                                                                );

                                                                // Delete the current record since it's now merged
                                                                await api.del(
                                                                    `/api/enterprise-products-services/${rowId}`,
                                                                );

                                                                // Update local state: merge into duplicate and remove current
                                                                setAccounts(
                                                                    (prev) =>
                                                                        prev
                                                                            .map(
                                                                                (
                                                                                    acc,
                                                                                ) => {
                                                                                    if (
                                                                                        acc.id ===
                                                                                        duplicateRecord.id
                                                                                    ) {
                                                                                        return {
                                                                                            ...acc,
                                                                                            address:
                                                                                                {
                                                                                                    ...acc.address,
                                                                                                    country:
                                                                                                        allServices.join(
                                                                                                            ', ',
                                                                                                        ),
                                                                                                },
                                                                                        };
                                                                                    }
                                                                                    return acc;
                                                                                },
                                                                            )
                                                                            .filter(
                                                                                (
                                                                                    acc,
                                                                                ) =>
                                                                                    acc.id !==
                                                                                    rowId,
                                                                            ),
                                                                );

                                                                console.log(
                                                                    '✅ Records merged successfully, duplicate removed',
                                                                );
                                                                return; // Exit early, no need to continue with normal update
                                                            }
                                                        }
                                                    }

                                                    const enterprise =
                                                        dropdownOptions.enterprises.find(
                                                            (e) =>
                                                                e.name ===
                                                                enterpriseName,
                                                        );
                                                    const product =
                                                        dropdownOptions.products.find(
                                                            (p) =>
                                                                p.name ===
                                                                productName,
                                                        );
                                                    const services =
                                                        serviceNames
                                                            .map(
                                                                (
                                                                    serviceName: string,
                                                                ) =>
                                                                    dropdownOptions.services.find(
                                                                        (
                                                                            s: any,
                                                                        ) =>
                                                                            s.name ===
                                                                            serviceName,
                                                                    ),
                                                            )
                                                            .filter(Boolean);

                                                    if (
                                                        enterprise &&
                                                        product &&
                                                        services.length > 0
                                                    ) {
                                                        const linkageUpdateData =
                                                            {
                                                                enterpriseId:
                                                                    enterprise.id,
                                                                productId:
                                                                    product.id,
                                                                serviceIds:
                                                                    services.map(
                                                                        (
                                                                            s: any,
                                                                        ) =>
                                                                            s!
                                                                                .id,
                                                                    ),
                                                            };

                                                        console.log(
                                                            '📤 Updating enterprise linkage via API:',
                                                            linkageUpdateData,
                                                        );

                                                        try {
                                                            // Try to update first
                                                            await api.put(
                                                                `/api/enterprise-products-services/${rowId}`,
                                                                linkageUpdateData,
                                                            );
                                                            console.log(
                                                                '✅ Enterprise linkage updated successfully',
                                                            );
                                                        } catch (updateError: any) {
                                                            // If update fails with 404, try to create a new record
                                                            if (
                                                                updateError.message?.includes(
                                                                    '404',
                                                                ) ||
                                                                updateError.message?.includes(
                                                                    'Record not found',
                                                                )
                                                            ) {
                                                                console.log(
                                                                    '🔄 Record not found, creating new linkage instead...',
                                                                );
                                                                try {
                                                                    const newLinkage =
                                                                        await api.post(
                                                                            '/api/enterprise-products-services',
                                                                            linkageUpdateData,
                                                                        );
                                                                    console.log(
                                                                        '✅ New enterprise linkage created successfully:',
                                                                        newLinkage,
                                                                    );

                                                                    // Update the local account with the new linkage ID
                                                                    if (
                                                                        newLinkage &&
                                                                        (
                                                                            newLinkage as any
                                                                        ).id
                                                                    ) {
                                                                        setAccounts(
                                                                            (
                                                                                prev,
                                                                            ) =>
                                                                                prev.map(
                                                                                    (
                                                                                        acc,
                                                                                    ) =>
                                                                                        acc.id ===
                                                                                        rowId
                                                                                            ? {
                                                                                                  ...acc,
                                                                                                  id: (
                                                                                                      newLinkage as any
                                                                                                  )
                                                                                                      .id,
                                                                                              }
                                                                                            : acc,
                                                                                ),
                                                                        );
                                                                    }
                                                                } catch (createError) {
                                                                    console.error(
                                                                        '❌ Failed to create new enterprise linkage:',
                                                                        createError,
                                                                    );
                                                                    throw createError;
                                                                }
                                                            } else {
                                                                throw updateError;
                                                            }
                                                        }
                                                    } else {
                                                        console.warn(
                                                            '⚠️ Cannot update linkage - missing required IDs:',
                                                            {
                                                                enterprise:
                                                                    enterprise?.id,
                                                                product:
                                                                    product?.id,
                                                                services:
                                                                    services.map(
                                                                        (
                                                                            s: any,
                                                                        ) =>
                                                                            s?.id,
                                                                    ),
                                                            },
                                                        );
                                                    }
                                                }
                                            } catch (apiError) {
                                                console.error(
                                                    '❌ Failed to update enterprise linkage via API:',
                                                    apiError,
                                                );
                                            }
                                        } catch (error) {
                                            console.error(
                                                '❌ Failed to update enterprise linkage:',
                                                error,
                                            );
                                            // Optionally revert the local state change on error
                                        }
                                    }}
                                    rows={accounts.map<AccountRow>(
                                        (a: any) => ({
                                            id: a.id || '',
                                            globalClientName:
                                                a.globalClientName ||
                                                a.clientName ||
                                                '',
                                            accountName: a.accountName || '',
                                            firstName: a.firstName || '',
                                            lastName: a.lastName || '',
                                            email: a.email || '',
                                            phone: a.phone || '',
                                            status: a.status || 'Active',
                                            servicesCount:
                                                a.services?.length || 0,
                                            enterpriseName:
                                                a.enterpriseName ||
                                                a.enterpriseId ||
                                                '',
                                            servicesSummary: (a.services || [])
                                                .map(
                                                    (s: any) =>
                                                        `${s.service} • ${s.category}`,
                                                )
                                                .join(','),
                                            productName: a.productName || '',
                                            serviceName: a.serviceName || '',
                                            masterAccount:
                                                a.masterAccount || '',
                                            address: {
                                                country:
                                                    a.address?.country || '',
                                            },
                                            licenses: [],
                                        }),
                                    )}
                                    onEdit={(id) => {
                                        const acc = accounts.find(
                                            (x) => x.id === id,
                                        );
                                        if (acc) {
                                            setEditingAccount(acc);
                                            setShowCreateForm(true);
                                        }
                                    }}
                                    onDelete={(id) => {
                                        setPendingDeleteId(id);
                                    }}
                                    visibleColumns={visibleCols}
                                    highlightQuery={searchTerm}
                                    groupByExternal={groupByProp}
                                    onQuickAddRow={async () => {
                                        // Check if there's already a blank row
                                        if (hasBlankRow()) {
                                            // Don't add a new row, the inline warning will show
                                            return;
                                        }

                                        const newId = `tmp-${Date.now()}`;
                                        const blank = {
                                            id: newId,
                                            accountName: '',
                                            firstName: '',
                                            lastName: '',
                                            email: '',
                                            phone: '',
                                            status: 'Active',
                                            servicesCount: 0,
                                            enterpriseName: '',
                                            productName: '',
                                            serviceName: '',
                                            masterAccount: '',
                                            address: {
                                                country: '',
                                            },
                                            licenses: [],
                                        } as any;
                                        setAccounts((prev) => [...prev, blank]);
                                        // Smooth scroll to the new row for visibility
                                        setTimeout(() => {
                                            const el = document.querySelector(
                                                `[data-account-id="${newId}"]`,
                                            );
                                            if (el) {
                                                el.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'center',
                                                });
                                            }
                                        }, 50);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Warning Modal */}
            {showNavigationWarning && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <div
                            className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                            onClick={() => setShowNavigationWarning(false)}
                        ></div>

                        <div className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'>
                            <div className='sm:flex sm:items-start'>
                                <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                                    <svg
                                        className='h-6 w-6 text-red-600'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        strokeWidth='1.5'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
                                        />
                                    </svg>
                                </div>
                                <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
                                    <h3 className='text-base font-semibold leading-6 text-gray-900'>
                                        Incomplete Enterprise Configurations
                                    </h3>
                                    <div className='mt-2'>
                                        <p className='text-sm text-gray-500'>
                                            You have {incompleteRows.length}{' '}
                                            incomplete enterprise configuration
                                            {incompleteRows.length > 1
                                                ? 's'
                                                : ''}{' '}
                                            with missing mandatory fields. These
                                            records won&apos;t be saved unless
                                            you complete all required fields
                                            (Enterprise, Product, and Services).
                                        </p>
                                        <p className='text-sm text-gray-500 mt-2'>
                                            Do you want to continue and lose
                                            these changes?
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                                <button
                                    type='button'
                                    className='inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto'
                                    onClick={() => {
                                        setShowNavigationWarning(false);
                                        if (pendingNavigation) {
                                            pendingNavigation();
                                            setPendingNavigation(null);
                                        }
                                    }}
                                >
                                    Continue & Lose Changes
                                </button>
                                <button
                                    type='button'
                                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto'
                                    onClick={() => {
                                        setShowNavigationWarning(false);
                                        setPendingNavigation(null);
                                    }}
                                >
                                    Stay & Complete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
                <div className='fixed inset-0 z-50 overflow-y-auto'>
                    <div className='flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'>
                        <div
                            className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
                            onClick={handleDeleteCancel}
                        ></div>

                        <motion.div
                            className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'
                            initial={{opacity: 0, scale: 0.9}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.9}}
                            transition={{duration: 0.2}}
                        >
                            <div className='sm:flex sm:items-start'>
                                <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                                    <svg
                                        className='h-6 w-6 text-red-600'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        strokeWidth='1.5'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                        />
                                    </svg>
                                </div>
                                <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
                                    <h3 className='text-base font-semibold leading-6 text-gray-900'>
                                        Delete Enterprise Configuration
                                    </h3>
                                    <div className='mt-2'>
                                        <p className='text-sm text-gray-500'>
                                            Are you sure you want to delete this
                                            enterprise configuration? This
                                            action cannot be undone and will
                                            permanently remove the
                                            enterprise-product-service linkage
                                            from the system.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                                <button
                                    type='button'
                                    disabled={deletingRow}
                                    className='inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto'
                                    onClick={handleDeleteConfirm}
                                >
                                    {deletingRow ? (
                                        <>
                                            <svg
                                                className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                                                fill='none'
                                                viewBox='0 0 24 24'
                                            >
                                                <circle
                                                    className='opacity-25'
                                                    cx='12'
                                                    cy='12'
                                                    r='10'
                                                    stroke='currentColor'
                                                    strokeWidth='4'
                                                ></circle>
                                                <path
                                                    className='opacity-75'
                                                    fill='currentColor'
                                                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                                ></path>
                                            </svg>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                                <button
                                    type='button'
                                    disabled={deletingRow}
                                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:w-auto'
                                    onClick={handleDeleteCancel}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
}
