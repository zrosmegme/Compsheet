import React from 'react';
import { X } from 'lucide-react';
import type { Criterion } from '../types';
import { cn } from '../lib/utils';

interface CriteriaPanelProps {
    criteria: Criterion[];
    columns: string[];
    data: any[];
    onUpdateCriteria: (updated: Criterion[]) => void;
}

// Detect if a column is numeric based on column name and sample data
const isNumericColumn = (columnName: string, data: any[]): boolean => {
    const lowerName = columnName.toLowerCase();

    // Text-only columns
    if (lowerName.includes('ticker') ||
        lowerName.includes('name') ||
        lowerName.includes('category') ||
        lowerName.includes('sector') ||
        lowerName.includes('vertical') ||
        lowerName.includes('horizontal') ||
        lowerName.includes('app') ||
        lowerName.includes('infra') ||
        lowerName.includes('comps') ||
        lowerName.includes('cloud') ||
        lowerName.includes('hybrid')) {
        return false;
    }

    // Check sample data
    if (data.length > 0) {
        const values = data.map(row => row[columnName]).filter(v => v !== undefined && v !== '' && v !== null);
        const numericValues = values.filter(v => !isNaN(Number(v)) && typeof v !== 'string');

        // If most values are numeric, treat as numeric
        return numericValues.length > values.length * 0.7;
    }

    return true; // Default to numeric
};

export const CriteriaPanel: React.FC<CriteriaPanelProps> = ({ criteria, columns, data, onUpdateCriteria }) => {
    const updateCriterion = (id: string, field: keyof Criterion, value: any) => {
        const updated = criteria.map(c => {
            if (c.id === id) {
                const updatedCriterion = { ...c, [field]: value };

                // If changing column to a non-numeric one, clear min/max values
                if (field === 'column' && !isNumericColumn(value, data)) {
                    updatedCriterion.min = undefined;
                    updatedCriterion.max = undefined;
                }

                return updatedCriterion;
            }
            return c;
        });
        onUpdateCriteria(updated);
    };

    const removeCriterion = (id: string) => {
        onUpdateCriteria(criteria.filter(c => c.id !== id));
    };

    if (criteria.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 italic">
                No active filters. Click "Add Filter" above to start filtering.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {criteria.map((c) => {
                const isNumeric = isNumericColumn(c.column, data);

                return (
                    <div key={c.id} className={cn(
                        "flex flex-col gap-3 p-4 rounded-lg border transition-all",
                        c.active ? "bg-slate-800/50 border-slate-700" : "bg-slate-900/30 border-slate-800/50 opacity-60"
                    )}>
                        {/* Header: Checkbox, Column, Delete */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={c.active}
                                onChange={(e) => updateCriterion(c.id, 'active', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-accent focus:ring-accent/50 shrink-0"
                            />

                            <select
                                value={c.column}
                                onChange={(e) => updateCriterion(c.id, 'column', e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-slate-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none min-w-0"
                            >
                                {columns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => removeCriterion(c.id)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body: Inputs */}
                        <div className="grid grid-cols-2 gap-2">
                            {isNumeric ? (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Min"
                                        value={c.min || ''}
                                        onChange={(e) => updateCriterion(c.id, 'min', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none placeholder:text-slate-600"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Max"
                                        value={c.max || ''}
                                        onChange={(e) => updateCriterion(c.id, 'max', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none placeholder:text-slate-600"
                                    />
                                </>
                            ) : (
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Text (partial match)"
                                        value={c.text || ''}
                                        onChange={(e) => updateCriterion(c.id, 'text', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none placeholder:text-slate-600"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
