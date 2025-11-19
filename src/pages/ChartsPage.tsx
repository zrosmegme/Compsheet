import { useState, useEffect } from 'react';
import { ScatterChart } from '../components/ScatterChart';
import { FilterBar } from '../components/FilterBar';
import type { DataRow, Criterion } from '../types';
import { Plus, X, BarChart3 } from 'lucide-react';

interface ChartConfig {
    id: string;
    title: string;
}

interface ChartsPageProps {
    data: DataRow[];
    fullData: DataRow[];
    columns: string[];
    criteria: Criterion[];
    onUpdateCriteria: (criteria: Criterion[]) => void;
}

const STORAGE_KEY_CHARTS = 'compsheet_charts';

export function ChartsPage({ data, fullData, columns, criteria, onUpdateCriteria }: ChartsPageProps) {
    const [charts, setCharts] = useState<ChartConfig[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_CHARTS);
            return saved ? JSON.parse(saved) : [{ id: '1', title: 'Chart 1' }];
        } catch {
            return [{ id: '1', title: 'Chart 1' }];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_CHARTS, JSON.stringify(charts));
        } catch (error) {
            console.error('Failed to save charts:', error);
        }
    }, [charts]);

    const addChart = () => {
        const newId = (Math.max(...charts.map(c => parseInt(c.id)), 0) + 1).toString();
        setCharts([...charts, { id: newId, title: `Chart ${newId}` }]);
    };

    const removeChart = (id: string) => {
        if (charts.length > 1) {
            setCharts(charts.filter(c => c.id !== id));
        }
    };

    const updateChartTitle = (id: string, title: string) => {
        setCharts(charts.map(c => c.id === id ? { ...c, title } : c));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filter Bar */}
            <FilterBar
                criteria={criteria}
                columns={columns}
                data={fullData}
                onUpdateCriteria={onUpdateCriteria}
            />
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-accent" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Charts
                    </h2>
                </div>
                <button
                    onClick={addChart}
                    className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Chart
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {charts.map((chart) => (
                    <div
                        key={chart.id}
                        className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                            <input
                                type="text"
                                value={chart.title}
                                onChange={(e) => updateChartTitle(chart.id, e.target.value)}
                                className="bg-transparent border-none outline-none text-lg font-semibold text-slate-200 focus:text-white"
                                placeholder="Chart title..."
                            />
                            {charts.length > 1 && (
                                <button
                                    onClick={() => removeChart(chart.id)}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors"
                                    title="Remove chart"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <div className="p-4">
                            <ScatterChart
                                data={data}
                                columns={columns}
                                chartId={chart.id}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
