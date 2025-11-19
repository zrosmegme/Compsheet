import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FileUpload } from './components/FileUpload';
import { Navigation } from './components/Navigation';
import { OverviewPage } from './pages/OverviewPage';
import { ChartsPage } from './pages/ChartsPage';
import { DataPage } from './pages/DataPage';
import { AnalysisPage } from './pages/AnalysisPage';
import type { Criterion, DataRow } from './types';
import { RefreshCw } from 'lucide-react';
import { detectColumnFormat } from './lib/formatUtils';
import defaultData from './data/default-data.json';

const STORAGE_KEY_CRITERIA = 'compsheet_criteria';
const STORAGE_KEY_DATA = 'compsheet_data';

function App() {
  const [data, setData] = useState<DataRow[]>(() => {
    // Load saved data from localStorage on mount, or use default data
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      if (saved) {
        return JSON.parse(saved);
      }
      // If no saved data, use the default dataset
      return defaultData as DataRow[];
    } catch {
      return defaultData as DataRow[];
    }
  });

  const [criteria, setCriteria] = useState<Criterion[]>(() => {
    // Load saved criteria from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CRITERIA);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(key => key !== 'Ticker' && key !== 'Long Name');
  }, [data]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      if (data.length > 0) {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [data]);

  // Save criteria to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CRITERIA, JSON.stringify(criteria));
    } catch (error) {
      console.error('Failed to save criteria:', error);
    }
  }, [criteria]);

  const filteredData = useMemo(() => {
    // Apply ALL criteria regardless of 'active' status (checkbox only controls column visibility)
    // Filter out criteria that have no values set to avoid unnecessary processing
    const effectiveCriteria = criteria.filter(c =>
      (c.min !== undefined && c.min !== '') ||
      (c.max !== undefined && c.max !== '') ||
      (c.text !== undefined && c.text.trim() !== '')
    );

    if (effectiveCriteria.length === 0) return data;

    // Pre-calculate data format for percentage columns using the SHARED utility
    const columnIsDecimal = new Map<string, boolean>();

    if (data.length > 0) {
      effectiveCriteria.forEach(c => {
        // Get all values for this column to pass to detector
        const values = data.map(r => r[c.column]).filter(v => v !== undefined && v !== '');
        const format = detectColumnFormat(c.column, values);

        if (format === 'percentage_decimal') {
          columnIsDecimal.set(c.column, true);
        }
      });
    }

    return data.filter(row => {
      // ALL effective criteria must be satisfied (AND logic)
      return effectiveCriteria.every(c => {
        const val = row[c.column];

        // Determine if we have numeric or text filters
        const hasMinFilter = c.min !== undefined && c.min !== '';
        const hasMaxFilter = c.max !== undefined && c.max !== '';
        const hasTextFilter = c.text !== undefined && c.text.trim() !== '';

        // If no filters are set on this criterion, pass (shouldn't happen but safety check)
        if (!hasMinFilter && !hasMaxFilter && !hasTextFilter) {
          return true;
        }

        // If value is empty and we have filters, exclude it
        if (val === undefined || val === null || val === '') {
          return false;
        }

        // Check numeric filters (min/max) if present
        if (hasMinFilter || hasMaxFilter) {
          let numVal = Number(val);

          // Handle formatted strings (e.g. "$1,000", "50%", "100M") by stripping non-numeric chars
          if (isNaN(numVal) && typeof val === 'string') {
            // Keep only digits, decimal point, and minus sign
            const clean = val.replace(/[^0-9.\-]/g, '');
            numVal = Number(clean);
          }

          // If value can't be parsed as number, fail this criterion
          if (isNaN(numVal)) {
            return false;
          }

          // Check min boundary
          if (hasMinFilter) {
            let min = Number(c.min);
            if (isNaN(min) && typeof c.min === 'string') {
              const cleanMin = c.min.replace(/[^0-9.\-]/g, '');
              min = Number(cleanMin);
            }

            // Scale filter if data is decimal
            if (columnIsDecimal.get(c.column)) {
              min = min / 100;
            }

            if (isNaN(min) || numVal < min) {
              return false;
            }
          }

          // Check max boundary
          if (hasMaxFilter) {
            let max = Number(c.max);
            if (isNaN(max) && typeof c.max === 'string') {
              const cleanMax = c.max.replace(/[^0-9.\-]/g, '');
              max = Number(cleanMax);
            }

            // Scale filter if data is decimal
            if (columnIsDecimal.get(c.column)) {
              max = max / 100;
            }

            if (isNaN(max) || numVal > max) {
              return false;
            }
          }
        }

        // Check text filter if present
        if (hasTextFilter) {
          const strVal = String(val).toLowerCase();
          const searchStr = c.text!.toLowerCase();
          if (!strVal.includes(searchStr)) {
            return false;
          }
        }

        return true;
      });
    });
  }, [data, criteria]);

  const handleDataLoaded = (newData: DataRow[]) => {
    setData(newData);
    // Keep existing criteria when new data is loaded
  };

  const handleReset = () => {
    setData([]);
    setCriteria([]);
    try {
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_CRITERIA);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  };

  // Helper to protect routes that need data
  const RequireData = ({ children }: { children: React.ReactElement }) => {
    if (data.length === 0) {
      return (
        <div className="max-w-xl mx-auto mt-20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-3">
              Compsheet
            </h1>
            <p className="text-slate-500">Advanced Data Filtering & Visualization</p>
          </div>
          <FileUpload onDataLoaded={handleDataLoaded} />
        </div>
      );
    }
    return children;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-accent/30 flex">
        {/* Left Navigation */}
        <Navigation />

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header - Only show if we have data or on specific pages? 
                Actually, let's show header always but modify content based on context.
                For now, I'll keep it simple. If no data, the header might look empty.
            */}
            {data.length > 0 && (
              <header className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">
                    {data.length.toLocaleString()} Companies Loaded
                  </h2>
                  <p className="text-sm text-slate-500">
                    {filteredData.length.toLocaleString()} matching current filters
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  New Upload
                </button>
              </header>
            )}

            {/* Routes */}
            <Routes>
              <Route
                path="/"
                element={
                  <RequireData>
                    <OverviewPage
                      data={data}
                      filteredData={filteredData}
                      criteria={criteria}
                      columns={columns}
                      onUpdateCriteria={setCriteria}
                    />
                  </RequireData>
                }
              />
              <Route
                path="/charts"
                element={
                  <RequireData>
                    <ChartsPage
                      data={filteredData}
                      fullData={data}
                      columns={columns}
                      criteria={criteria}
                      onUpdateCriteria={setCriteria}
                    />
                  </RequireData>
                }
              />
              <Route
                path="/data"
                element={
                  <RequireData>
                    <DataPage
                      data={data}
                    />
                  </RequireData>
                }
              />
              <Route
                path="/analysis"
                element={
                  <RequireData>
                    <AnalysisPage
                      data={data}
                      filteredData={filteredData}
                      criteria={criteria}
                      columns={columns}
                      onUpdateCriteria={setCriteria}
                    />
                  </RequireData>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
