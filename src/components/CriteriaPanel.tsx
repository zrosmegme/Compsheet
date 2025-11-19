import { useState, useEffect, useRef } from 'react';
import { X, Check, Edit2 } from 'lucide-react';
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
    const [editingId, setEditingId] = useState<string | null>(null);
    const prevCriteriaLength = useRef(criteria.length);

    // Auto-edit new criteria
    useEffect(() => {
        if (criteria.length > prevCriteriaLength.current) {
            const newCriterion = criteria[criteria.length - 1];
            setEditingId(newCriterion.id);
        }
        prevCriteriaLength.current = criteria.length;
    }, [criteria.length, criteria]);

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
        if (editingId === id) setEditingId(null);
    };

    const formatCriterionLabel = (c: Criterion) => {
        const isNumeric = isNumericColumn(c.column, data);
        let label = `${c.column}: `;

        if (isNumeric) {
            if (c.min && c.max) return `${label} ${c.min} to ${c.max}`;
            if (c.min) return `${label} > ${c.min}`;
            if (c.max) return `${label} < ${c.max}`;
            return `${label} Any`;
        } else {
            return c.text ? `${label} contains "${c.text}"` : `${label} Any`;
        }
    };

    if (criteria.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 italic">
                No active filters. Click "Add Filter" above to start filtering.
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-3">
            {criteria.map((c) => {
                const isEditing = editingId === c.id;
                const isNumeric = isNumericColumn(c.column, data);

                if (isEditing) {
                    return (
                        <div key={c.id} className="w-full md:w-auto md:min-w-[400px] flex flex-col gap-3 p-4 rounded-lg border border-slate-700 bg-slate-800/50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3">
                                <select
                                    value={c.column}
                                    onChange={(e) => updateCriterion(c.id, 'column', e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-slate-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                                >
                                    {columns.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-md transition-colors"
                                    title="Done"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {isNumeric ? (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Min"
                                            value={c.min || ''}
                                            onChange={(e) => updateCriterion(c.id, 'min', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Max"
                                            value={c.max || ''}
                                            onChange={(e) => updateCriterion(c.id, 'max', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                                        />
                                    </>
                                ) : (
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            placeholder="Text (partial match)"
                                            value={c.text || ''}
                                            onChange={(e) => updateCriterion(c.id, 'text', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }

                // Compact Pill View
                return (
                    <div
                        key={c.id}
                        className={cn(
                            "flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border transition-all cursor-pointer group",
                            c.active
                                ? "bg-accent/10 border-accent/30 text-slate-200 hover:bg-accent/20"
                                : "bg-slate-900/30 border-slate-800 text-slate-500 hover:bg-slate-900/50"
                        )}
                        onClick={() => setEditingId(c.id)}
                    >
                        <input
                            type="checkbox"
                            checked={c.active}
                            onChange={(e) => {
                                e.stopPropagation();
                                updateCriterion(c.id, 'active', e.target.checked);
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-accent focus:ring-accent/50"
                        />
                        <span className="text-sm font-medium whitespace-nowrap max-w-[200px] truncate">
                            {formatCriterionLabel(c)}
                        </span>

                        <div className="flex items-center gap-1 pl-2 border-l border-slate-700/50 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(c.id);
                                }}
                                className="p-1 hover:text-accent transition-colors"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeCriterion(c.id);
                                }}
                                className="p-1 hover:text-red-400 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
