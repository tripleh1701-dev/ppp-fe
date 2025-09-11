import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import './AssignUserGroupsTable.css';
import AssignUserGroups_tableConfig from '../../config/AssignUserGroups_tableConfig';

const AssignUserGroupsTable = ({
    currentUser,
    onAssignGroups,
    onClose,
    isVisible = false,
    embedded = false,
}) => {
    console.log('🔄 AssignUserGroupsTable rendered with props:', {
        currentUser: !!currentUser,
        currentUserData: currentUser,
        isVisible,
        embedded,
    });
    // Core state from reusable component
    const [items, setItems] = useState([]);
    const [columns, setColumns] = useState(
        AssignUserGroups_tableConfig.columns,
    );
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [entities, setEntities] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchVisible, setSearchVisible] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [currentView, setCurrentView] = useState('groups'); // 'groups' or 'roles'
    const [selectedGroupForRoles, setSelectedGroupForRoles] = useState(null);
    const [rolesSearchVisible, setRolesSearchVisible] = useState(false);
    const [rolesSearchTerm, setRolesSearchTerm] = useState('');

    // Debug state (can be removed after testing)
    console.log('🔍 Current state:', {
        entitiesCount: entities.length,
        servicesCount: services.length,
        entitiesPreview: entities.slice(0, 2),
        servicesPreview: services.slice(0, 2),
    });

    // Advanced features from reusable component
    const [sortStates, setSortStates] = useState({});
    const [editingCell, setEditingCell] = useState(null);
    const [hoveredHeader, setHoveredHeader] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [columnWidths, setColumnWidths] = useState({});

    // Refs for advanced interactions
    const tableRef = useRef(null);
    const inputRef = useRef(null);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor),
    );

    // Load data on component mount
    useEffect(() => {
        console.log('🔄 useEffect triggered:', {
            isVisible,
            currentUser: !!currentUser,
        });

        if (isVisible) {
            console.log('✅ Component is visible, fetching data...');
            fetchUserGroups();
            fetchEntities();
            fetchServices();
        } else {
            console.log('❌ Component not visible, skipping fetch');
        }
    }, [isVisible, currentUser]);

    // Initialize column widths
    useEffect(() => {
        const initialWidths = {};
        columns.forEach((col) => {
            initialWidths[col.id] = parseInt(col.width) || 150;
        });
        setColumnWidths(initialWidths);
    }, [columns]);

    // Fetch user groups from API and transform to tree structure
    const fetchUserGroups = async () => {
        setLoading(true);
        try {
            // Use absolute URL for the API call
            const apiUrl = `http://localhost:4000/api/user-groups?accountId=4&enterpriseId=7`;
            console.log('🔍 Fetching user groups from:', apiUrl);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Raw API response:', data);

            // Transform data to match reusable component structure
            const transformedData = data.map((group, index) => ({
                id: group.id || `group-${index}`,
                parentId: null,
                group: group.name || group.groupName || `Group ${index + 1}`,
                description: group.description || 'No description provided',
                entity: group.entityId || null,
                service: group.serviceId || null,
                roles: group.roles?.length || 0, // Count roles array length
                status: 'Active',
                isExpanded: true,
                level: 0,
                hasChildren: false,
                children: [],
                assignedUserGroup: group.name || `Group ${index + 1}`,
                selected: false,
            }));

            console.log('✨ Transformed data:', transformedData);
            setItems(transformedData);
        } catch (error) {
            console.error('❌ Error fetching user groups:', error);
            setItems([]); // Set empty array when API fails
        } finally {
            setLoading(false);
        }
    };

    // Fetch entities for dropdown
    const fetchEntities = async () => {
        try {
            const apiUrl = 'http://localhost:4000/api/business-units/entities';
            console.log('🔍 Fetching entities from:', apiUrl);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                console.warn(
                    '⚠️ Entities API returned:',
                    response.status,
                    response.statusText,
                );
                setEntities([]); // Set empty array for errors
                return;
            }

            const data = await response.json();
            console.log('📦 Entities response:', data);

            // Ensure data is an array
            if (Array.isArray(data)) {
                setEntities(data);
            } else {
                console.warn('⚠️ Entities API returned non-array data:', data);
                setEntities([]);
            }
        } catch (error) {
            console.error('❌ Error fetching entities:', error);
            setEntities([]); // Always set empty array on error
        }
    };

    // Fetch services for dropdown
    const fetchServices = async () => {
        try {
            const apiUrl = 'http://localhost:4000/api/services';
            console.log('🔍 Fetching services from:', apiUrl);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                console.warn(
                    '⚠️ Services API returned:',
                    response.status,
                    response.statusText,
                );
                setServices([]); // Set empty array for 404 or other errors
                return;
            }

            const data = await response.json();
            console.log('📦 Services response:', data);

            // Ensure data is an array
            if (Array.isArray(data)) {
                setServices(data);
            } else {
                console.warn('⚠️ Services API returned non-array data:', data);
                setServices([]);
            }
        } catch (error) {
            console.error('❌ Error fetching services:', error);
            setServices([]); // Always set empty array on error
        }
    };

    // Create new user group functionality
    const handleCreateNewGroup = useCallback(() => {
        const newGroup = {
            id: `new-${Date.now()}`,
            parentId: null,
            group: '',
            description: '',
            entity: '',
            service: '',
            roles: 0,
            isNew: true, // Flag to identify new rows
        };

        // Add new row at the top of the table
        setItems((prev) => [newGroup, ...prev]);

        // Auto-select the new row
        setSelectedGroups([newGroup.id]);

        // Auto-focus on the first editable cell (name) after a short delay
        setTimeout(() => {
            setEditingCell({itemId: newGroup.id, columnId: 'group'});
        }, 100);
    }, []);

    // Toggle search visibility
    const toggleSearch = useCallback(() => {
        setSearchVisible((prev) => !prev);
    }, []);

    // Toggle roles search visibility
    const toggleRolesSearch = useCallback(() => {
        setRolesSearchVisible((prev) => !prev);
    }, []);

    // Handle creating new role
    const handleCreateNewRole = useCallback(() => {
        console.log('🆕 Creating new role');
        // TODO: Add new role logic
        alert('Create new role functionality to be implemented');
    }, []);

    // Navigate to assign roles page for specific group
    const handleRoleNavigation = useCallback(
        (groupId) => {
            console.log('🎯 Navigating to assign roles for group:', groupId);
            const group = items.find((item) => item.id === groupId);
            setSelectedGroupForRoles(group);
            setCurrentView('roles');
        },
        [items],
    );

    // Sorting functionality from reusable component
    const handleSort = useCallback(
        (columnId) => {
            setSortStates((prev) => {
                const currentState = prev[columnId] || 'none';
                let newState;

                switch (currentState) {
                    case 'none':
                        newState = 'asc';
                        break;
                    case 'asc':
                        newState = 'desc';
                        break;
                    case 'desc':
                        newState = 'none';
                        break;
                    default:
                        newState = 'asc';
                }

                return {
                    ...prev,
                    [columnId]: newState,
                };
            });

            // Apply sorting to items
            setItems((prevItems) => {
                const sortedItems = [...prevItems];
                const sortState =
                    sortStates[columnId] === 'asc'
                        ? 'desc'
                        : sortStates[columnId] === 'desc'
                        ? 'none'
                        : 'asc';

                if (sortState === 'none') {
                    return sortedItems;
                }

                return sortedItems.sort((a, b) => {
                    const aVal = a[columnId] || '';
                    const bVal = b[columnId] || '';

                    if (sortState === 'asc') {
                        return aVal.toString().localeCompare(bVal.toString());
                    } else {
                        return bVal.toString().localeCompare(aVal.toString());
                    }
                });
            });
        },
        [sortStates],
    );

    // Inline editing functionality
    const handleCellDoubleClick = useCallback(
        (itemId, columnId) => {
            const column = columns.find((col) => col.id === columnId);
            if (column && ['text', 'dropdown'].includes(column.type)) {
                setEditingCell({itemId, columnId});
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                        // Only call select() for text inputs, not select elements
                        if (
                            inputRef.current.type === 'text' &&
                            typeof inputRef.current.select === 'function'
                        ) {
                            inputRef.current.select();
                        }
                    }
                }, 0);
            }
        },
        [columns],
    );

    // Save cell edit
    const handleCellSave = useCallback(
        (value) => {
            if (editingCell) {
                setItems((prevItems) =>
                    prevItems.map((item) =>
                        item.id === editingCell.itemId
                            ? {...item, [editingCell.columnId]: value}
                            : item,
                    ),
                );
                setEditingCell(null);
            }
        },
        [editingCell],
    );

    // Cancel cell edit
    const handleCellCancel = useCallback(() => {
        setEditingCell(null);
    }, []);

    // Handle key press in editing mode
    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === 'Enter') {
                handleCellSave(e.target.value);
            } else if (e.key === 'Escape') {
                handleCellCancel();
            }
        },
        [handleCellSave, handleCellCancel],
    );

    // Drag and drop functionality
    const handleDragStart = (event) => {
        setDraggedItem(event.active.id);
    };

    const handleDragEnd = (event) => {
        const {active, over} = event;
        setDraggedItem(null);

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex(
                    (item) => item.id === active.id,
                );
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Handle group selection
    const handleGroupSelection = (groupId, isSelected) => {
        setSelectedGroups((prev) => {
            if (isSelected) {
                return [...prev, groupId];
            } else {
                return prev.filter((id) => id !== groupId);
            }
        });

        // Update item selection
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === groupId ? {...item, selected: isSelected} : item,
            ),
        );
    };

    // Handle select all
    const handleSelectAll = (isSelected) => {
        setSelectAll(isSelected);
        if (isSelected) {
            setSelectedGroups(filteredItems.map((item) => item.id));
            setItems((prevItems) =>
                prevItems.map((item) => ({...item, selected: true})),
            );
        } else {
            setSelectedGroups([]);
            setItems((prevItems) =>
                prevItems.map((item) => ({...item, selected: false})),
            );
        }
    };

    // Handle entity/service changes
    const handleDropdownChange = (groupId, field, value) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === groupId ? {...item, [field]: value} : item,
            ),
        );
    };

    // Handle assign action
    const handleAssign = async () => {
        if (selectedGroups.length === 0) return;

        try {
            const selectedGroupsData = items.filter((item) =>
                selectedGroups.includes(item.id),
            );

            await onAssignGroups(currentUser.id, selectedGroupsData);

            // Reset selections
            setSelectedGroups([]);
            setSelectAll(false);
            setItems((prevItems) =>
                prevItems.map((item) => ({...item, selected: false})),
            );
        } catch (error) {
            console.error('Error assigning groups:', error);
        }
    };

    // Filter items based on search
    const filteredItems = items.filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        const groupName = (item.group || '').toLowerCase();
        const description = (item.description || '').toLowerCase();

        return (
            groupName.includes(searchLower) || description.includes(searchLower)
        );
    });

    // Sortable Row Component (from reusable component)
    const SortableRow = ({item, children}) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({id: item.id});

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <tr
                ref={setNodeRef}
                style={style}
                className={`sortable-row ${item.selected ? 'selected' : ''} ${
                    isDragging ? 'dragging' : ''
                }`}
                {...attributes}
            >
                {children}
                <td className='drag-handle' {...listeners}>
                    <svg width='12' height='12' viewBox='0 0 24 24' fill='none'>
                        <path
                            d='M8 6H16M8 12H16M8 18H16'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                    </svg>
                </td>
            </tr>
        );
    };

    // Render cell content
    const renderCellContent = (item, column) => {
        const isEditing =
            editingCell?.itemId === item.id &&
            editingCell?.columnId === column.id;
        const value = item[column.id];

        if (isEditing) {
            if (column.type === 'dropdown') {
                const options =
                    column.id === 'entity'
                        ? entities || []
                        : column.id === 'service'
                        ? services || []
                        : [];

                // Debug: console.log('🎯 Editing dropdown render:', { columnId: column.id, options });

                // Ensure options is always an array
                const safeOptions = Array.isArray(options) ? options : [];

                return (
                    <select
                        ref={inputRef}
                        defaultValue={value || ''}
                        onBlur={(e) => handleCellSave(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className='inline-edit-select'
                    >
                        <option value=''>Select {column.header}</option>
                        {safeOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                );
            } else {
                return (
                    <input
                        ref={inputRef}
                        type='text'
                        defaultValue={value || ''}
                        onBlur={(e) => handleCellSave(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className='inline-edit-input'
                    />
                );
            }
        }

        // Render based on column type
        switch (column.id) {
            case 'select':
                return (
                    <input
                        type='checkbox'
                        checked={item.selected || false}
                        onChange={(e) =>
                            handleGroupSelection(item.id, e.target.checked)
                        }
                        className='row-select-checkbox'
                    />
                );
            case 'entity':
            case 'service':
                const options =
                    column.id === 'entity' ? entities || [] : services || [];

                // Debug dropdown rendering
                console.log('🎯 Rendering dropdown:', {
                    columnId: column.id,
                    currentValue: value,
                    optionsCount: options.length,
                    optionsPreview: options.slice(0, 2),
                    itemId: item.id,
                });

                // Ensure options is always an array
                const safeOptions = Array.isArray(options) ? options : [];

                return (
                    <select
                        value={value || ''}
                        onChange={(e) => {
                            console.log('🔄 Dropdown changed:', {
                                itemId: item.id,
                                field: column.id,
                                newValue: e.target.value,
                                oldValue: value,
                            });
                            handleDropdownChange(
                                item.id,
                                column.id,
                                e.target.value,
                            );
                        }}
                        className='cell-dropdown'
                    >
                        <option value=''>Select {column.header}</option>
                        {safeOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                );
            case 'roles':
                return (
                    <button
                        className='roles-link-btn'
                        onClick={() => handleRoleNavigation(item.id)}
                        title={`Assign roles to ${item.group || 'this group'}`}
                    >
                        <div className='roles-icon-container'>
                            <svg
                                className='roles-icon'
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                            >
                                {/* Modern shield/security icon for roles */}
                                <path
                                    d='M12 2L3 7L12 22L21 7L12 2Z'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    fill='none'
                                />
                                <path
                                    d='M12 7V17'
                                    stroke='currentColor'
                                    strokeWidth='1.5'
                                    strokeLinecap='round'
                                />
                                <circle
                                    cx='12'
                                    cy='10'
                                    r='2'
                                    stroke='currentColor'
                                    strokeWidth='1.5'
                                    fill='none'
                                />
                            </svg>
                            {value > 0 && (
                                <span className='roles-count-badge'>
                                    {value}
                                </span>
                            )}
                        </div>
                        <span className='roles-text'>{value || 0} roles</span>
                    </button>
                );
            default:
                return (
                    <div className='cell-content' title={value}>
                        {value || ''}
                    </div>
                );
        }
    };

    // Render header with sort controls
    const renderHeaderContent = (column) => {
        const sortState = sortStates[column.id] || 'none';
        const isHovered = hoveredHeader === column.id;

        return (
            <div className='header-content'>
                <span className='header-text'>{column.header}</span>
                {(isHovered || sortState !== 'none') && (
                    <div className='sort-controls'>
                        <button
                            className={`sort-btn ${
                                sortState === 'asc' ? 'Active' : ''
                            }`}
                            onClick={() => handleSort(column.id)}
                        >
                            ↑
                        </button>
                        <button
                            className={`sort-btn ${
                                sortState === 'desc' ? 'Active' : ''
                            }`}
                            onClick={() => handleSort(column.id)}
                        >
                            ↓
                        </button>
                        {sortState !== 'none' && (
                            <button
                                className='clear-sort-btn'
                                onClick={() =>
                                    setSortStates((prev) => ({
                                        ...prev,
                                        [column.id]: 'none',
                                    }))
                                }
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!isVisible) return null;

    // Content component
    const renderContent = () => (
        <div className='advanced-table-container'>
            {/* User Info */}
            {currentUser && (
                <div className='user-info-card'>
                    <div className='user-avatar'>
                        <svg viewBox='0 0 24 24' fill='none'>
                            <circle
                                cx='12'
                                cy='7'
                                r='4'
                                stroke='currentColor'
                                strokeWidth='1.5'
                            />
                            <path
                                d='M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                            />
                        </svg>
                    </div>
                    <div className='user-details'>
                        <div className='user-name'>
                            {currentUser.firstName} {currentUser.lastName}
                        </div>
                        <div className='user-email'>
                            {currentUser.emailAddress}
                        </div>
                        <div className='assigned-count'>
                            {selectedGroups.length} groups selected
                        </div>
                    </div>
                </div>
            )}

            {/* Conditional Content Based on Current View */}
            {currentView === 'groups' ? (
                <>
                    {/* Create Button and Collapsible Search */}
                    <div className='action-bar-container'>
                        <div className='action-bar-left'>
                            <button
                                className='create-group-btn'
                                onClick={handleCreateNewGroup}
                            >
                                <svg
                                    className='create-icon'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <path
                                        d='M12 5V19M5 12H19'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                                Create New User Group
                            </button>

                            {/* Expandable Search Container */}
                            <div
                                className={`expandable-search-container ${
                                    searchVisible ? 'expanded' : ''
                                }`}
                            >
                                <button
                                    className={`search-toggle-btn ${
                                        searchVisible ? 'Active' : ''
                                    }`}
                                    onClick={toggleSearch}
                                    title={
                                        searchVisible
                                            ? 'Hide Search'
                                            : 'Show Search'
                                    }
                                >
                                    <svg
                                        className='search-icon'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                    >
                                        <circle
                                            cx='11'
                                            cy='11'
                                            r='8'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                        />
                                        <path
                                            d='21 21L16.65 16.65'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        />
                                    </svg>
                                    {!searchVisible && 'Search'}
                                </button>

                                <div
                                    className={`search-input-container ${
                                        searchVisible ? 'visible' : 'hidden'
                                    }`}
                                >
                                    <input
                                        type='text'
                                        placeholder='Search groups...'
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className='expandable-search-input'
                                        autoFocus={searchVisible}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Table with DnD */}
                    <div
                        className={`table-container ${
                            filteredItems.length > 10
                                ? 'large-content'
                                : filteredItems.length > 5
                                ? 'medium-content'
                                : 'small-content'
                        }`}
                    >
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <table className='advanced-table' ref={tableRef}>
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type='checkbox'
                                                checked={selectAll}
                                                onChange={(e) =>
                                                    handleSelectAll(
                                                        e.target.checked,
                                                    )
                                                }
                                                className='bulk-select-checkbox'
                                            />
                                        </th>
                                        {columns.slice(1).map((column) => (
                                            <th
                                                key={column.id}
                                                style={{
                                                    width: columnWidths[
                                                        column.id
                                                    ],
                                                }}
                                                onMouseEnter={() =>
                                                    setHoveredHeader(column.id)
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredHeader(null)
                                                }
                                                className='sortable-header'
                                            >
                                                {renderHeaderContent(column)}
                                            </th>
                                        ))}
                                        <th className='drag-column'>⋮⋮</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <SortableContext
                                        items={filteredItems.map(
                                            (item) => item.id,
                                        )}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {loading ? (
                                            <tr>
                                                <td
                                                    colSpan={columns.length + 1}
                                                    className='loading-cell'
                                                >
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : filteredItems.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={columns.length + 1}
                                                    className='empty-cell'
                                                >
                                                    No groups found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredItems.map((item) => (
                                                <SortableRow
                                                    key={item.id}
                                                    item={item}
                                                >
                                                    <td>
                                                        <input
                                                            type='checkbox'
                                                            checked={
                                                                item.selected ||
                                                                false
                                                            }
                                                            onChange={(e) =>
                                                                handleGroupSelection(
                                                                    item.id,
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                            className='row-select-checkbox'
                                                        />
                                                    </td>
                                                    {columns
                                                        .slice(1)
                                                        .map((column) => (
                                                            <td
                                                                key={column.id}
                                                                className={`cell ${column.id}-cell`}
                                                                onDoubleClick={() =>
                                                                    handleCellDoubleClick(
                                                                        item.id,
                                                                        column.id,
                                                                    )
                                                                }
                                                            >
                                                                {renderCellContent(
                                                                    item,
                                                                    column,
                                                                )}
                                                            </td>
                                                        ))}
                                                </SortableRow>
                                            ))
                                        )}
                                    </SortableContext>
                                </tbody>
                            </table>
                        </DndContext>
                    </div>

                    {/* Conditional Actions - Show only when rows are selected */}
                    {selectedGroups.length > 0 && (
                        <div className='assignment-actions slide-up'>
                            <div className='assignment-info'>
                                Select groups and assign to{' '}
                                {currentUser?.firstName} {currentUser?.lastName}
                            </div>
                            <div className='assignment-buttons'>
                                <button
                                    className='assign-btn'
                                    onClick={handleAssign}
                                    disabled={selectedGroups.length === 0}
                                >
                                    <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                    >
                                        <path
                                            d='M9 12L11 14L15 10'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                        />
                                        <circle
                                            cx='12'
                                            cy='12'
                                            r='9'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                        />
                                    </svg>
                                    Assign To User ({selectedGroups.length}{' '}
                                    selected)
                                </button>

                                <button
                                    className='configure-btn'
                                    onClick={() => {
                                        // Use the first selected group or create a default one
                                        const selectedGroup =
                                            selectedGroups.length > 0
                                                ? items.find(
                                                      (item) => item.selected,
                                                  )
                                                : {
                                                      group: 'Selected Groups',
                                                      id: 'temp',
                                                  };

                                        // If multiple groups selected, show count in the group name
                                        if (selectedGroups.length > 1) {
                                            selectedGroup.group = `${selectedGroups.length} Selected Groups`;
                                        }
                                        setSelectedGroupForRoles(selectedGroup);
                                        setCurrentView('roles');
                                    }}
                                >
                                    <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                    >
                                        <path
                                            d='M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H6C5.46957 3 4.96086 3.21071 4.58579 3.58579C4.21071 3.96086 4 4.46957 4 5V21L8 19L12 21L16 19L20 21V5C20 4.46957 19.7893 3.96086 19.4142 3.58579C19.0391 3.21071 18.5304 3 18 3H16'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                        />
                                    </svg>
                                    Select Roles & Scope
                                </button>

                                <button className='close-btn' onClick={onClose}>
                                    <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                    >
                                        <line
                                            x1='18'
                                            y1='6'
                                            x2='6'
                                            y2='18'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                        />
                                        <line
                                            x1='6'
                                            y1='6'
                                            x2='18'
                                            y2='18'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                        />
                                    </svg>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Roles View */
                <div className='roles-view'>
                    <div className='roles-header'>
                        <h3>
                            Select Roles for:{' '}
                            {selectedGroupForRoles?.group || 'Selected Group'}
                        </h3>
                        <p>Choose roles to assign to this user group</p>
                    </div>

                    {/* Create Role Button and Collapsible Search */}
                    <div className='action-bar-container'>
                        <div className='action-bar-left'>
                            <button
                                className='create-group-btn'
                                onClick={handleCreateNewRole}
                            >
                                <svg
                                    className='create-icon'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <path
                                        d='M12 5V19M5 12H19'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                                Create New Role
                            </button>

                            {/* Expandable Search Container */}
                            <div
                                className={`expandable-search-container ${
                                    rolesSearchVisible ? 'expanded' : ''
                                }`}
                            >
                                <button
                                    className={`search-toggle-btn ${
                                        rolesSearchVisible ? 'Active' : ''
                                    }`}
                                    onClick={toggleRolesSearch}
                                    title={
                                        rolesSearchVisible
                                            ? 'Hide Search'
                                            : 'Show Search'
                                    }
                                >
                                    <svg
                                        className='search-icon'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                    >
                                        <circle
                                            cx='11'
                                            cy='11'
                                            r='8'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                        />
                                        <path
                                            d='21 21L16.65 16.65'
                                            stroke='currentColor'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                        />
                                    </svg>
                                    {!rolesSearchVisible && 'Search'}
                                </button>

                                <div
                                    className={`search-input-container ${
                                        rolesSearchVisible
                                            ? 'visible'
                                            : 'hidden'
                                    }`}
                                >
                                    <input
                                        type='text'
                                        placeholder='Search roles...'
                                        value={rolesSearchTerm}
                                        onChange={(e) =>
                                            setRolesSearchTerm(e.target.value)
                                        }
                                        className='expandable-search-input'
                                        autoFocus={rolesSearchVisible}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simple Roles Table */}
                    <div className='table-container'>
                        <table className='advanced-table'>
                            <thead>
                                <tr>
                                    <th>
                                        <input type='checkbox' />
                                    </th>
                                    <th>Role Name</th>
                                    <th>Description</th>
                                    <th>Attributes</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <input type='checkbox' />
                                    </td>
                                    <td>Admin</td>
                                    <td>Full system administrator access</td>
                                    <td>
                                        <button className='attributes-btn'>
                                            <svg
                                                width='14'
                                                height='14'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                            >
                                                <circle
                                                    cx='12'
                                                    cy='12'
                                                    r='3'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                />
                                                <path
                                                    d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                />
                                            </svg>
                                            Configure
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <input type='checkbox' />
                                    </td>
                                    <td>Editor</td>
                                    <td>Content editing and management</td>
                                    <td>
                                        <button className='attributes-btn'>
                                            <svg
                                                width='14'
                                                height='14'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                            >
                                                <circle
                                                    cx='12'
                                                    cy='12'
                                                    r='3'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                />
                                                <path
                                                    d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                />
                                            </svg>
                                            Configure
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <input type='checkbox' />
                                    </td>
                                    <td>Viewer</td>
                                    <td>Read-only access to content</td>
                                    <td>
                                        <button className='attributes-btn'>
                                            <svg
                                                width='14'
                                                height='14'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                            >
                                                <circle
                                                    cx='12'
                                                    cy='12'
                                                    r='3'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                />
                                                <path
                                                    d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
                                                    stroke='currentColor'
                                                    strokeWidth='2'
                                                />
                                            </svg>
                                            Configure
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Roles Actions */}
                    <div className='assignment-actions slide-up'>
                        <div className='assignment-info'>
                            Select roles to assign to{' '}
                            {selectedGroupForRoles?.group || 'this group'}
                        </div>
                        <div className='assignment-buttons'>
                            <button className='assign-btn'>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <path
                                        d='M9 12L11 14L15 10'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    />
                                    <circle
                                        cx='12'
                                        cy='12'
                                        r='9'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    />
                                </svg>
                                Assign Selected Roles
                            </button>

                            <button
                                className='configure-btn'
                                onClick={() => setCurrentView('groups')}
                            >
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <path
                                        d='M19 12H5'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                    />
                                    <path
                                        d='M12 19L5 12L12 5'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                                Back to Groups
                            </button>

                            <button className='close-btn' onClick={onClose}>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <line
                                        x1='18'
                                        y1='6'
                                        x2='6'
                                        y2='18'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    />
                                    <line
                                        x1='6'
                                        y1='6'
                                        x2='18'
                                        y2='18'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                    />
                                </svg>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Return content with or without panel wrapper based on embedded prop
    if (embedded) {
        return <div className='embedded-content-area'>{renderContent()}</div>;
    }

    return (
        <div className='assign-usergroups-panel'>
            {/* Breadcrumb */}
            <div className='panel-breadcrumb-container'>
                <nav className='panel-breadcrumb-nav'>
                    <div className='breadcrumb-item' onClick={() => onClose()}>
                        <svg
                            className='breadcrumb-icon'
                            viewBox='0 0 24 24'
                            fill='none'
                        >
                            <circle
                                cx='12'
                                cy='7'
                                r='4'
                                stroke='currentColor'
                                strokeWidth='1.5'
                            />
                            <path
                                d='M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                            />
                        </svg>
                        <span>Manage Users</span>
                    </div>
                    <svg
                        className='breadcrumb-separator'
                        viewBox='0 0 24 24'
                        fill='none'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 5l7 7-7 7'
                        />
                    </svg>
                    <div
                        className={`breadcrumb-item ${
                            currentView === 'groups' ? 'Active' : ''
                        }`}
                        onClick={() => setCurrentView('groups')}
                    >
                        <svg
                            className='breadcrumb-icon'
                            viewBox='0 0 24 24'
                            fill='none'
                        >
                            <path
                                d='M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21'
                                stroke='currentColor'
                                strokeWidth='1.5'
                            />
                            <path
                                d='M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z'
                                stroke='currentColor'
                                strokeWidth='1.5'
                            />
                            <circle
                                cx='16'
                                cy='13'
                                r='3'
                                stroke='currentColor'
                                strokeWidth='1.5'
                            />
                        </svg>
                        <span>Assign User Groups</span>
                    </div>

                    {currentView === 'roles' && (
                        <>
                            <svg
                                className='breadcrumb-separator'
                                viewBox='0 0 24 24'
                                fill='none'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 5l7 7-7 7'
                                />
                            </svg>
                            <div className='breadcrumb-item Active'>
                                <svg
                                    className='breadcrumb-icon'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                >
                                    <path
                                        d='M12 2L3 7L12 22L21 7L12 2Z'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        fill='none'
                                    />
                                    <path
                                        d='M12 7V17'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        strokeLinecap='round'
                                    />
                                    <circle
                                        cx='12'
                                        cy='10'
                                        r='2'
                                        stroke='currentColor'
                                        strokeWidth='1.5'
                                        fill='none'
                                    />
                                </svg>
                                <span>Assign Roles</span>
                            </div>
                        </>
                    )}
                </nav>
                <button className='panel-close-btn' onClick={onClose}>
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
                        <line
                            x1='18'
                            y1='6'
                            x2='6'
                            y2='18'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                        <line
                            x1='6'
                            y1='6'
                            x2='18'
                            y2='18'
                            stroke='currentColor'
                            strokeWidth='2'
                        />
                    </svg>
                </button>
            </div>

            {/* Content Area */}
            <div className='content-area'>{renderContent()}</div>
        </div>
    );
};

export default AssignUserGroupsTable;
