'use client';

import {useState, useEffect, useRef} from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    ArrowsUpDownIcon,
    EyeSlashIcon,
    RectangleStackIcon,
} from '@heroicons/react/24/outline';
import type {Metadata} from 'next';
import {useMemo} from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import {
    api,
    fetchEnterprises,
    fetchProducts,
    fetchServices,
    saveEnterpriseConfigurationField,
    createEnterpriseConfigurationRecord,
    deleteEnterpriseConfigurationRecord,
} from '@/utils/api';
import AccountsTable, {AccountRow} from '@/components/AccountsTable';
import ReusableTableComponent from '@/components/reusable/ReusableTableComponent';
import enterpriseConfigurationTableConfig from '@/config/EnterpriseConfiguration_tableConfig';

interface Service {
    id: string;
    name: string;
    categories: string[]; // Changed to array for multiple categories
}

interface Enterprise {
    id: string;
    name: string;
    services: Service[];
}

// Interface for the enterprise_products_services table (matches backend response)
interface EnterpriseProductService {
    id: string;
    enterpriseId: string;
    productId: string;
    serviceId: string;
    enterpriseName?: string;
    productName?: string;
    serviceName?: string;
}

// Modular colorful animated trash can icon/button
function ToolbarTrashButton({
    onClick,
    bounce = false,
}: {
    onClick?: () => void;
    bounce?: boolean;
}) {
    const [over, setOver] = useState(false);
    return (
        <button
            id='enterprise-trash-target'
            type='button'
            onClick={onClick}
            aria-label='Trash'
            aria-dropeffect='move'
            className={`relative ml-3 inline-flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-200 group ${
                over
                    ? 'bg-rose-50 border-rose-200 ring-4 ring-rose-300/50 scale-105'
                    : 'bg-white border-light hover:shadow-md'
            } ${over ? 'drag-over' : ''}`}
            title='Trash'
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
                setOver(false);
                try {
                    const json = e.dataTransfer.getData('application/json');
                    if (!json) return;
                    const payload = JSON.parse(json);
                    const rowId = payload?.rowId as string | undefined;
                    if (!rowId) return;
                    const event = new CustomEvent('enterprise-row-drop-trash', {
                        detail: {rowId},
                    });
                    window.dispatchEvent(event);
                } catch {}
            }}
        >
            <svg
                viewBox='0 0 24 24'
                className={`w-5 h-5 text-primary/80 transition-colors duration-300 group-hover:text-primary group-hover:rotate-12 group-hover:scale-110 ${
                    bounce ? 'trash-bounce' : ''
                }`}
                fill='none'
                stroke='url(#trash-gradient)'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
            >
                <defs>
                    <linearGradient
                        id='trash-gradient'
                        x1='0'
                        y1='0'
                        x2='1'
                        y2='1'
                    >
                        <stop offset='0%' stopColor='#60A5FA' />
                        <stop offset='40%' stopColor='#10B981' />
                        <stop offset='75%' stopColor='#F59E0B' />
                        <stop offset='100%' stopColor='#8B5CF6' />
                    </linearGradient>
                </defs>
                <path d='M3 6h18' />
                <path className='trash-lid' d='M8 6l1-2h6l1 2' />
                <path d='M6 6l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13' />
                <path d='M10 10v7M14 10v7' />
            </svg>
            <span
                className={`pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-md bg-slate-900 text-white text-xs px-2 py-1 shadow-lg transition-opacity duration-200 ${
                    over ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
            >
                Drag a row here to delete
            </span>
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
        </button>
    );
}

export default function EnterpriseConfiguration() {
    console.log('🏗️ EnterpriseConfiguration component mounting...');
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [currentEnterprise, setCurrentEnterprise] =
        useState<Enterprise | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [viewEnterprise, setViewEnterprise] = useState<Enterprise | null>(
        null,
    );
    const [accounts, setAccounts] = useState<AccountRow[]>([]);
    const [addKey, setAddKey] = useState<number | null>(null);
    // Toolbar dropdown state (reuse Accounts toolbar UX)
    const [sortOpen, setSortOpen] = useState(false);
    const [hideOpen, setHideOpen] = useState(false);
    const [groupOpen, setGroupOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [sortColumn, setSortColumn] = useState<
        '' | 'enterpriseName' | 'productName'
    >('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const sortRef = useRef<HTMLDivElement>(null);
    const hideRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [visibleCols, setVisibleCols] = useState<
        Array<'enterpriseName' | 'productName' | 'services'>
    >(['enterpriseName', 'productName', 'services']);
    const [hideQuery, setHideQuery] = useState('');
    const [ActiveGroup, setActiveGroup] = useState<
        'None' | 'Enterprise' | 'Product'
    >('None');

    // New state for enterprise_products_services table
    const [enterpriseProductServices, setEnterpriseProductServices] = useState<
        EnterpriseProductService[]
    >([]);

    // New state for dropdown options
    const [enterpriseOptions, setEnterpriseOptions] = useState<any[]>([]);
    const [productOptions, setProductOptions] = useState<any[]>([]);
    const [serviceOptions, setServiceOptions] = useState<any[]>([]);

    // Auto-save functionality
    const [autoSaveQueue, setAutoSaveQueue] = useState<Map<string, any>>(
        new Map(),
    );
    const [isSaving, setIsSaving] = useState(false);

    // Table data management
    const [tableDataVersion, setTableDataVersion] = useState(0);

    // Debug: Log when state changes
    useEffect(() => {
        console.log(
            '🔄 enterpriseProductServices state changed:',
            enterpriseProductServices.length,
            'items',
        );
        if (enterpriseProductServices.length > 0) {
            console.log('📋 First item:', enterpriseProductServices[0]);
        }
    }, [enterpriseProductServices]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (sortOpen && sortRef.current && !sortRef.current.contains(t))
                setSortOpen(false);
            if (hideOpen && hideRef.current && !hideRef.current.contains(t))
                setHideOpen(false);
            if (groupOpen && groupRef.current && !groupRef.current.contains(t))
                setGroupOpen(false);
            if (
                showSearch &&
                searchContainerRef.current &&
                !searchContainerRef.current.contains(t)
            )
                setShowSearch(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [sortOpen, hideOpen, groupOpen, showSearch]);

    // Load dropdown options from APIs
    const loadDropdownOptions = async () => {
        try {
            console.log('🔄 Loading dropdown options...');

            // Try to fetch from APIs, but fallback to mock data if they fail
            let enterprisesData, productsData, servicesData;

            try {
                [enterprisesData, productsData, servicesData] =
                    await Promise.all([
                        fetchEnterprises(),
                        fetchProducts(),
                        fetchServices(),
                    ]);
            } catch (apiError) {
                console.warn(
                    '⚠️ API endpoints not available, using mock data:',
                    apiError,
                );
                // Mock data for testing
                enterprisesData = [
                    {id: '1', name: 'Enterprise A'},
                    {id: '2', name: 'Enterprise B'},
                    {id: '3', name: 'Enterprise C'},
                ];
                productsData = [
                    {id: '1', name: 'Product X'},
                    {id: '2', name: 'Product Y'},
                    {id: '3', name: 'Product Z'},
                ];
                servicesData = [
                    {id: '1', name: 'Service Alpha'},
                    {id: '2', name: 'Service Beta'},
                    {id: '3', name: 'Service Gamma'},
                ];
            }

            setEnterpriseOptions(enterprisesData || []);
            setProductOptions(productsData || []);
            setServiceOptions(servicesData || []);

            console.log('✅ Dropdown options loaded:', {
                enterprises: enterprisesData?.length || 0,
                products: productsData?.length || 0,
                services: servicesData?.length || 0,
            });
        } catch (error) {
            console.error('❌ Error loading dropdown options:', error);
            // Set empty arrays as fallback
            setEnterpriseOptions([]);
            setProductOptions([]);
            setServiceOptions([]);
        }
    };

    // Load data from the enterprise_products_services table
    const loadEnterpriseProductServices = async () => {
        console.log('🚀 loadEnterpriseProductServices function called!');
        try {
            setIsLoading(true);

            // Try to load from the new enterprise_products_services table first
            try {
                // First, get all relationships from the main endpoint (actual API response format)
                console.log(
                    '🌐 About to call API:',
                    '/api/enterprise-products-services',
                );
                const relationships = await api.get<
                    Array<{
                        id: number;
                        enterpriseId: number; // CamelCase from actual API
                        productId: number; // CamelCase from actual API
                        serviceId: number[]; // CamelCase from actual API
                    }>
                >('/api/enterprise-products-services');

                console.log('🔍 Raw API response:', relationships);

                console.log(
                    '🔄 Loaded enterprise-product-services from API:',
                    relationships,
                );

                // Convert array format to individual service relationships for backward compatibility
                const convertedRelationships: EnterpriseProductService[] = [];

                relationships?.forEach((r) => {
                    // Create one relationship entry for each service in the array
                    r.serviceId?.forEach((serviceId, index) => {
                        convertedRelationships.push({
                            id: `${r.id}-${index}`, // Unique ID for each service
                            enterpriseId: r.enterpriseId?.toString() || '',
                            productId: r.productId?.toString() || '',
                            serviceId: serviceId?.toString() || '',
                            enterpriseName: '',
                            productName: '',
                            serviceName: '',
                        });
                    });
                });

                console.log(
                    '✅ Converted to individual service relationships:',
                    convertedRelationships,
                );
                console.log(
                    '📝 About to set enterpriseProductServices state with:',
                    convertedRelationships?.length || 0,
                    'items',
                );
                setEnterpriseProductServices(convertedRelationships || []);
                console.log('✅ State set successfully!');

                if (relationships && relationships.length > 0) {
                    // Get unique IDs for fetching names
                    const enterpriseIds = Array.from(
                        new Set(
                            relationships
                                .map((r) => r.enterpriseId)
                                .filter((id) => id !== null),
                        ),
                    );
                    const productIds = Array.from(
                        new Set(
                            relationships
                                .map((r) => r.productId)
                                .filter((id) => id !== null),
                        ),
                    );
                    // Flatten service IDs from arrays
                    const serviceIds = Array.from(
                        new Set(
                            relationships
                                .flatMap((r) => r.serviceId || [])
                                .filter((id) => id !== null),
                        ),
                    );

                    // Fetch names from respective tables
                    console.log('🌐 About to call supporting APIs...');
                    const enterprises = await api.get<
                        Array<{id: number; name: string}>
                    >('/api/enterprises');
                    console.log('🏢 Enterprises API response:', enterprises);

                    const products = await api.get<
                        Array<{id: number; name: string}>
                    >('/api/products');
                    console.log('📦 Products API response:', products);

                    const services = await api.get<
                        Array<{id: number; name: string}>
                    >('/api/services');
                    console.log('🔧 Services API response:', services);

                    // Create lookup maps
                    const enterpriseMap = new Map(
                        enterprises.map((e) => [e.id, e.name]),
                    );
                    const productMap = new Map(
                        products.map((p) => [p.id, p.name]),
                    );
                    const serviceMap = new Map(
                        services.map((s) => [s.id, s.name]),
                    );

                    // Convert to the format expected by the table
                    const enterpriseProductMap = new Map<
                        string,
                        {name: string; products: Map<string, string[]>}
                    >();

                    // Note: Using convertedRelationships since we already converted from array format
                    console.log(
                        '🔍 About to resolve names for',
                        convertedRelationships.length,
                        'items',
                    );
                    console.log(
                        '🗂️ Enterprise map:',
                        Array.from(enterpriseMap.entries()),
                    );
                    console.log(
                        '📦 Product map:',
                        Array.from(productMap.entries()),
                    );
                    console.log(
                        '🔧 Service map:',
                        Array.from(serviceMap.entries()),
                    );

                    convertedRelationships.forEach((item, index) => {
                        const enterpriseId = item.enterpriseId || '';
                        const productId = item.productId || '';
                        const serviceId = item.serviceId || '';

                        console.log(
                            `🔍 Item ${index}: enterpriseId=${enterpriseId}, productId=${productId}, serviceId=${serviceId}`,
                        );

                        if (enterpriseId && productId && serviceId) {
                            const enterpriseName =
                                enterpriseMap.get(parseInt(enterpriseId)) || '';
                            const productName =
                                productMap.get(parseInt(productId)) || '';
                            const serviceName =
                                serviceMap.get(parseInt(serviceId)) || '';

                            console.log(
                                `✅ Resolved names: ${enterpriseName} / ${productName} / ${serviceName}`,
                            );

                            // Update the actual state item with resolved names
                            item.enterpriseName = enterpriseName;
                            item.productName = productName;
                            item.serviceName = serviceName;

                            if (!enterpriseProductMap.has(enterpriseId)) {
                                enterpriseProductMap.set(enterpriseId, {
                                    name: enterpriseName,
                                    products: new Map(),
                                });
                            }

                            const enterprise =
                                enterpriseProductMap.get(enterpriseId)!;
                            if (!enterprise.products.has(productId)) {
                                enterprise.products.set(productId, []);
                            }

                            const services =
                                enterprise.products.get(productId)!;
                            if (
                                serviceName &&
                                !services.includes(serviceName)
                            ) {
                                services.push(serviceName);
                            }
                        }
                    });

                    // Convert to Enterprise[] format for compatibility
                    const enterpriseArray: Enterprise[] = Array.from(
                        enterpriseProductMap.entries(),
                    ).map(([id, data]) => ({
                        id,
                        name: data.name,
                        services: Array.from(data.products.entries()).map(
                            ([productId, services]) => ({
                                id: productId,
                                name: productMap.get(parseInt(productId)) || '',
                                categories: services,
                            }),
                        ),
                    }));

                    setEnterprises(enterpriseArray);

                    // Update the state with resolved names
                    console.log(
                        '🔄 Updating enterpriseProductServices state with resolved names...',
                    );
                    setEnterpriseProductServices([...convertedRelationships]);

                    console.log(
                        'Loaded data from enterprise_products_services table with resolved names',
                    );
                } else {
                    setEnterprises([]);
                }
            } catch (error) {
                console.error('❌ Error in main data loading:', error);
                console.warn(
                    'New enterprise_products_services table not available, falling back to legacy enterprises:',
                    error,
                );

                // Fallback: Load from the existing enterprises endpoint
                const legacyData = await api.get<Enterprise[]>(
                    '/api/enterprises',
                );
                setEnterprises(
                    legacyData.map((e) => ({
                        ...e,
                        services: Array.isArray(e.services) ? e.services : [],
                    })),
                );
                console.log('Loaded data from legacy enterprises endpoint');
            }
        } catch (error) {
            console.error(
                '💥 FATAL ERROR in loadEnterpriseProductServices:',
                error,
            );
            setEnterpriseProductServices([]);
            setEnterprises([]);
        } finally {
            setIsLoading(false);
            console.log('🏁 loadEnterpriseProductServices completed');
        }
    };

    const loadAccounts = async () => {
        const list = await api.get<any[]>('/api/accounts');
        setAccounts(
            list.map<AccountRow>((a) => ({
                id: a.id || '',
                accountName: a.accountName,
                firstName: a.firstName || '',
                lastName: a.lastName || '',
                email: a.email || '',
                phone: a.phone || '',
                status: a.status || '',
                servicesCount: (a.services || []).length || 0,
                enterpriseName: a.enterpriseName || a.enterpriseId || '',
                servicesSummary: (a.services || [])
                    .map((s: any) => `${s.service} • ${s.category}`)
                    .join(','),
                productName: a.productName || '',
                serviceName: a.serviceName || '',
                address: {
                    addressLine1: a.address?.addressLine1 || '',
                    addressLine2: a.address?.addressLine2 || '',
                    country: a.address?.country || '',
                    state: a.address?.state || '',
                    city: a.address?.city || '',
                    pincode: a.address?.pincode || '',
                    ...(a.address?.id ? {id: a.address.id} : {}),
                },
                technical: {
                    username: a.technical?.username || '',
                    email: a.technical?.email || '',
                    ...(a.technical?.id ? {id: a.technical.id} : {}),
                },
                licenses: (a.licenses || []).map((s: any) => ({
                    id: s.id,
                    enterprise: a.enterpriseName || '',
                    product: s.product || '',
                    service: s.service || '',
                    licenseStart: s.licenseStart || s.start_date || '',
                    licenseEnd: s.licenseEnd || s.end_date || '',
                    users: s.users || s.num_users,
                    renewalNotice: !!(
                        s.renewalNotice || s.renewal_notice_days !== undefined
                    ),
                    noticeDays:
                        s.noticeDays !== undefined
                            ? s.noticeDays
                            : s.renewal_notice_days,
                })),
            })),
        );
    };

    useEffect(() => {
        console.log('🔄 Page loaded - starting data load...');
        console.log(
            '🎯 Current enterpriseProductServices length:',
            enterpriseProductServices.length,
        );
        loadDropdownOptions().catch((error) => {
            console.error('❌ Failed to load dropdown options:', error);
        });
        loadEnterpriseProductServices().catch((error) => {
            console.error(
                '❌ Failed to load enterprise product services:',
                error,
            );
        });
        loadAccounts().catch(() => {});
    }, []);

    // Auto-save functionality with debouncing
    const autoSaveChanges = useMemo(() => {
        const debounceTimeout = new Map<string, NodeJS.Timeout>();

        return (recordId: string, field: string, value: any) => {
            console.log(
                `🔄 Queuing auto-save for ${recordId}.${field}:`,
                value,
            );

            // Clear existing timeout for this field
            const timeoutKey = `${recordId}.${field}`;
            if (debounceTimeout.has(timeoutKey)) {
                clearTimeout(debounceTimeout.get(timeoutKey)!);
            }

            // Set new timeout
            const timeout = setTimeout(async () => {
                try {
                    setIsSaving(true);
                    console.log(`💾 Auto-saving ${recordId}.${field}:`, value);

                    await saveEnterpriseConfigurationField(
                        recordId,
                        field,
                        value,
                    );

                    console.log(
                        `✅ Successfully saved ${recordId}.${field} = ${value}`,
                    );
                } catch (error) {
                    console.error(
                        `❌ Failed to save ${recordId}.${field}:`,
                        error,
                    );
                    // You could show a toast notification here
                } finally {
                    setIsSaving(false);
                    debounceTimeout.delete(timeoutKey);
                }
            }, 1000); // 1 second debounce

            debounceTimeout.set(timeoutKey, timeout);
        };
    }, []);

    // Monitor data changes for auto-save
    const [previousData, setPreviousData] = useState<any[]>([]);

    useEffect(() => {
        // Skip on initial load
        if (previousData.length === 0 && enterpriseProductServices.length > 0) {
            setPreviousData([...enterpriseProductServices]);
            return;
        }

        // Detect changes and auto-save
        if (previousData.length > 0) {
            enterpriseProductServices.forEach((currentItem, index) => {
                const previousItem = previousData[index];
                if (previousItem && currentItem.id === previousItem.id) {
                    // Check each field for changes
                    const currentItemAny = currentItem as any;
                    const previousItemAny = previousItem as any;

                    Object.keys(currentItemAny).forEach((field) => {
                        if (
                            field !== 'id' &&
                            currentItemAny[field] !== previousItemAny[field]
                        ) {
                            console.log(
                                `🔍 Detected change in ${currentItem.id}.${field}:`,
                                previousItemAny[field],
                                '->',
                                currentItemAny[field],
                            );
                            autoSaveChanges(
                                currentItem.id,
                                field,
                                currentItemAny[field],
                            );
                        }
                    });
                }
            });

            // Update previous data
            setPreviousData([...enterpriseProductServices]);
        }
    }, [enterpriseProductServices, previousData, autoSaveChanges]);

    // Memoize the transformed data to prevent unnecessary re-renders
    const transformedTableData = useMemo(() => {
        console.log(
            '🎯 TRANSFORM: enterpriseProductServices state:',
            enterpriseProductServices,
        );

        const enterpriseProductMap = new Map<
            string,
            {
                enterpriseName: string;
                productName: string;
                services: string[];
            }
        >();

        enterpriseProductServices.forEach((eps) => {
            if (!eps.enterpriseName || !eps.productName) return;

            const key = `${eps.enterpriseName}-${eps.productName}`;
            if (!enterpriseProductMap.has(key)) {
                enterpriseProductMap.set(key, {
                    enterpriseName: eps.enterpriseName,
                    productName: eps.productName,
                    services: [],
                });
            }

            const existing = enterpriseProductMap.get(key)!;
            if (
                eps.serviceName &&
                !existing.services.includes(eps.serviceName)
            ) {
                existing.services.push(eps.serviceName);
            }
        });

        // Transform to ReusableTableComponent format
        const transformedData = Array.from(enterpriseProductMap.entries()).map(
            ([key, data]) => ({
                id: key,
                enterprise: data.enterpriseName,
                product: data.productName,
                service: data.services[0] || '', // First service for single-select
            }),
        );

        console.log(
            '✅ Transformed data for ReusableTableComponent:',
            transformedData,
        );

        // Apply search filter
        const searchLower = searchTerm.toLowerCase();
        const filteredData = transformedData.filter(
            (row) =>
                row.enterprise.toLowerCase().includes(searchLower) ||
                row.product.toLowerCase().includes(searchLower) ||
                row.service.toLowerCase().includes(searchLower),
        );

        return filteredData.length > 0
            ? filteredData
            : [
                  {
                      id: 'new-row',
                      enterprise: '',
                      product: '',
                      service: '',
                  },
              ];
    }, [enterpriseProductServices, searchTerm, tableDataVersion]);

    const filteredEnterprises = enterprises.filter((enterprise) =>
        enterprise.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const addEnterprise = async (enterprise: Enterprise) => {
        await api.post<Enterprise>('/api/enterprises', {
            name: enterprise.name,
            services: enterprise.services || [],
        });
        await loadEnterpriseProductServices();
        setShowCreateForm(false);
    };

    const deleteEnterprise = (id: string) => {
        setPendingDeleteId(id);
    };

    const [dropDelete, setDropDelete] = useState<{
        rowId: string;
        enterpriseId: string;
        isProduct: boolean;
        title: string;
    } | null>(null);
    const [trashBounce, setTrashBounce] = useState(false);

    useEffect(() => {
        const onDropEvent = (e: any) => {
            try {
                const rowId = e?.detail?.rowId as string | undefined;
                if (!rowId) return;
                const enterpriseId = String(rowId).split('-')[0];
                const isProduct = rowId.includes('-');
                const ent = enterprises.find(
                    (x) => String(x.id) === enterpriseId,
                );
                let title = 'Delete this record?';
                if (isProduct && ent) {
                    const prod = (ent.services || []).find(
                        (s) => `${ent.id}-${s.id}` === rowId,
                    );
                    title = `Delete product "${prod?.name ?? ''}" from "${
                        ent.name
                    }"?`;
                } else if (ent) {
                    title = `Delete enterprise "${ent.name}"?`;
                }
                setDropDelete({rowId, enterpriseId, isProduct, title});
            } catch {}
        };
        window.addEventListener('enterprise-row-drop-trash', onDropEvent);
        return () =>
            window.removeEventListener(
                'enterprise-row-drop-trash',
                onDropEvent,
            );
    }, [enterprises]);

    return (
        <div className='h-full bg-secondary flex flex-col page-with-ai-panel'>
            {/* Header Section */}
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <div className='flex items-center gap-3'>
                            <h1 className='text-xl font-bold text-primary'>
                                Enterprise Configuration
                            </h1>
                            {isSaving && (
                                <div className='flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm'>
                                    <div className='w-3 h-3 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin'></div>
                                    Auto-saving...
                                </div>
                            )}
                        </div>
                        <div className='flex items-center space-x-4 mt-1'>
                            <p className='text-sm text-secondary'>
                                Manage enterprise-wide products and services,
                                organize offerings per enterprise, and keep
                                configurations consistent across business units.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className='bg-card border-b border-light px-6 py-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        {/* Create New Enterprise Button */}
                        <button
                            onClick={() => {
                                // Add a new empty row to the parent state
                                const newItem: EnterpriseProductService = {
                                    id: `new-${Date.now()}`,
                                    enterpriseId: '',
                                    enterpriseName: '',
                                    productId: '',
                                    productName: '',
                                    serviceId: '',
                                    serviceName: '',
                                };

                                console.log(
                                    '➕ Adding new enterprise configuration item:',
                                    newItem,
                                );
                                setEnterpriseProductServices((prev) => [
                                    ...prev,
                                    newItem,
                                ]);
                                setTableDataVersion((prev) => prev + 1);

                                // Also try to trigger the table's add functionality as fallback
                                setTimeout(() => {
                                    const addItemButton =
                                        document.querySelector(
                                            '.add-task-input',
                                        );
                                    if (
                                        addItemButton &&
                                        addItemButton.parentElement
                                    ) {
                                        (
                                            addItemButton.parentElement as HTMLElement
                                        ).click();
                                    }
                                }, 100);
                            }}
                            className='inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                        >
                            <PlusIcon className='h-4 w-4' />
                            <span className='text-sm'>
                                Create New Enterprise
                            </span>
                        </button>
                        {/* Search chip + expandable input (hidden until clicked) */}
                        <div
                            ref={searchContainerRef}
                            className='flex items-center gap-2'
                        >
                            <button
                                onClick={() => setShowSearch((s) => !s)}
                                className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                            >
                                <MagnifyingGlassIcon className='h-4 w-4' />
                                <span className='text-sm'>Search</span>
                            </button>
                            <div
                                className={`relative overflow-hidden transition-all duration-300 ${
                                    showSearch
                                        ? 'w-64 opacity-100'
                                        : 'w-0 opacity-0'
                                }`}
                            >
                                <input
                                    ref={searchRef}
                                    type='text'
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape')
                                            setSearchTerm('');
                                    }}
                                    placeholder='Type to filter enterprises...'
                                    className='w-64 pr-7 px-3 py-2 text-sm rounded-md border border-light bg-white text-slate-700 placeholder-slate-400 shadow-sm'
                                />
                            </div>
                        </div>
                        {/* Filter placeholder */}
                        <button className='inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'>
                            <span className='text-sm'>Filter</span>
                        </button>
                        {/* Toolbar controls: mimic Accounts */}
                        <div className='flex items-center gap-3 ml-2'>
                            <div ref={sortRef} className='relative'>
                                <button
                                    className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                    title='Sort'
                                    onClick={() => setSortOpen((v) => !v)}
                                >
                                    <ArrowsUpDownIcon className='h-4 w-4' />
                                    <span className='text-sm'>Sort</span>
                                </button>
                                {sortOpen && (
                                    <div className='absolute left-0 top-full z-50 mt-2 w-[360px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                        <div className='px-4 py-2.5 border-b border-light text-sm font-semibold'>
                                            Sort by
                                        </div>
                                        <div className='p-3 space-y-2'>
                                            <div className='flex gap-2 items-center'>
                                                <select
                                                    value={sortColumn}
                                                    onChange={(e) =>
                                                        setSortColumn(
                                                            e.target
                                                                .value as any,
                                                        )
                                                    }
                                                    className='flex-1 bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                                >
                                                    <option value=''>
                                                        Choose column
                                                    </option>
                                                    <option value='enterpriseName'>
                                                        Enterprise
                                                    </option>
                                                    <option value='productName'>
                                                        Product
                                                    </option>
                                                </select>
                                                <div className='shrink-0 inline-flex rounded-md border border-light overflow-hidden'>
                                                    <button
                                                        className={`px-2.5 py-1.5 text-xs ${
                                                            sortDirection ===
                                                            'asc'
                                                                ? 'bg-slate-100 text-primary'
                                                                : 'bg-white text-secondary'
                                                        }`}
                                                        onClick={() =>
                                                            setSortDirection(
                                                                'asc',
                                                            )
                                                        }
                                                    >
                                                        Asc
                                                    </button>
                                                    <button
                                                        className={`px-2.5 py-1.5 text-xs border-l border-light ${
                                                            sortDirection ===
                                                            'desc'
                                                                ? 'bg-slate-100 text-primary'
                                                                : 'bg-white text-secondary'
                                                        }`}
                                                        onClick={() =>
                                                            setSortDirection(
                                                                'desc',
                                                            )
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
                            <div ref={hideRef} className='relative'>
                                <button
                                    className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                    onClick={() => setHideOpen((v) => !v)}
                                >
                                    <EyeSlashIcon className='h-4 w-4' />
                                    <span className='text-sm'>Hide</span>
                                </button>
                                {hideOpen && (
                                    <div className='absolute left-0 top-full z-50 mt-2 w-[360px] rounded-lg bg-card text-primary shadow-xl border border-light'>
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
                                                {(
                                                    [
                                                        'enterpriseName',
                                                        'productName',
                                                        'services',
                                                    ] as const
                                                )
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
                                                                'enterpriseName'
                                                                    ? 'Enterprise'
                                                                    : c ===
                                                                      'productName'
                                                                    ? 'Product'
                                                                    : c}
                                                            </span>
                                                            <input
                                                                type='checkbox'
                                                                checked={visibleCols.includes(
                                                                    c,
                                                                )}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const checked =
                                                                        e.target
                                                                            .checked;
                                                                    setVisibleCols(
                                                                        (
                                                                            prev,
                                                                        ) => {
                                                                            if (
                                                                                checked
                                                                            )
                                                                                return Array.from(
                                                                                    new Set(
                                                                                        [
                                                                                            ...prev,
                                                                                            c,
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
                            <div ref={groupRef} className='relative'>
                                <button
                                    className='relative inline-flex items-center gap-2 px-2 py-2 rounded text-slate-600 hover:text-slate-900'
                                    onClick={() => setGroupOpen((v) => !v)}
                                >
                                    <RectangleStackIcon className='h-4 w-4' />
                                    <span className='text-sm'>Group by</span>
                                </button>
                                {groupOpen && (
                                    <div className='absolute left-0 top-full z-50 mt-2 w-[360px] rounded-lg bg-card text-primary shadow-xl border border-light'>
                                        <div className='px-4 py-2.5 border-b border-light text-sm font-semibold'>
                                            Group by
                                        </div>
                                        <div className='p-3'>
                                            <select
                                                value={ActiveGroup}
                                                onChange={(e) =>
                                                    setActiveGroup(
                                                        e.target.value as any,
                                                    )
                                                }
                                                className='w-full bg-white border border-light rounded-md px-2.5 py-1.5 text-sm'
                                            >
                                                <option>None</option>
                                                <option>Enterprise</option>
                                                <option>Product</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='flex items-center'>
                        <ToolbarTrashButton
                            onClick={() => {}}
                            bounce={trashBounce}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className='flex-1 p-6'>
                <div className='space-y-6 max-w-full overflow-hidden'>
                    <style jsx>{`
                        @keyframes trash-bounce-keyframes {
                            0%,
                            100% {
                                transform: translateY(0);
                            }
                            30% {
                                transform: translateY(-6%);
                            }
                            60% {
                                transform: translateY(0);
                            }
                        }
                        .trash-bounce {
                            animation: trash-bounce-keyframes 0.6s ease-out 1;
                        }
                    `}</style>
                    <ConfirmModal
                        open={!!dropDelete}
                        title='Confirm delete'
                        message={dropDelete?.title || 'Delete this item?'}
                        onCancel={() => setDropDelete(null)}
                        onConfirm={async () => {
                            try {
                                if (!dropDelete) return;
                                const {rowId, enterpriseId, isProduct} =
                                    dropDelete;
                                if (isProduct) {
                                    // Delete from enterprise_products_services table
                                    await api.del(
                                        `/api/enterprise-products-services/${rowId}`,
                                    );
                                } else {
                                    // Delete all records for this enterprise
                                    await api.del(
                                        `/api/enterprise-products-services/enterprise/${enterpriseId}`,
                                    );
                                }
                                setDropDelete(null);
                                setTrashBounce(true);
                                setTimeout(() => setTrashBounce(false), 700);
                                await loadEnterpriseProductServices();
                            } catch {
                                setDropDelete(null);
                            }
                        }}
                    />
                    <ReusableTableComponent
                        key={`enterprise-table-${tableDataVersion}`}
                        config={
                            (() => {
                                // Clone the base configuration and add auto-save functionality
                                const configWithData = {
                                    ...enterpriseConfigurationTableConfig,

                                    // Add auto-save configuration
                                    autoSave: {
                                        ...enterpriseConfigurationTableConfig.autoSave,
                                        onFieldChange: (
                                            recordId: string,
                                            field: string,
                                            value: any,
                                        ) => {
                                            autoSaveChanges(
                                                recordId,
                                                field,
                                                value,
                                            );
                                        },
                                    },

                                    // Update dropdown options dynamically
                                    mainTableColumns:
                                        enterpriseConfigurationTableConfig.mainTableColumns.map(
                                            (col) => {
                                                if (col.id === 'enterprise') {
                                                    const apiOptions =
                                                        enterpriseOptions.map(
                                                            (item) => item.name,
                                                        );
                                                    // Use API options if available, otherwise keep original options
                                                    const finalOptions =
                                                        apiOptions.length > 0
                                                            ? apiOptions
                                                            : col.options;
                                                    console.log(
                                                        '🔧 Enterprise options for table:',
                                                        {
                                                            enterpriseOptions,
                                                            apiOptions,
                                                            finalOptions,
                                                            originalOptions:
                                                                col.options,
                                                        },
                                                    );
                                                    return {
                                                        ...col,
                                                        options: finalOptions,
                                                    };
                                                }
                                                if (col.id === 'product') {
                                                    const apiOptions =
                                                        productOptions.map(
                                                            (item) => item.name,
                                                        );
                                                    const finalOptions =
                                                        apiOptions.length > 0
                                                            ? apiOptions
                                                            : col.options;
                                                    return {
                                                        ...col,
                                                        options: finalOptions,
                                                    };
                                                }
                                                if (col.id === 'service') {
                                                    const apiOptions =
                                                        serviceOptions.map(
                                                            (item) => item.name,
                                                        );
                                                    const finalOptions =
                                                        apiOptions.length > 0
                                                            ? apiOptions
                                                            : col.options;
                                                    return {
                                                        ...col,
                                                        options: finalOptions,
                                                    };
                                                }
                                                return col;
                                            },
                                        ),

                                    // Use memoized transformed data
                                    initialData: transformedTableData,
                                };

                                return configWithData;
                            })() as any
                        }
                    />
                </div>
            </div>
            <ConfirmModal
                open={pendingDeleteId !== null}
                title='Confirm delete'
                message={`Delete ${(() => {
                    const t = enterprises.find((e) => e.id === pendingDeleteId);
                    return t ? t.name : 'this enterprise';
                })()}?\n\nThis action can't be undone. The item will be permanently removed.`}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={async () => {
                    if (!pendingDeleteId) return;
                    await api.del(`/api/enterprises/${pendingDeleteId}`);
                    await loadEnterpriseProductServices();
                    setPendingDeleteId(null);
                }}
            />

            {/* Inline add-row is used instead of modal create form */}

            {showEditModal && currentEnterprise && (
                <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
                    <div className='bg-card rounded-xl shadow-xl w-full max-w-2xl'>
                        <div className='px-6 py-4 border-b border-light'>
                            <h3 className='text-lg font-bold text-primary'>
                                Edit Enterprise
                            </h3>
                        </div>
                        <div className='p-6 space-y-6'>
                            {/* Enterprise Name */}
                            <div>
                                <label className='block text-sm font-semibold text-primary mb-2'>
                                    Enterprise Name *
                                </label>
                                <input
                                    type='text'
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    className='block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-card text-primary placeholder-secondary transition-all duration-200 border-light focus:border-brand focus:ring-primary/20'
                                />
                            </div>
                            {/* Products editor (simple list for now) */}
                            <div>
                                <div className='flex items-center justify-between mb-3'>
                                    <label className='block text-sm font-semibold text-primary'>
                                        Products
                                    </label>
                                </div>
                                <div className='space-y-2'>
                                    {(currentEnterprise.services || []).map(
                                        (prod, idx) => (
                                            <div
                                                key={idx}
                                                className='flex items-center gap-2'
                                            >
                                                <input
                                                    type='text'
                                                    value={prod.name}
                                                    onChange={(e) => {
                                                        const copy = [
                                                            ...(currentEnterprise.services ||
                                                                []),
                                                        ];
                                                        copy[idx] = {
                                                            ...copy[idx],
                                                            name: e.target
                                                                .value,
                                                        };
                                                        setCurrentEnterprise({
                                                            ...currentEnterprise,
                                                            services: copy,
                                                        });
                                                    }}
                                                    className='flex-1 px-3 py-2 border rounded-lg bg-card border-light'
                                                />
                                                <button
                                                    onClick={() => {
                                                        const copy = (
                                                            currentEnterprise.services ||
                                                            []
                                                        ).filter(
                                                            (_, i) => i !== idx,
                                                        );
                                                        setCurrentEnterprise({
                                                            ...currentEnterprise,
                                                            services: copy,
                                                        });
                                                    }}
                                                    className='px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200'
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className='px-6 py-4 border-t border-light flex justify-end gap-2'>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setCurrentEnterprise(null);
                                }}
                                className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await api.put(
                                        `/api/enterprises/${currentEnterprise.id}`,
                                        {
                                            name:
                                                editName.trim() ||
                                                currentEnterprise.name,
                                            services:
                                                currentEnterprise.services ||
                                                [],
                                        },
                                    );
                                    setShowEditModal(false);
                                    setCurrentEnterprise(null);
                                    await loadEnterpriseProductServices();
                                }}
                                className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark rounded-lg'
                            >
                                Save changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Removed legacy card/grid previews and view modal to keep a strict tabular UX */}
        </div>
    );
}
function EnterpriseAccountsPanel({
    enterprise,
    accounts,
    setAccounts,
    onBack,
}: {
    enterprise: Enterprise;
    accounts: AccountRow[];
    setAccounts: (rows: AccountRow[]) => void;
    onBack: () => void;
}) {
    const rows = accounts.filter(
        (a) =>
            (a.enterpriseName || '').toLowerCase() ===
            enterprise.name.toLowerCase(),
    );
    return (
        <div className='space-y-3'>
            <div className='flex items-center justify-between mb-2'>
                <div className='text-sm text-secondary'>
                    Accounts under
                    <span className='font-semibold text-primary ml-1'>
                        {enterprise.name}
                    </span>
                </div>
                <button
                    className='px-3 py-1.5 text-sm rounded-md border border-light hover:bg-tertiary'
                    onClick={onBack}
                >
                    Back
                </button>
            </div>
            <AccountsTable
                title='Enterprise Accounts'
                rows={rows}
                onEdit={() => {}}
                onDelete={() => {}}
                groupByExternal='none'
                onGroupByChange={() => {}}
                hideControls
                visibleColumns={[
                    'contact',
                    'accountName',
                    'country',
                    'addressLine1',
                    'addressLine2',
                    'city',
                    'state',
                    'pincode',
                ]}
                highlightQuery={''}
                onQuickAddRow={async () => {
                    const newId = `tmp-${Date.now()}`;
                    const blank: AccountRow = {
                        id: newId,
                        accountName: '',
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        status: 'Active',
                        servicesCount: 0,
                        enterpriseName: enterprise.name,
                        productName: '',
                        serviceName: '',
                        address: {},
                        technical: {},
                        licenses: [],
                    } as any;
                    setAccounts([...accounts, blank]);
                    setTimeout(() => {
                        const el = document.querySelector(
                            `[data-account-id="${newId}"]`,
                        );
                        if (el)
                            el.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                            });
                    }, 50);
                }}
            />
        </div>
    );
}

interface CreateEnterpriseFormProps {
    onSave: (enterprise: Enterprise) => void;
    onCancel: () => void;
}

function CreateEnterpriseForm({onSave, onCancel}: CreateEnterpriseFormProps) {
    const [enterpriseName, setEnterpriseName] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFormValid = enterpriseName.trim().length > 0;

    const handleSave = async () => {
        if (!isFormValid || isSubmitting) return;
        setIsSubmitting(true);
        try {
            // Persist via API (backend will write to Postgres when STORAGE_MODE=postgres)
            const payload = {
                name: enterpriseName.trim(),
                services: services.map((s) => ({
                    name: s.name,
                    categories: s.categories,
                })),
            };

            // Use the API utility instead of direct fetch
            const created = await api.post<{id: string; name: string}>(
                '/api/enterprises',
                payload,
            );

            const newEnterprise: Enterprise = {
                id: created?.id || Date.now().toString(),
                name: payload.name,
                services: services,
            };
            onSave(newEnterprise);
        } catch (e) {
            console.error('Failed to save enterprise', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='max-w-4xl mx-auto'>
            <div className='bg-card rounded-xl border border-light shadow-lg'>
                {/* Form Header */}
                <div className='px-6 py-4 border-b border-light bg-gradient-to-r from-slate-50 to-white rounded-t-xl'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-lg font-bold text-primary'>
                            Create New Enterprise
                        </h2>
                        <div className='flex space-x-3'>
                            <button
                                onClick={onCancel}
                                className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg transition-colors duration-200'
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!isFormValid || isSubmitting}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    isFormValid && !isSubmitting
                                        ? 'text-inverse bg-primary hover:bg-primary-dark'
                                        : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                                }`}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className='p-6 space-y-6'>
                    {/* Enterprise Name */}
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Enterprise Name *
                        </label>
                        <input
                            type='text'
                            value={enterpriseName}
                            onChange={(e) => setEnterpriseName(e.target.value)}
                            placeholder='Enter enterprise name'
                            className={`block w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-card text-primary placeholder-secondary transition-all duration-200 ${
                                enterpriseName.trim().length > 0
                                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                    : 'border-light focus:border-brand focus:ring-primary/20'
                            }`}
                        />
                        {/* Removed inline success message */}
                    </div>

                    {/* Products Section */}
                    <div>
                        <div className='flex items-center justify-between mb-4'>
                            <label className='block text-sm font-semibold text-primary'>
                                Products
                            </label>
                            <button
                                onClick={() => setShowAddServiceModal(true)}
                                className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-brand bg-primary-light hover:bg-primary-light/80 rounded-lg transition-colors duration-200'
                            >
                                <PlusIcon className='h-4 w-4 mr-1' />
                                Add Product
                            </button>
                        </div>

                        {/* Products List */}
                        <div className='min-h-[200px] border-2 border-dashed border-light rounded-lg p-4'>
                            {services.length === 0 ? (
                                <div className='flex items-center justify-center h-full text-center py-8'>
                                    <div>
                                        <div className='w-12 h-12 bg-tertiary rounded-full flex items-center justify-center mx-auto mb-3'>
                                            <svg
                                                className='w-6 h-6 text-secondary'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                                                />
                                            </svg>
                                        </div>
                                        <p className='text-secondary text-sm'>
                                            No products added yet
                                        </p>
                                        <p className='text-tertiary text-xs mt-1'>
                                            Click &ldquo;Add Product&rdquo; to
                                            get started
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                                    {services.map((service) => (
                                        <ServiceCard
                                            key={service.id}
                                            service={service}
                                            onEdit={() => {}}
                                            onDelete={(id) => {
                                                setServices(
                                                    services.filter(
                                                        (s) => s.id !== id,
                                                    ),
                                                );
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Product Modal */}
                {showAddServiceModal && (
                    <AddServiceModal
                        onSave={(service) => {
                            setServices([...services, service]);
                            setShowAddServiceModal(false);
                        }}
                        onCancel={() => setShowAddServiceModal(false)}
                    />
                )}
            </div>
        </div>
    );
}

interface AddServiceModalProps {
    onSave: (service: Service) => void;
    onCancel: () => void;
}

function AddServiceModal({onSave, onCancel}: AddServiceModalProps) {
    const [serviceName, setServiceName] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [showCategories, setShowCategories] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');

    // Fallback list used only if backend not reachable; otherwise options are fetched
    const serviceCategories = [
        'DevOps',
        'Integration',
        'Extension',
        'Analytics',
        'Security',
        'Collaboration',
        'Storage',
        'Monitoring',
    ];

    const handleSave = () => {
        if (serviceName.trim() && selectedCategories.length > 0) {
            const newService: Service = {
                id: Date.now().toString(),
                name: serviceName.trim(),
                categories: selectedCategories,
            };
            onSave(newService);
        }
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category],
        );
    };

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-card rounded-xl shadow-xl max-w-md w-full'>
                <div className='px-6 py-4 border-b border-light'>
                    <h3 className='text-lg font-bold text-primary'>
                        Add New Product
                    </h3>
                </div>

                <div className='p-6 space-y-4'>
                    {/* Product Name */}
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Product Name *
                        </label>
                        <div className='relative flex items-center gap-2'>
                            <input
                                type='text'
                                value={serviceName}
                                onChange={(e) => {
                                    setServiceName(e.target.value);
                                    // If user edits after selecting, keep suggestions eligible to reopen
                                }}
                                placeholder='Search or create a product'
                                className='block w-full px-3 py-2.5 border border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand bg-card text-primary placeholder-secondary'
                            />
                            <InlineCreateProduct
                                onCreated={(name) => {
                                    setServiceName(name);
                                    setSelectedProduct(name);
                                }}
                            />
                            {/* Suggestions dropdown */}
                            <ProductSuggestions
                                query={serviceName}
                                selected={selectedProduct}
                                onSelect={(n) => {
                                    setServiceName(n);
                                    setSelectedProduct(n);
                                }}
                            />
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <label className='block text-sm font-semibold text-primary mb-2'>
                            Products *
                        </label>

                        {/* Selected Categories Display */}
                        <div className='mb-3'>
                            {selectedCategories.length > 0 ? (
                                <div className='flex flex-wrap gap-2'>
                                    {selectedCategories.map((category) => (
                                        <span
                                            key={category}
                                            className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-light text-brand border border-primary/20'
                                        >
                                            {category}
                                            <button
                                                onClick={() =>
                                                    toggleCategory(category)
                                                }
                                                className='ml-2 text-brand hover:text-red-600'
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className='text-sm text-secondary italic'>
                                    No services selected
                                </div>
                            )}
                        </div>

                        <div className='relative'>
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() =>
                                        setShowCategories(!showCategories)
                                    }
                                    className='w-full px-3 py-2.5 border border-light rounded-lg bg-card text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-brand relative'
                                >
                                    Select products
                                    <svg
                                        className='absolute right-3 top-3 h-5 w-5 text-secondary'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M19 9l-7 7-7-7'
                                        />
                                    </svg>
                                </button>
                                <InlineCreateService
                                    onCreated={(name) =>
                                        setSelectedCategories((prev) =>
                                            Array.from(
                                                new Set([...prev, name]),
                                            ),
                                        )
                                    }
                                />
                            </div>

                            {showCategories && (
                                <div className='absolute z-10 w-full mt-1 bg-card border border-light rounded-lg shadow-lg max-h-60 overflow-auto'>
                                    <ServiceOptions
                                        onPick={(name) => toggleCategory(name)}
                                        selected={selectedCategories}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Add More Product Button */}
                        <button
                            onClick={() => setShowCategories(!showCategories)}
                            className='mt-2 text-sm text-brand hover:text-brand-dark font-medium'
                        >
                            + Add new product
                        </button>
                    </div>
                </div>

                <div className='px-6 py-4 border-t border-light flex justify-end space-x-3'>
                    <button
                        onClick={onCancel}
                        className='px-4 py-2 text-sm font-medium text-secondary bg-tertiary hover:bg-slate-200 rounded-lg transition-colors duration-200'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={
                            !serviceName.trim() ||
                            selectedCategories.length === 0
                        }
                        className='px-4 py-2 text-sm font-medium text-inverse bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200'
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ServiceCardProps {
    service: Service;
    onEdit: () => void;
    onDelete: (id: string) => void;
}

function ServiceCard({service, onEdit, onDelete}: ServiceCardProps) {
    return (
        <div className='relative overflow-hidden group rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:ring-2 hover:ring-indigo-300/50 h-56'>
            {/* Background Pattern */}
            <div className='pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/50 blur-2xl group-hover:scale-110 group-hover:opacity-90 transition-all duration-500'></div>

            {/* Header with Product Name and Actions */}
            <div className='flex items-start justify-between mb-6 relative z-10'>
                <div className='flex-1'>
                    <h4 className='text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors duration-200'>
                        {service.name}
                    </h4>
                    <p className='text-sm text-slate-500 font-medium'>
                        Product
                    </p>
                </div>

                {/* Action Buttons (always visible) */}
                <div className='flex space-x-2'>
                    <button
                        onClick={onEdit}
                        className='rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md'
                        title='Edit service'
                    >
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(service.id)}
                        className='rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md'
                        title='Delete service'
                    >
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Services Tags */}
            <div className='flex flex-wrap gap-2 mb-6 overflow-hidden'>
                {service.categories.map((category, index) => {
                    const palette = [
                        'bg-indigo-100 text-indigo-800 border-indigo-200',
                        'bg-emerald-100 text-emerald-800 border-emerald-200',
                        'bg-amber-100 text-amber-800 border-amber-200',
                        'bg-sky-100 text-sky-800 border-sky-200',
                        'bg-purple-100 text-purple-800 border-purple-200',
                    ];
                    const cls = palette[index % palette.length];
                    return (
                        <span
                            key={index}
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${cls}`}
                        >
                            {category}
                        </span>
                    );
                })}
            </div>

            {/* Footer with Status */}
            <div className='flex items-center justify-between pt-4 border-t border-slate-100'>
                <div className='flex items-center space-x-2'>
                    <div className='w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-sm animate-pulse'></div>
                    <span className='text-sm text-slate-600 font-medium'>
                        Active
                    </span>
                </div>
                <div className='flex items-center space-x-1'>
                    <svg
                        className='w-4 h-4 text-slate-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                        />
                    </svg>
                    <span className='text-sm text-slate-500 font-medium'>
                        {service.categories.length}{' '}
                        {service.categories.length === 1
                            ? 'service'
                            : 'services'}
                    </span>
                </div>
            </div>
        </div>
    );
}

interface EnterpriseCardProps {
    enterprise: Enterprise;
    onEdit: () => void;
    onView: () => void;
    onDelete: (id: string) => void;
}

function EnterpriseCard({
    enterprise,
    onEdit,
    onView,
    onDelete,
}: EnterpriseCardProps) {
    return (
        <div className='relative overflow-hidden group rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-8 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:ring-2 hover:ring-indigo-300/50 h-60'>
            {/* Background Decoration */}
            <div className='pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/50 blur-2xl group-hover:scale-110 group-hover:opacity-90 transition-all duration-500'></div>

            <div className='flex items-start justify-between mb-6 relative z-10'>
                <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                        <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
                            <svg
                                className='w-5 h-5 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className='font-bold text-slate-900 text-xl group-hover:text-indigo-600 transition-colors duration-200'>
                                {enterprise.name}
                            </h3>
                            <p className='text-sm text-slate-500 font-medium'>
                                {enterprise.services.length} product
                                {enterprise.services.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>
                <div className='flex space-x-2'>
                    <button
                        onClick={onView}
                        className='rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 hover:shadow-md'
                        title='View enterprise'
                    >
                        <svg
                            className='w-4 h-4'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                        >
                            <path
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                            <path
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                            />
                        </svg>
                    </button>
                    <button
                        onClick={onEdit}
                        className='rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md'
                        title='Edit enterprise'
                    >
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                            />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDelete(enterprise.id)}
                        className='rounded-xl border border-transparent p-2.5 text-slate-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md'
                        title='Delete enterprise'
                    >
                        <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Products Preview */}
            <div className='space-y-3'>
                {enterprise.services.slice(0, 3).map((service) => (
                    <div
                        key={service.id}
                        className='flex items-start space-x-3'
                    >
                        <div className='w-2 h-2 bg-brand rounded-full mt-1'></div>
                        <div className='flex-1'>
                            <span className='text-sm text-primary font-medium block'>
                                {service.name}
                            </span>
                            <div className='flex flex-wrap gap-1 mt-1'>
                                {service.categories
                                    .slice(0, 2)
                                    .map((category, index) => {
                                        const palette = [
                                            'bg-indigo-100 text-indigo-800',
                                            'bg-emerald-100 text-emerald-800',
                                            'bg-amber-100 text-amber-800',
                                            'bg-sky-100 text-sky-800',
                                            'bg-purple-100 text-purple-800',
                                        ];
                                        const cls =
                                            palette[index % palette.length];
                                        return (
                                            <span
                                                key={index}
                                                className={`text-xs px-2 py-0.5 rounded-full ${cls}`}
                                            >
                                                {category}
                                            </span>
                                        );
                                    })}
                                {service.categories.length > 2 && (
                                    <span className='text-xs text-tertiary'>
                                        +{service.categories.length - 2} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {enterprise.services.length > 3 && (
                    <button
                        onClick={onView}
                        className='text-left text-xs text-brand pl-5 pt-1 border-t border-slate-100 hover:underline'
                    >
                        +{enterprise.services.length - 3} more
                    </button>
                )}
            </div>
        </div>
    );
}

function ViewEnterpriseModal({
    enterprise,
    onClose,
    onEdit,
}: {
    enterprise: Enterprise;
    onClose: () => void;
    onEdit: () => void;
}) {
    return (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
            <div className='bg-card rounded-xl shadow-xl w-full max-w-3xl'>
                <div className='px-6 py-4 border-b border-light flex items-center justify-between'>
                    <h3 className='text-lg font-bold text-primary'>
                        Enterprise Details
                    </h3>
                    <div className='flex gap-2'>
                        <button
                            onClick={onEdit}
                            className='px-3 py-1.5 text-sm rounded-lg bg-primary text-inverse hover:bg-primary-dark'
                        >
                            Edit
                        </button>
                        <button
                            onClick={onClose}
                            className='px-3 py-1.5 text-sm rounded-lg bg-tertiary text-primary hover:bg-slate-200'
                        >
                            Close
                        </button>
                    </div>
                </div>
                <div className='p-6 space-y-4'>
                    <div>
                        <div className='text-sm text-secondary'>Enterprise</div>
                        <div className='text-lg font-semibold text-primary'>
                            {enterprise.name}
                        </div>
                    </div>
                    <div>
                        <div className='text-sm text-secondary mb-2'>
                            Products
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            {(enterprise.services || []).map((s) => (
                                <div
                                    key={s.id}
                                    className='rounded-lg border border-light p-3'
                                >
                                    <div className='font-medium text-primary'>
                                        {s.name}
                                    </div>
                                    <div className='mt-1 flex flex-wrap gap-1'>
                                        {(s.categories || []).map((c, i) => {
                                            const palette = [
                                                'bg-indigo-100 text-indigo-800',
                                                'bg-emerald-100 text-emerald-800',
                                                'bg-amber-100 text-amber-800',
                                                'bg-sky-100 text-sky-800',
                                                'bg-purple-100 text-purple-800',
                                            ];
                                            const cls =
                                                palette[i % palette.length];
                                            return (
                                                <span
                                                    key={i}
                                                    className={`text-xs px-2 py-0.5 rounded-full ${cls}`}
                                                >
                                                    {c}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProductSuggestions({
    query,
    selected,
    onSelect,
}: {
    query: string;
    selected?: string;
    onSelect: (name: string) => void;
}) {
    const [options, setOptions] = useState<{id: string; name: string}[]>([]);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        let Active = true;
        (async () => {
            const q = query.trim();
            if (!q) {
                setOptions([]);
                setOpen(false);
                return;
            }
            // If the typed value equals the selected product, keep the list closed
            if (selected && q === selected) {
                setOptions([]);
                setOpen(false);
                return;
            }
            try {
                const list = await api.get<{id: string; name: string}[]>(
                    `/api/products?search=${encodeURIComponent(q)}`,
                );
                if (!Active) return;
                setOptions(list || []);
                setOpen((list || []).length > 0 && q !== (selected || ''));
            } catch {
                if (!Active) return;
                setOptions([]);
                setOpen(false);
            }
        })();
        return () => {
            Active = false;
        };
    }, [query, selected]);
    if (!open) return null;
    return (
        <div className='absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-light rounded-lg shadow-xl max-h-56 overflow-auto min-w-[200px]'>
            {options.map((o) => (
                <button
                    key={o.id}
                    onClick={() => {
                        onSelect(o.name);
                        setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-tertiary/50 text-primary ${
                        selected === o.name ? 'bg-indigo-50' : ''
                    }`}
                >
                    {o.name}
                </button>
            ))}
        </div>
    );
}

function ServiceOptions({
    selected,
    onPick,
}: {
    selected: string[];
    onPick: (name: string) => void;
}) {
    const [options, setOptions] = useState<{id: string; name: string}[]>([]);
    useEffect(() => {
        (async () => {
            try {
                const list = await api.get<{id: string; name: string}[]>(
                    `/api/services`,
                );
                setOptions(list || []);
            } catch {
                setOptions([]);
            }
        })();
    }, []);
    return (
        <div>
            {options.map((opt) => (
                <label
                    key={opt.id}
                    className='flex items-center px-3 py-2 hover:bg-tertiary/50 transition-colors duration-200 cursor-pointer'
                >
                    <input
                        type='checkbox'
                        checked={selected.includes(opt.name)}
                        onChange={() => onPick(opt.name)}
                        className='mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded'
                    />
                    <span className='text-primary'>{opt.name}</span>
                </label>
            ))}
        </div>
    );
}

function InlineCreateService({onCreated}: {onCreated: (name: string) => void}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [pulse, setPulse] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
                setError(null);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    const handleCreateService = async () => {
        const nm = name.trim();
        if (!nm) return;

        setIsLoading(true);
        setError(null);

        try {
            const created = await api.post<{
                id: string;
                name: string;
            }>('/api/services', {name: nm});
            onCreated(created.name);
            setName('');
            setOpen(false);
            setPulse(true);
            setTimeout(() => setPulse(false), 500);
        } catch (error) {
            console.error('Failed to create service:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to create service',
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='relative' ref={dropdownRef}>
            <button
                type='button'
                onClick={() => setOpen((v) => !v)}
                className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-inverse hover:bg-primary-dark transition transform hover:scale-105 Active:scale-95 ${
                    pulse ? 'ring-2 ring-primary/40' : ''
                }`}
                title='Create service'
            >
                <svg
                    className='w-5 h-5'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                >
                    <path d='M12 5v14M5 12h14' />
                </svg>
            </button>
            {open && (
                <div className='absolute right-0 mt-2 z-50 bg-card border border-light rounded-lg shadow-xl p-3 min-w-[250px]'>
                    <div className='space-y-3'>
                        <input
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateService();
                                }
                                if (e.key === 'Escape') {
                                    setOpen(false);
                                    setError(null);
                                }
                            }}
                            placeholder='Enter service name'
                            className='w-full px-3 py-2 text-sm rounded-md border border-light focus:outline-none focus:ring-2 focus:ring-primary/20'
                            disabled={isLoading}
                        />

                        {error && (
                            <div className='text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200'>
                                {error}
                            </div>
                        )}

                        <div className='flex items-center gap-2'>
                            <button
                                onClick={handleCreateService}
                                disabled={isLoading || !name.trim()}
                                className='flex-1 px-3 py-2 text-xs rounded-md bg-primary text-inverse hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {isLoading ? 'Creating...' : 'Add Service'}
                            </button>
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    setError(null);
                                }}
                                className='px-3 py-2 text-xs rounded-md border border-light text-secondary hover:bg-slate-50'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InlineCreateProduct({onCreated}: {onCreated: (name: string) => void}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [pulse, setPulse] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
                setError(null);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    const handleCreateProduct = async () => {
        const nm = name.trim();
        if (!nm) return;

        setIsLoading(true);
        setError(null);

        try {
            const created = await api.post<{
                id: string;
                name: string;
            }>('/api/products', {name: nm});
            onCreated(created.name);
            setName('');
            setOpen(false);
            setPulse(true);
            setTimeout(() => setPulse(false), 500);
        } catch (error) {
            console.error('Failed to create product:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to create product',
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='relative' ref={dropdownRef}>
            <button
                type='button'
                onClick={() => setOpen((v) => !v)}
                className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-inverse hover:bg-primary-dark transition transform hover:scale-105 Active:scale-95 ${
                    pulse ? 'ring-2 ring-primary/40' : ''
                }`}
                title='Create product'
            >
                <svg
                    className='w-5 h-5'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                >
                    <path d='M12 5v14M5 12h14' />
                </svg>
            </button>
            {open && (
                <div className='absolute right-0 mt-2 z-50 bg-card border border-light rounded-lg shadow-xl p-3 min-w-[250px]'>
                    <div className='space-y-3'>
                        <input
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateProduct();
                                }
                                if (e.key === 'Escape') {
                                    setOpen(false);
                                    setError(null);
                                }
                            }}
                            placeholder='Enter product name'
                            className='w-full px-3 py-2 text-sm rounded-md border border-light focus:outline-none focus:ring-2 focus:ring-primary/20'
                            disabled={isLoading}
                        />

                        {error && (
                            <div className='text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200'>
                                {error}
                            </div>
                        )}

                        <div className='flex items-center gap-2'>
                            <button
                                onClick={handleCreateProduct}
                                disabled={isLoading || !name.trim()}
                                className='flex-1 px-3 py-2 text-xs rounded-md bg-primary text-inverse hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {isLoading ? 'Creating...' : 'Add Product'}
                            </button>
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    setError(null);
                                }}
                                className='px-3 py-2 text-xs rounded-md border border-light text-secondary hover:bg-slate-50'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
