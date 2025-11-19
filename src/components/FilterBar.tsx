import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { CriteriaPanel } from './CriteriaPanel';
import type { Criterion } from '../types';
import { cn } from '../lib/utils';

interface FilterBarProps {
    criteria: Criterion[];
    columns: string[];
    data: any[];
    onUpdateCriteria: (criteria: Criterion[]) => void;
}

const STORAGE_KEY_COLLAPSED = 'compsheet_filterbar_collapsed';

export function FilterBar({ criteria, columns, data, onUpdateCriteria }: FilterBarProps) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_COLLAPSED);
            return saved === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_COLLAPSED, isCollapsed.toString());
        } catch (error) {
            console.error('Failed to save collapsed state:', error);
        }
    }, [isCollapsed]);

    const activeCriteriaCount = criteria.filter(c => c.active).length;

    return (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden backdrop-blur-sm mb-6">
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                        <Filter className="w-5 h-5 text-accent" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-slate-100">Filter Criteria</h3>
                        <p className="text-xs text-slate-500">
                            {activeCriteriaCount} active {activeCriteriaCount === 1 ? 'filter' : 'filters'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-sm">
                        {isCollapsed ? 'Expand' : 'Collapse'}
                    </span>
                    {isCollapsed ? (
                        <ChevronDown className="w-5 h-5" />
                    ) : (
                        <ChevronUp className="w-5 h-5" />
                    )}
                </div>
            </button>

            {/* Collapsible Content */}
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"
                )}
            >
                <div className="px-6 pb-6">
                    <CriteriaPanel
                        criteria={criteria}
                        columns={columns}
                        data={data}
                        onUpdateCriteria={onUpdateCriteria}
                    />
                </div>
            </div>
        </div>
    );
}
