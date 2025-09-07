'use client';

import React, {useEffect, useState} from 'react';
import {Reorder} from 'framer-motion';
import {ArrowUp, ArrowDown} from 'lucide-react';

export interface SortableItem {
    id: string;
    name: string;
    qty: number | string;
}

const defaultItems: SortableItem[] = [
    {id: '1', name: 'Apple', qty: 10},
    {id: '2', name: 'Banana', qty: 5},
    {id: '3', name: 'Cherry', qty: 20},
    {id: '4', name: 'Orange', qty: 15},
];

function SortableRow({
    item,
    index,
    rowClassName,
    dense,
}: {
    item: SortableItem;
    index: number;
    rowClassName?: string;
    dense?: boolean;
}) {
    return (
        <Reorder.Item
            value={item.id}
            id={item.id}
            whileDrag={{scale: 1.02, boxShadow: '0 8px 16px rgba(0,0,0,0.15)'}}
            className={`grid grid-cols-[40px_1fr_110px] items-center h-10 ${
                dense ? 'gap-2 px-2' : 'gap-3 px-3'
            } rounded-md bg-white border-b border-slate-100 cursor-grab transition-all duration-200 ease-in-out ${
                rowClassName ?? ''
            } hover:bg-slate-50 hover:shadow-sm hover:border-slate-200`}
        >
            <div className='flex items-center justify-center text-slate-500 text-xs font-medium'>
                {index + 1}
            </div>
            <div className='font-medium text-slate-900 text-xs'>
                {item.name}
            </div>
            <div className='text-right text-slate-600 font-medium text-xs'>
                {item.qty}
            </div>
        </Reorder.Item>
    );
}

export default function DraggableSortableTable({
    title,
    initialItems,
    columnLabels,
    accent,
    dense,
    frameless,
}: {
    title?: string;
    initialItems?: SortableItem[];
    columnLabels?: {name: string; qty: string};
    accent?: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';
    dense?: boolean;
    frameless?: boolean;
}) {
    const [items, setItems] = useState<SortableItem[]>(
        initialItems ?? defaultItems,
    );
    const [sortColumn, setSortColumn] = useState<'name' | 'qty' | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

    const themes: Record<
        NonNullable<typeof accent>,
        {
            sortBtn: string;
            hoverRing: string;
            rowHover: string;
            headerBar: string;
        }
    > = {
        blue: {
            sortBtn: 'from-sky-600 to-indigo-600',
            hoverRing: 'hover:ring-sky-200',
            rowHover: 'hover:bg-sky-50',
            headerBar: 'bg-gradient-to-r from-sky-50 to-indigo-50',
        },
        emerald: {
            sortBtn: 'from-emerald-600 to-teal-600',
            hoverRing: 'hover:ring-emerald-200',
            rowHover: 'hover:bg-emerald-50',
            headerBar: 'bg-gradient-to-r from-emerald-50 to-teal-50',
        },
        violet: {
            sortBtn: 'from-violet-600 to-fuchsia-600',
            hoverRing: 'hover:ring-violet-200',
            rowHover: 'hover:bg-violet-50',
            headerBar: 'bg-gradient-to-r from-violet-50 to-fuchsia-50',
        },
        amber: {
            sortBtn: 'from-amber-500 to-orange-600',
            hoverRing: 'hover:ring-amber-200',
            rowHover: 'hover:bg-amber-50',
            headerBar: 'bg-gradient-to-r from-amber-50 to-orange-50',
        },
        rose: {
            sortBtn: 'from-rose-600 to-pink-600',
            hoverRing: 'hover:ring-rose-200',
            rowHover: 'hover:bg-rose-50',
            headerBar: 'bg-gradient-to-r from-rose-50 to-pink-50',
        },
    };
    const theme = themes[(accent ?? 'blue') as NonNullable<typeof accent>];

    function applySort(
        list: SortableItem[],
        column: 'name' | 'qty',
        dir: 'asc' | 'desc',
    ) {
        return list.sort((a, b) => {
            const av = column === 'name' ? String(a.name) : String(a.qty);
            const bv = column === 'name' ? String(b.name) : String(b.qty);
            const comp = av.localeCompare(bv, undefined, {
                numeric: true,
                sensitivity: 'base',
            });
            return dir === 'asc' ? comp : -comp;
        });
    }

    function toggleSort(column: 'name' | 'qty') {
        const nextDir: 'asc' | 'desc' =
            sortColumn === column && sortDir === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDir(nextDir);
        setItems((prev) => applySort([...prev], column, nextDir));
    }

    // Top-right sort button removed; use column header sort controls instead

    return (
        <div className={dense || frameless ? 'p-0 w-full' : 'p-4 w-full'}>
            <div
                className={
                    dense
                        ? 'flex items-center mb-2'
                        : 'flex items-center mb-2'
                }
            >
                <h2 className='text-sm font-semibold'>
                    {title ?? 'Draggable & Sortable Table'}
                </h2>
            </div>

            <div
                role='table'
                className={`${
                    frameless
                        ? 'bg-transparent rounded-none shadow-none p-0 hover:shadow-none hover:ring-0'
                        : `bg-white rounded-2xl shadow-lg ${
                              dense ? 'p-2.5' : 'p-4'
                          } transition-shadow hover:shadow-xl hover:ring-1 ${
                              theme.hoverRing
                          }`
                } w-full`}
            >
                <div
                    className={`grid grid-cols-[40px_1fr_110px] ${
                        dense ? 'gap-2 px-2 py-2' : 'gap-3 px-3 py-2'
                    } text-xs font-semibold text-slate-700 border-b border-slate-200 ${
                        dense ? 'mb-1' : 'mb-2'
                    } ${frameless ? '' : `rounded-md ${theme.headerBar}`}`}
                >
                    <div className='flex items-center justify-center'>#</div>
                    <div className='flex items-center gap-2'>
                        <span>{columnLabels?.name ?? 'Item'}</span>
                        <button
                            type='button'
                            onClick={() => toggleSort('name')}
                            className='inline-flex items-center p-1 rounded hover:bg-slate-100 transition-colors duration-200 ease-in-out'
                            aria-label='Sort by name'
                        >
                            <ArrowUp
                                className={`w-4 h-4 ${
                                    sortColumn === 'name' && sortDir === 'asc'
                                        ? 'text-primary-600'
                                        : 'text-slate-400'
                                }`}
                            />
                            <ArrowDown
                                className={`w-4 h-4 ${
                                    sortColumn === 'name' && sortDir === 'desc'
                                        ? 'text-primary-600'
                                        : 'text-slate-400'
                                }`}
                            />
                        </button>
                    </div>
                    <div className='flex items-center justify-end gap-2'>
                        <span>{columnLabels?.qty ?? 'Qty'}</span>
                        <button
                            type='button'
                            onClick={() => toggleSort('qty')}
                            className='inline-flex items-center p-1 rounded hover:bg-slate-100 transition-colors duration-200 ease-in-out'
                            aria-label='Sort by quantity'
                        >
                            <ArrowUp
                                className={`w-4 h-4 ${
                                    sortColumn === 'qty' && sortDir === 'asc'
                                        ? 'text-primary-600'
                                        : 'text-slate-400'
                                }`}
                            />
                            <ArrowDown
                                className={`w-4 h-4 ${
                                    sortColumn === 'qty' && sortDir === 'desc'
                                        ? 'text-primary-600'
                                        : 'text-slate-400'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <Reorder.Group
                    axis='y'
                    values={items.map((it) => it.id)}
                    onReorder={(newOrderIds: string[]) => {
                        setItems((prev) => {
                            const map = new Map(
                                prev.map((p) => [p.id, p] as const),
                            );
                            return newOrderIds
                                .map((id) => map.get(id)!)
                                .filter(Boolean) as SortableItem[];
                        });
                    }}
                    className={dense ? 'space-y-1' : 'space-y-2'}
                >
                    {items.map((it, idx) => (
                        <SortableRow
                            key={it.id}
                            item={it}
                            index={idx}
                            rowClassName={`${theme.rowHover}`}
                            dense={dense}
                        />
                    ))}
                </Reorder.Group>
            </div>
        </div>
    );
}
