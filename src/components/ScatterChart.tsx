import React, { useState, useMemo, useEffect } from 'react';
import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { DataRow } from '../types';
import { detectColumnFormat, formatValue } from '../lib/formatUtils';

interface ScatterChartProps {
    data: DataRow[];
    columns: string[];
    chartId?: string;
}

export const ScatterChart: React.FC<ScatterChartProps> = ({ data, columns, chartId = 'default' }) => {
    const STORAGE_KEY_CHART_AXES = `compsheet_chart_axes_${chartId}`;

    // Load saved axes from localStorage or use defaults
    const [xAxis, setXAxis] = useState<string>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_CHART_AXES);
            if (saved) {
                const { x } = JSON.parse(saved);
                return columns.includes(x) ? x : columns[0] || '';
            }
        } catch { }
        return columns[0] || '';
    });

    const [yAxis, setYAxis] = useState<string>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_CHART_AXES);
            if (saved) {
                const { y } = JSON.parse(saved);
                return columns.includes(y) ? y : columns[1] || '';
            }
        } catch { }
        return columns[1] || '';
    });

    // Save axes selection to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_CHART_AXES, JSON.stringify({ x: xAxis, y: yAxis }));
        } catch (error) {
            console.error('Failed to save chart axes:', error);
        }
    }, [xAxis, yAxis, STORAGE_KEY_CHART_AXES]);

    // Detect formats for selected axes
    const xFormat = useMemo(() => {
        const values = data.map(row => row[xAxis]).filter(v => v !== undefined && v !== '');
        return detectColumnFormat(xAxis, values);
    }, [data, xAxis]);

    const yFormat = useMemo(() => {
        const values = data.map(row => row[yAxis]).filter(v => v !== undefined && v !== '');
        return detectColumnFormat(yAxis, values);
    }, [data, yAxis]);

    // Filter data to ensure we have numeric values for the selected axes
    const chartData = useMemo(() => {
        return data
            .map(row => ({
                x: Number(row[xAxis]),
                y: Number(row[yAxis]),
                ticker: row['Ticker'] || row['Long Name'] || 'Unknown',
                fullRow: row
            }))
            .filter(item => !isNaN(item.x) && !isNaN(item.y));
    }, [data, xAxis, yAxis]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-slate-200 mb-1">{data.ticker}</p>
                    <p className="text-slate-400">{xAxis}: <span className="text-accent">{formatValue(data.x, xFormat)}</span></p>
                    <p className="text-slate-400">{yAxis}: <span className="text-accent">{formatValue(data.y, yFormat)}</span></p>
                </div>
            );
        }
        return null;
    };

    // Custom label component that shows ticker with smart positioning
    const renderLabel = (props: any) => {
        const { x, y, index } = props;
        const ticker = chartData[index]?.ticker || '';

        // Only show label if ticker is short (to avoid overlap)
        if (!ticker || ticker.length > 6) return null;

        return (
            <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={10}
                fontWeight={500}
            >
                {ticker}
            </text>
        );
    };

    // Format axis tick values
    const formatXTick = (value: number) => {
        if (xFormat === 'decimal') {
            // Multiples/ratios
            if (value >= 100) {
                return value.toFixed(0) + 'x';
            } else if (value >= 10) {
                return value.toFixed(0) + 'x';
            }
            return value.toFixed(1) + 'x';
        }
        if (xFormat === 'currency' && value >= 1000) {
            return '$' + (value / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'B';
        }
        if (xFormat === 'percentage' && value <= 1) {
            return (value * 100).toFixed(0) + '%';
        }
        return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    const formatYTick = (value: number) => {
        if (yFormat === 'decimal') {
            // Multiples/ratios
            if (value >= 100) {
                return value.toFixed(0) + 'x';
            } else if (value >= 10) {
                return value.toFixed(0) + 'x';
            }
            return value.toFixed(1) + 'x';
        }
        if (yFormat === 'currency' && value >= 1000) {
            return '$' + (value / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'B';
        }
        if (yFormat === 'percentage' && value <= 1) {
            return (value * 100).toFixed(0) + '%';
        }
        return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    return (
        <div className="bg-surface rounded-xl border border-slate-700/50 p-4 shadow-xl backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <select
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value)}
                    className="flex-1 min-w-[150px] bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-accent outline-none"
                >
                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <span className="text-slate-500 text-sm">vs</span>
                <select
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value)}
                    className="flex-1 min-w-[150px] bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:border-accent outline-none"
                >
                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
            </div>

            <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name={xAxis}
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickLine={{ stroke: '#334155' }}
                            axisLine={{ stroke: '#334155' }}
                            tickFormatter={formatXTick}
                            label={{ value: xAxis, position: 'bottom', offset: 0, style: { fill: '#94a3b8', fontSize: 12, fontWeight: 600 } }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name={yAxis}
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickLine={{ stroke: '#334155' }}
                            axisLine={{ stroke: '#334155' }}
                            tickFormatter={formatYTick}
                            label={{ value: yAxis, angle: -90, position: 'left', offset: 10, style: { fill: '#94a3b8', fontSize: 12, fontWeight: 600, textAnchor: 'middle' } }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Companies" data={chartData} fill="#3b82f6">
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill="#3b82f6" />
                            ))}
                            <LabelList dataKey="ticker" content={renderLabel} />
                        </Scatter>
                    </RechartsScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
