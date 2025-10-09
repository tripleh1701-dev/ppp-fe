'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {motion} from 'framer-motion';
import {ChevronRight, Building2, Package, Globe, X} from 'lucide-react';

export interface EnvironmentRow {
    id: string;
    environmentName: string;
    details: string;
    deploymentType: string;
    testConnectivity: string;
    status: string;
}

interface EnvironmentsTableProps {
    rows: EnvironmentRow[];
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onUpdateField?: (rowId: string, field: string, value: any) => void;
    visibleColumns?: Array<
        | 'environmentName'
        | 'details'
        | 'deploymentType'
        | 'testConnectivity'
        | 'status'
    >;
    highlightQuery?: string;
    groupByExternal?: 'none' | 'environmentName' | 'deploymentType' | 'status';
    onShowAllColumns?: () => void;
    onAddNewRow?: () => void;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
    externalSortColumn?: string;
    externalSortDirection?: 'asc' | 'desc';
}

function InlineEditableText({
    value,
    onCommit,
    placeholder,
    isError = false,
}: {
    value: string;
    onCommit: (next: string) => void;
    placeholder?: string;
    isError?: boolean;
}) {
    const [editing, setEditing] = React.useState(false);
    const [draft, setDraft] = React.useState<string>(value || '');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setDraft(value || '');
    }, [value]);

    React.useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const commit = () => {
        const trimmed = draft.trim();
        if (trimmed !== value) {
            onCommit(trimmed);
        }
        setEditing(false);
    };

    if (editing) {
        return (
            <input
                ref={inputRef}
                value={draft}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDraft(e.target.value)
                }
                onBlur={commit}
                onKeyDown={(e: any) => {
                    if (e.key === 'Enter') {
                        commit();
                    } else if (e.key === 'Escape') {
                        setDraft(value || '');
                        setEditing(false);
                    }
                }}
                placeholder={placeholder}
                className={`min-w-0 w-full rounded-sm border ${
                    isError
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                        : 'border-blue-300 bg-white'
                } px-1 py-0.5 text-[12px] focus:outline-none focus:ring-2 ${
                    isError
                        ? 'focus:ring-red-200 focus:border-red-500'
                        : 'focus:ring-blue-200 focus:border-blue-500'
                }`}
            />
        );
    }

    return (
        <span
            onClick={() => setEditing(true)}
            className='cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded block truncate'
            style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
        >
            {value || (
                <span className='text-slate-400 italic'>{placeholder}</span>
            )}
        </span>
    );
}

function EnvironmentRow({
    row,
    index,
    onEdit,
    onDelete,
    onUpdateField,
    isExpanded,
    onToggle,
    compressingRowId,
    foldingRowId,
    visibleColumns,
}: {
    row: EnvironmentRow;
    index: number;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    onUpdateField?: (rowId: string, field: string, value: any) => void;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    compressingRowId?: string | null;
    foldingRowId?: string | null;
    visibleColumns?: Array<
        | 'environmentName'
        | 'details'
        | 'deploymentType'
        | 'testConnectivity'
        | 'status'
    >;
}) {
    const [isRowHovered, setIsRowHovered] = useState(false);

    const cols = visibleColumns || [
        'environmentName',
        'details',
        'deploymentType',
        'testConnectivity',
        'status',
    ];

    return (
        <div
            onMouseEnter={() => setIsRowHovered(true)}
            onMouseLeave={() => setIsRowHovered(false)}
            className={`w-full grid items-center gap-0 border border-slate-200 rounded-lg transition-all duration-200 ease-in-out min-h-[44px] mb-1 ${'hover:bg-blue-50 hover:shadow-lg hover:ring-1 hover:ring-blue-200 hover:border-blue-300 hover:-translate-y-0.5'} ${
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
            } ${
                compressingRowId === row.id
                    ? 'transform scale-x-75 transition-all duration-500 ease-out'
                    : ''
            } ${
                foldingRowId === row.id
                    ? 'opacity-0 transform scale-y-50 transition-all duration-300'
                    : ''
            }`}
            style={{
                gridTemplateColumns: `32px ${cols.map(() => '1fr').join(' ')}`,
                willChange: 'transform',
            }}
        >
            {/* Delete Button Column */}
            <div className='flex items-center justify-center px-1'>
                {isRowHovered && (
                    <motion.button
                        initial={{opacity: 0, scale: 0.8}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.8}}
                        whileHover={{scale: 1.1}}
                        whileTap={{scale: 0.95}}
                        onClick={(e: any) => {
                            e.stopPropagation();
                            if (onDelete) {
                                onDelete(row.id);
                            }
                        }}
                        className='group/delete flex items-center justify-center w-4 h-4 text-red-500 hover:text-white border border-red-300 hover:border-red-500 bg-white hover:bg-red-500 rounded-full transition-all duration-200 ease-out shadow-sm hover:shadow-md'
                        title='Delete row'
                    >
                        <svg
                            className='w-2 h-2'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                d='M6 12h12'
                            />
                        </svg>
                    </motion.button>
                )}
            </div>

            {/* Environment Name */}
            {cols.includes('environmentName') && (
                <div className='border-r border-slate-200 px-2 py-1'>
                    <div className='flex items-center gap-1.5'>
                        <button
                            className='h-5 w-5 rounded text-blue-600 hover:bg-blue-100'
                            onClick={() => onToggle(row.id)}
                        >
                            <motion.span
                                animate={{rotate: isExpanded ? 90 : 0}}
                                transition={{duration: 0.2}}
                                className='inline-flex'
                            >
                                <ChevronRight size={16} />
                            </motion.span>
                        </button>
                        <InlineEditableText
                            value={row.environmentName}
                            onCommit={(val) =>
                                onUpdateField?.(row.id, 'environmentName', val)
                            }
                            placeholder='Environment name'
                        />
                    </div>
                </div>
            )}

            {/* Details */}
            {cols.includes('details') && (
                <div className='border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={row.details}
                        onCommit={(val) =>
                            onUpdateField?.(row.id, 'details', val)
                        }
                        placeholder='Details'
                    />
                </div>
            )}

            {/* Deployment Type */}
            {cols.includes('deploymentType') && (
                <div className='border-r border-slate-200 px-2 py-1'>
                    <InlineEditableText
                        value={row.deploymentType}
                        onCommit={(val) =>
                            onUpdateField?.(row.id, 'deploymentType', val)
                        }
                        placeholder='Deployment type'
                    />
                </div>
            )}

            {/* Test Connectivity */}
            {cols.includes('testConnectivity') && (
                <div className='border-r border-slate-200 px-2 py-1'>
                    <span className='text-[12px]'>{row.testConnectivity}</span>
                </div>
            )}

            {/* Status */}
            {cols.includes('status') && (
                <div className='px-2 py-1'>
                    <span className='text-[12px]'>{row.status}</span>
                </div>
            )}
        </div>
    );
}

export default function EnvironmentsTable({
    rows,
    onEdit,
    onDelete,
    onUpdateField,
    visibleColumns,
    highlightQuery,
    groupByExternal = 'none',
    onShowAllColumns,
    onAddNewRow,
    compressingRowId,
    foldingRowId,
    externalSortColumn,
    externalSortDirection,
}: EnvironmentsTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleExpanded = (id: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const cols = visibleColumns || [
        'environmentName',
        'details',
        'deploymentType',
        'testConnectivity',
        'status',
    ];

    // Sort rows
    const sortedRows = useMemo(() => {
        if (!externalSortColumn || !externalSortDirection) return rows;

        return [...rows].sort((a, b) => {
            const aVal = String(
                (a as any)[externalSortColumn] || '',
            ).toLowerCase();
            const bVal = String(
                (b as any)[externalSortColumn] || '',
            ).toLowerCase();
            const comp = aVal.localeCompare(bVal, undefined, {
                numeric: true,
                sensitivity: 'base',
            });
            return externalSortDirection === 'asc' ? comp : -comp;
        });
    }, [rows, externalSortColumn, externalSortDirection]);

    // Group rows
    const groupedItems = useMemo(() => {
        if (groupByExternal === 'none') {
            return {'All Records': sortedRows};
        }

        const groups: Record<string, EnvironmentRow[]> = {};

        sortedRows.forEach((item) => {
            let groupKey = '';

            switch (groupByExternal) {
                case 'environmentName':
                    groupKey = item.environmentName || '(No Name)';
                    break;
                case 'deploymentType':
                    groupKey = item.deploymentType || '(No Type)';
                    break;
                case 'status':
                    groupKey = item.status || '(No Status)';
                    break;
                default:
                    groupKey = 'All Records';
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
        });

        // Sort group keys
        const sortedGroups: Record<string, EnvironmentRow[]> = {};
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const aIsEmpty = a.startsWith('(No ');
            const bIsEmpty = b.startsWith('(No ');
            if (aIsEmpty && !bIsEmpty) return 1;
            if (!aIsEmpty && bIsEmpty) return -1;
            return a.localeCompare(b);
        });

        sortedKeys.forEach((key) => {
            sortedGroups[key] = groups[key];
        });

        return sortedGroups;
    }, [sortedRows, groupByExternal]);

    if (cols.length === 0) {
        return (
            <div className='bg-white border border-slate-200 rounded-lg p-8 text-center'>
                <div className='flex flex-col items-center space-y-4'>
                    <svg
                        className='w-12 h-12 text-slate-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={1.5}
                            d='M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'
                        />
                    </svg>
                    <div className='space-y-2'>
                        <h3 className='text-lg font-medium text-slate-900'>
                            No columns are visible
                        </h3>
                        <p className='text-sm text-slate-500 max-w-sm'>
                            All columns have been hidden. Use the Show/Hide
                            button to display columns.
                        </p>
                    </div>
                    {onShowAllColumns && (
                        <button
                            onClick={onShowAllColumns}
                            className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700'
                        >
                            Show All Columns
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const columnLabels = {
        environmentName: 'Environment Name',
        details: 'Details',
        deploymentType: 'Deployment Type',
        testConnectivity: 'Test Connectivity',
        status: 'Status',
    };

    return (
        <div className='w-full'>
            {/* Header */}
            <div
                className='sticky top-0 z-30 grid w-full gap-0 px-0 py-3 text-xs font-bold text-slate-800 bg-slate-50 border-b border-slate-200 shadow-sm rounded-t-xl'
                style={{
                    gridTemplateColumns: `32px ${cols
                        .map(() => '1fr')
                        .join(' ')}`,
                }}
            >
                {/* Delete column header */}
                <div className='relative flex items-center justify-center gap-1 px-2 py-1.5'></div>

                {cols.map((col) => (
                    <div
                        key={col}
                        className='relative flex items-center gap-1 px-2 py-1.5 rounded-sm hover:bg-blue-50 transition-colors duration-150 border-r border-slate-200 last:border-r-0'
                    >
                        <div className='flex items-center gap-2'>
                            {col === 'environmentName' && <Globe size={14} />}
                            {col === 'details' && <Package size={14} />}
                            {col === 'deploymentType' && (
                                <Building2 size={14} />
                            )}
                            <span>
                                {columnLabels[col as keyof typeof columnLabels]}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Body */}
            {groupByExternal === 'none' ? (
                <div className='mt-2'>
                    {sortedRows.map((r, idx) => (
                        <div key={r.id}>
                            <EnvironmentRow
                                row={r}
                                index={idx}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onUpdateField={onUpdateField}
                                isExpanded={expandedRows.has(r.id)}
                                onToggle={toggleExpanded}
                                compressingRowId={compressingRowId}
                                foldingRowId={foldingRowId}
                                visibleColumns={cols}
                            />
                        </div>
                    ))}

                    {/* Add New Row Button */}
                    {onAddNewRow && (
                        <div
                            className='grid w-full gap-0 px-0 py-1 text-sm bg-slate-50/80 border-t border-slate-200 hover:bg-blue-50 transition-colors duration-150 cursor-pointer group h-10 rounded-b-lg'
                            style={{
                                gridTemplateColumns: `32px ${cols
                                    .map(() => '1fr')
                                    .join(' ')}`,
                            }}
                            onClick={onAddNewRow}
                        >
                            <div className='flex items-center justify-center px-2 py-1'></div>
                            <div
                                className='flex items-center justify-start gap-2 px-2 py-1 text-slate-500 group-hover:text-blue-600 transition-colors duration-150 font-medium'
                                style={{gridColumn: `span ${cols.length}`}}
                            >
                                <svg
                                    className='w-4 h-4'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M12 4v16m8-8H4'
                                    />
                                </svg>
                                <span className='italic'>Add New Row</span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className='space-y-4 mt-2'>
                    {Object.entries(groupedItems).map(
                        ([groupName, groupRows]) => (
                            <div
                                key={groupName}
                                className='border border-slate-200 rounded-lg'
                            >
                                {/* Group Header */}
                                <div className='bg-slate-50 px-4 py-3 border-b border-slate-200'>
                                    <h4 className='font-semibold text-slate-900 flex items-center gap-2'>
                                        <span>{groupName}</span>
                                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700'>
                                            {groupRows.length} record
                                            {groupRows.length !== 1 ? 's' : ''}
                                        </span>
                                    </h4>
                                </div>

                                {/* Group Rows */}
                                <div className='border-b border-slate-200 overflow-hidden'>
                                    {groupRows.map((r, idx) => (
                                        <div key={r.id}>
                                            <EnvironmentRow
                                                row={r}
                                                index={idx}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                                onUpdateField={onUpdateField}
                                                isExpanded={expandedRows.has(
                                                    r.id,
                                                )}
                                                onToggle={toggleExpanded}
                                                compressingRowId={
                                                    compressingRowId
                                                }
                                                foldingRowId={foldingRowId}
                                                visibleColumns={cols}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ),
                    )}

                    {/* Add New Row Button for grouped view */}
                    {onAddNewRow && (
                        <div className='border border-slate-200 rounded-lg overflow-hidden mt-4'>
                            <div
                                className='grid w-full gap-0 px-0 py-1 text-sm bg-slate-50/80 hover:bg-blue-50 transition-colors duration-150 cursor-pointer group h-10'
                                style={{
                                    gridTemplateColumns: `32px ${cols
                                        .map(() => '1fr')
                                        .join(' ')}`,
                                }}
                                onClick={onAddNewRow}
                            >
                                <div className='flex items-center justify-center px-2 py-1'></div>
                                <div
                                    className='flex items-center justify-start gap-2 px-2 py-1 text-slate-500 group-hover:text-blue-600 transition-colors duration-150 font-medium'
                                    style={{gridColumn: `span ${cols.length}`}}
                                >
                                    <svg
                                        className='w-4 h-4'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 4v16m8-8H4'
                                        />
                                    </svg>
                                    <span className='italic'>Add New Row</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
