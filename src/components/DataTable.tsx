import React, { useMemo, useState } from 'react';
import type { DataRow } from '../types';
import { createFormatMap, formatValue } from '../lib/formatUtils';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface DataTableProps {
    data: DataRow[];
    visibleColumns: string[];
}

type SortConfig = {
    column: string;
    direction: 'asc' | 'desc';
} | null;

export const DataTable: React.FC<DataTableProps> = ({ data, visibleColumns }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);

    // Always include Ticker and Long Name if they exist, plus visible columns
    const fixedColumns = ['Ticker', 'Long Name'];
    const allColumns = [...new Set([...fixedColumns, ...visibleColumns])].filter(col =>
        data.length > 0 ? col in data[0] || fixedColumns.includes(col) : true
    );

    // Create format map for all columns
    const formatMap = useMemo(() => createFormatMap(data), [data]);

    // Sorted data
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;

        const sorted = [...data].sort((a, b) => {
            const aVal = a[sortConfig.column];
            const bVal = b[sortConfig.column];

            // Handle null/undefined values
            if (aVal === null || aVal === undefined || aVal === '') return 1;
            if (bVal === null || bVal === undefined || bVal === '') return -1;

            // Try numeric comparison first
            const aNum = Number(aVal);
            const bNum = Number(bVal);

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // Fall back to string comparison
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();

            if (sortConfig.direction === 'asc') {
                return aStr.localeCompare(bStr);
            } else {
                return bStr.localeCompare(aStr);
            }
        });

        return sorted;
    }, [data, sortConfig]);

    const handleSort = (column: string) => {
        setSortConfig(current => {
            if (!current || current.column !== column) {
                return { column, direction: 'asc' };
            }
            if (current.direction === 'asc') {
                return { column, direction: 'desc' };
            }
            return null; // Clear sorting
        });
    };

    const getSortIcon = (column: string) => {
        if (!sortConfig || sortConfig.column !== column) {
            return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />;
        }
        if (sortConfig.direction === 'asc') {
            return <ArrowUp className="w-3 h-3 text-accent" />;
        }
        return <ArrowDown className="w-3 h-3 text-accent" />;
    };

    if (data.length === 0) {
        return (
            <div className="bg-surface rounded-xl border border-slate-700/50 p-12 text-center text-slate-500">
                No data matches your criteria.
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-xl border border-slate-700/50 overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase text-xs font-medium">
                        <tr>
                            {allColumns.map((col) => (
                                <th
                                    key={col}
                                    className="px-6 py-4 tracking-wider cursor-pointer hover:bg-slate-800/50 transition-colors group max-w-[200px]"
                                    onClick={() => handleSort(col)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="break-words">{col}</span>
                                        {getSortIcon(col)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {sortedData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                {allColumns.map((col) => {
                                    const rawValue = row[col];
                                    const format = formatMap[col] || 'text';
                                    const displayValue = formatValue(rawValue, format);

                                    return (
                                        <td key={`${idx}-${col}`} className="px-6 py-4 whitespace-nowrap text-slate-300">
                                            {displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {sortedData.length} results</span>
                {sortConfig && (
                    <span className="text-slate-400">
                        Sorted by {sortConfig.column} ({sortConfig.direction === 'asc' ? 'ascending' : 'descending'})
                    </span>
                )}
            </div>
        </div>
    );
};
