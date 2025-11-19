import { DataTable } from '../components/DataTable';
import type { DataRow } from '../types';
import { DEFAULT_COLUMNS } from '../lib/constants';

interface DataPageProps {
    data: DataRow[];
}

export function DataPage({ data }: DataPageProps) {
    const rawDataColumns = DEFAULT_COLUMNS;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Raw Data
                </h2>
                <span className="text-sm text-slate-500">
                    {data.length} rows
                </span>
            </div>

            <DataTable
                data={data}
                visibleColumns={rawDataColumns}
            />
        </div>
    );
}
