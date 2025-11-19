import { FilterBar } from '../components/FilterBar';
import { DataTable } from '../components/DataTable';
import type { DataRow, Criterion } from '../types';
import { DEFAULT_COLUMNS } from '../lib/constants';

interface OverviewPageProps {
    data: DataRow[];
    filteredData: DataRow[];
    criteria: Criterion[];
    columns: string[];
    onUpdateCriteria: (criteria: Criterion[]) => void;
}

export function OverviewPage({
    data,
    filteredData,
    criteria,
    columns,
    onUpdateCriteria
}: OverviewPageProps) {
    // Show default columns plus any columns from active criteria
    const activeCriteria = criteria.filter(c => c.active);
    const criteriaColumns = activeCriteria.map(c => c.column);
    const visibleColumns = Array.from(new Set([...DEFAULT_COLUMNS, ...criteriaColumns]));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Filter Bar */}
            <FilterBar
                criteria={criteria}
                columns={columns}
                data={data}
                onUpdateCriteria={onUpdateCriteria}
            />

            {/* Filtered Data */}
            <div>
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Filtered Data
                    </h2>
                    <span className="text-sm text-slate-500">
                        {filteredData.length} rows
                    </span>
                </div>
                <DataTable
                    data={filteredData}
                    visibleColumns={visibleColumns}
                />
            </div>
        </div>
    );
}
