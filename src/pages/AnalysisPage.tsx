import { useState, useEffect, useMemo, useRef } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Bar, ReferenceLine
} from 'recharts';
import { fetchChartData, type ChartDataPoint } from '../lib/finance';
import { Search, Loader2, Plus, X, Eye, EyeOff, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { FilterBar } from '../components/FilterBar';
import type { DataRow, Criterion } from '../types';

interface AnalysisPageProps {
    data: DataRow[];
    filteredData: DataRow[];
    criteria: Criterion[];
    columns: string[];
    onUpdateCriteria: (criteria: Criterion[]) => void;
}

const TIME_FILTERS = ['1mo', '3mo', '6mo', '1y', '2y', '5y'];

const STORAGE_KEY_ANALYSIS = 'compsheet_analysis';

// Specific columns to show in the comparables table
const COMPARABLE_COLUMNS = [
    'Ticker',
    'FTM Revenue',
    'MRQ Revenue Growth',
    'FTM Revenue Growth',
    'FTM FCF Margin',
    'EV/Rev (FTM)',
    'EV/uFCF (FTM)'
];

export function AnalysisPage({
    data,
    filteredData,
    criteria,
    columns,
    onUpdateCriteria
}: AnalysisPageProps) {
    // Load initial state from localStorage
    const loadSavedState = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_ANALYSIS);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    selectedTicker: parsed.selectedTicker || '',
                    searchInput: parsed.searchInput || '',
                    compTickers: parsed.compTickers || [],
                    timeFilter: parsed.timeFilter || '1y',
                    includeFiltered: parsed.includeFiltered || false,
                };
            }
        } catch {
            // ignore errors
        }
        return {
            selectedTicker: '',
            searchInput: '',
            compTickers: [],
            timeFilter: '1y',
            includeFiltered: false,
        };
    };

    const savedState = loadSavedState();

    // State for Chart
    const [selectedTicker, setSelectedTicker] = useState(savedState.selectedTicker);
    const [searchInput, setSearchInput] = useState(savedState.searchInput);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [chartLoading, setChartLoading] = useState(false);
    const [chartError, setChartError] = useState('');
    const [timeFilter, setTimeFilter] = useState(savedState.timeFilter);
    const [showIndicators, setShowIndicators] = useState(true);
    const searchRef = useRef<HTMLDivElement>(null);

    // State for Comparables
    const [compInput, setCompInput] = useState('');
    const [compTickers, setCompTickers] = useState<string[]>(savedState.compTickers);
    const [includeFiltered, setIncludeFiltered] = useState(savedState.includeFiltered || false);

    // Derived data for autocomplete/validation
    const availableTickers = useMemo(() => {
        return data.map(row => row['Ticker']?.toString().toUpperCase()).filter(Boolean);
    }, [data]);

    // Filtered suggestions based on search input
    const filteredSuggestions = useMemo(() => {
        if (!searchInput) return [];
        return availableTickers
            .filter(ticker => ticker.includes(searchInput))
            .slice(0, 10); // Limit to 10 suggestions
    }, [searchInput, availableTickers]);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_ANALYSIS, JSON.stringify({
                selectedTicker,
                searchInput,
                compTickers,
                timeFilter,
                includeFiltered,
            }));
        } catch (error) {
            console.error('Failed to save analysis state:', error);
        }
    }, [selectedTicker, searchInput, compTickers, timeFilter, includeFiltered]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Effect to load chart data when ticker changes
    useEffect(() => {
        if (selectedTicker && availableTickers.includes(selectedTicker)) {
            loadChartData(selectedTicker, timeFilter);
        }
    }, [selectedTicker, timeFilter]);

    const loadChartData = async (sym: string, range: string) => {
        setChartLoading(true);
        setChartError('');
        try {
            const result = await fetchChartData(sym, range);
            setChartData(result);
        } catch (err) {
            setChartError('Failed to load chart data');
            console.error(err);
        } finally {
            setChartLoading(false);
        }
    };

    const handleSearchChange = (value: string) => {
        const upperValue = value.toUpperCase();
        setSearchInput(upperValue);
        setShowSuggestions(true);

        // If the value exactly matches an available ticker, select it
        if (availableTickers.includes(upperValue)) {
            setSelectedTicker(upperValue);
            // Don't auto-add to comparables - user decides separately
        }
    };

    const selectTicker = (ticker: string) => {
        setSearchInput(ticker);
        setSelectedTicker(ticker);
        setShowSuggestions(false);
        // Don't auto-add to comparables anymore - user will add separately
    };

    const handleAddComp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!compInput.trim()) return;

        const newTickers = compInput
            .split(',')
            .map(t => t.trim().toUpperCase())
            .filter(t => t && availableTickers.includes(t) && !compTickers.includes(t));

        if (newTickers.length > 0) {
            setCompTickers(prev => [...prev, ...newTickers]);
        }
        setCompInput('');
    };

    const removeComp = (ticker: string) => {
        setCompTickers(prev => prev.filter(t => t !== ticker));
    };

    // Calculate Comparable Data from Uploaded Data
    // Only show comparable companies (exclude the selected ticker)
    const comparableRows = useMemo(() => {
        // Start with manually added tickers
        const allTickers = new Set(compTickers);

        // If dynamic sync is enabled, add all filtered tickers
        if (includeFiltered) {
            filteredData.forEach(row => {
                const t = row['Ticker']?.toString().toUpperCase();
                if (t) allTickers.add(t);
            });
        }

        return data.filter(row => {
            const ticker = row['Ticker']?.toString().toUpperCase();
            // Exclude the selected ticker itself from comparables
            if (ticker === selectedTicker) return false;
            return ticker && allTickers.has(ticker);
        });
    }, [data, compTickers, includeFiltered, filteredData, selectedTicker]);

    // Get the selected company row (shown separately at the top)
    const selectedCompanyRow = useMemo(() => {
        if (!selectedTicker) return null;
        return data.find(row => row['Ticker']?.toString().toUpperCase() === selectedTicker);
    }, [data, selectedTicker]);

    const numericColumns = useMemo(() => {
        if (comparableRows.length === 0 && !selectedCompanyRow) return [];
        const first = selectedCompanyRow || comparableRows[0];

        // Filter to only show the specific comparable columns that exist in the data
        const filteredColumns = COMPARABLE_COLUMNS.filter(col => col in first);

        // If none of the specified columns exist, show all available columns
        if (filteredColumns.length === 0) {
            return Object.keys(first);
        }

        return filteredColumns;
    }, [comparableRows, selectedCompanyRow]);

    // Calculate summary rows ONLY from comparable companies (not including selected ticker)
    const summaryRows = useMemo(() => {
        if (comparableRows.length === 0 || numericColumns.length === 0) return null;

        const averages: Record<string, any> = { Ticker: 'AVERAGE' };
        const medians: Record<string, any> = { Ticker: 'MEDIAN' };

        numericColumns.forEach(col => {
            const values = comparableRows
                .map(row => Number(row[col]))
                .filter(v => !isNaN(v));

            if (values.length > 0) {
                // Average
                const sum = values.reduce((a, b) => a + b, 0);
                averages[col] = sum / values.length;

                // Median
                values.sort((a, b) => a - b);
                const mid = Math.floor(values.length / 2);
                medians[col] = values.length % 2 !== 0
                    ? values[mid]
                    : (values[mid - 1] + values[mid]) / 2;
            }
        });

        return { averages, medians };
    }, [comparableRows, numericColumns]);

    const formatValue = (val: any, columnName?: string) => {
        if (val === null || val === undefined || val === '') return '-';

        // Handle non-numeric values
        if (typeof val !== 'number' && isNaN(Number(val))) {
            return val;
        }

        const numVal = typeof val === 'number' ? val : Number(val);

        // Helper for thousand separators with fixed decimals
        const fmt = (n: number, d: number = 1) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

        // If we have a column name, format based on the column type
        if (columnName) {
            // Revenue columns - format as currency
            if (columnName.includes('Revenue') || columnName.includes('Market Cap')) {
                // If it's a growth column, skip this block and go to percentage
                if (!columnName.includes('Growth')) {
                    // If value is huge (> 1B), it's raw units -> format as B/M
                    if (numVal >= 1e9) return `$${fmt(numVal / 1e9)}B`;
                    if (numVal >= 1e6) return `$${fmt(numVal / 1e6)}M`;

                    // If value is "small" (e.g. 989), it's likely ALREADY in Millions
                    return `$${fmt(numVal)}M`;
                }
            }

            // Growth and Margin columns - format as percentage
            if (columnName.includes('Growth') || columnName.includes('Margin')) {
                return `${fmt(numVal * 100)}%`;
            }

            // EV multiples - format as multiples
            if (columnName.includes('EV/')) {
                return `${fmt(numVal)}x`;
            }

            // Default formatting if columnName was provided but no specific rule matched
            if (numVal > 1000000) return fmt(numVal / 1000000) + 'M';
            if (numVal > 1000) return fmt(numVal / 1000) + 'k';
            return fmt(numVal);
        }

        // Fallback for generic numbers if no column name or no specific rule applied
        if (numVal > 1000000) return (numVal / 1000000).toFixed(1) + 'M';
        if (numVal > 1000) return (numVal / 1000).toFixed(1) + 'k';
        return numVal.toFixed(1);
    };

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (column: string) => {
        setSortConfig(current => {
            if (!current || current.column !== column) {
                return { column, direction: 'asc' };
            }
            if (current.direction === 'asc') {
                return { column, direction: 'desc' };
            }
            return null;
        });
    };

    // Sort the comparable rows
    const sortedComparableRows = useMemo(() => {
        if (!sortConfig) return comparableRows;

        return [...comparableRows].sort((a, b) => {
            const aVal = a[sortConfig.column];
            const bVal = b[sortConfig.column];

            // Handle nulls
            if (aVal === null || aVal === undefined || aVal === '') return 1;
            if (bVal === null || bVal === undefined || bVal === '') return -1;

            // Numeric sort
            const aNum = Number(aVal);
            const bNum = Number(bVal);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // String sort
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            return sortConfig.direction === 'asc'
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr);
        });
    }, [comparableRows, sortConfig]);

    return (
        <div className="space-y-8">
            {/* Filter Bar */}
            <FilterBar
                criteria={criteria}
                columns={columns}
                data={data}
                onUpdateCriteria={onUpdateCriteria}
            />
            {/* Header & Ticker Selection */}
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Analysis</h2>
                    <p className="text-slate-500 text-sm">Select a company to analyze and compare</p>
                </div>

                <div ref={searchRef} className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Search Ticker..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-accent"
                    />

                    {/* Custom Suggestions Dropdown */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {filteredSuggestions.map(ticker => (
                                <button
                                    key={ticker}
                                    onClick={() => selectTicker(ticker)}
                                    className="w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-800 transition-colors"
                                >
                                    {ticker}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chart Section */}
            {selectedTicker && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg">
                            {TIME_FILTERS.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setTimeFilter(filter)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${timeFilter === filter
                                        ? 'bg-slate-700 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                        }`}
                                >
                                    {filter.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowIndicators(!showIndicators)}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            {showIndicators ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showIndicators ? 'Hide Indicators' : 'Show Indicators'}
                        </button>
                    </div>

                    {/* Price Chart */}
                    <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/20">
                        {chartLoading ? (
                            <div className="h-[400px] flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            </div>
                        ) : chartError ? (
                            <div className="h-[400px] flex items-center justify-center text-red-400">
                                {chartError}
                            </div>
                        ) : (
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#94a3b8"
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            minTickGap={50}
                                        />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            stroke="#94a3b8"
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                                            formatter={(value: number, name: string) => [`$${value.toFixed(1)}`, name]}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="close" stroke="#f8fafc" strokeWidth={2} dot={false} name="Price" />
                                        <Line type="monotone" dataKey="sma10" stroke="#38bdf8" strokeWidth={1.5} dot={false} name="SMA 10" />
                                        <Line type="monotone" dataKey="sma50" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="SMA 50" />
                                        <Line type="monotone" dataKey="sma200" stroke="#f87171" strokeWidth={1.5} dot={false} name="SMA 200" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Indicators (RSI & MACD) */}
                    {showIndicators && !chartLoading && !chartError && (
                        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2">
                            {/* RSI */}
                            <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/20">
                                <h3 className="text-sm font-semibold mb-2 text-slate-400">RSI (14)</h3>
                                <div className="h-[150px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                                                formatter={(value: number) => [value.toFixed(1), 'RSI']}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                            />
                                            <ReferenceLine y={70} stroke="#f87171" strokeDasharray="3 3" />
                                            <ReferenceLine y={30} stroke="#4ade80" strokeDasharray="3 3" />
                                            <Line type="monotone" dataKey="rsi" stroke="#c084fc" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* MACD */}
                            <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/20">
                                <h3 className="text-sm font-semibold mb-2 text-slate-400">MACD (12, 26, 9)</h3>
                                <div className="h-[150px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                                                formatter={(value: number, name: string) => [value.toFixed(2), name]}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                            />
                                            <Bar dataKey="macdHistogram" fill="#94a3b8" opacity={0.5} name="Histogram" />
                                            <Line type="monotone" dataKey="macd" stroke="#60a5fa" strokeWidth={2} dot={false} name="MACD" />
                                            <Line type="monotone" dataKey="macdSignal" stroke="#f472b6" strokeWidth={2} dot={false} name="Signal" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Comparables Section */}
            <div className="space-y-4 pt-8 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-100">Comparables</h3>
                </div>

                {/* Add Comp Input */}
                <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/20">
                    <form onSubmit={handleAddComp} className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                Add Tickers from Uploaded Data
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={compInput}
                                    onChange={(e) => setCompInput(e.target.value)}
                                    placeholder="e.g. AAPL, MSFT (must exist in uploaded file)"
                                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-accent text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={!compInput.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>
                    </form>

                    {/* Add Filtered Data Toggle */}
                    <div className="mt-4 pt-4 border-t border-slate-800">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={includeFiltered}
                                    onChange={(e) => setIncludeFiltered(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            </div>
                            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                Dynamically include all {filteredData.length} filtered companies
                            </span>
                        </label>
                        <p className="mt-1 text-xs text-slate-500 pl-14">
                            If enabled, the comparables table will automatically update when you change filters.
                        </p>
                    </div>

                    {/* Active Tags */}
                    {compTickers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {compTickers.map(t => (
                                <div key={t} className="flex items-center gap-1 px-3 py-1 bg-slate-800 text-slate-200 rounded-full text-xs border border-slate-700">
                                    <span>{t}</span>
                                    <button onClick={() => removeComp(t)} className="hover:text-red-400">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Data Table */}
                {(selectedCompanyRow || comparableRows.length > 0) ? (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
                                    <tr>
                                        {numericColumns.map(col => (
                                            <th
                                                key={col}
                                                className="px-6 py-4 font-medium max-w-[150px] break-words cursor-pointer hover:bg-slate-800/50 transition-colors group select-none"
                                                onClick={() => handleSort(col)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{col}</span>
                                                    {sortConfig?.column === col ? (
                                                        sortConfig.direction === 'asc' ? (
                                                            <ArrowUp className="w-3 h-3 text-accent" />
                                                        ) : (
                                                            <ArrowDown className="w-3 h-3 text-accent" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {/* Selected Company Row - Highlighted */}
                                    {selectedCompanyRow && (
                                        <tr className="bg-accent/10 border-b-2 border-accent/30">
                                            {numericColumns.map(col => (
                                                <td key={col} className="px-6 py-4 whitespace-nowrap text-white font-medium">
                                                    {formatValue(selectedCompanyRow[col], col)}
                                                </td>
                                            ))}
                                        </tr>
                                    )}

                                    {/* Summary Rows - Moved to top (after selected) */}
                                    {summaryRows && comparableRows.length > 0 && (
                                        <>
                                            <tr className="bg-slate-800/50 font-medium border-b border-slate-700">
                                                {numericColumns.map(col => (
                                                    <td key={col} className="px-6 py-4 whitespace-nowrap text-emerald-400">
                                                        {col === 'Ticker' ? 'AVERAGE' : formatValue(summaryRows.averages[col] ?? '', col)}
                                                    </td>
                                                ))}
                                            </tr>
                                            <tr className="bg-slate-800/50 font-medium border-b-2 border-slate-700">
                                                {numericColumns.map(col => (
                                                    <td key={col} className="px-6 py-4 whitespace-nowrap text-emerald-400">
                                                        {col === 'Ticker' ? 'MEDIAN' : formatValue(summaryRows.medians[col] ?? '', col)}
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}

                                    {/* Comparable Companies - Sorted */}
                                    {sortedComparableRows.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                            {numericColumns.map(col => (
                                                <td key={col} className="px-6 py-4 whitespace-nowrap text-slate-300">
                                                    {formatValue(row[col], col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                        <p className="text-sm">Select a ticker above and add comparable companies to view the analysis</p>
                    </div>
                )}
            </div>
        </div>
    );
}
