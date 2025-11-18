import { useState, useMemo, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { CriteriaPanel } from './components/CriteriaPanel';
import { DataTable } from './components/DataTable';
import { ScatterChart } from './components/ScatterChart';
import type { Criterion, DataRow } from './types';
import { LayoutDashboard, RefreshCw } from 'lucide-react';

const STORAGE_KEY_CRITERIA = 'compsheet_criteria';
const STORAGE_KEY_DATA = 'compsheet_data';

function App() {
  const [data, setData] = useState<DataRow[]>(() => {
    // Load saved data from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DATA);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
    // If no active criteria, return all data
    const activeCriteria = criteria.filter(c => c.active);
    if (activeCriteria.length === 0) return data;

    return data.filter(row => {
      // ALL active criteria must be satisfied (AND logic)
      return activeCriteria.every(c => {
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

        // If we have numeric filters (min or max), treat as numeric comparison
        if (hasMinFilter || hasMaxFilter) {
          const numVal = Number(val);

          // If value can't be parsed as number, fail this criterion
          if (isNaN(numVal)) {
            return false;
          }

          // Check min boundary
          if (hasMinFilter) {
            const min = Number(c.min);
            if (isNaN(min) || numVal < min) {
              return false;
            }
          }

          // Check max boundary
          if (hasMaxFilter) {
            const max = Number(c.max);
            if (isNaN(max) || numVal > max) {
              return false;
            }
          }
        }

        // If we have text filter, check text matching
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
    // This allows users to apply the same filters to new data
  };

  const handleReset = () => {
    setData([]);
    setCriteria([]);
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_CRITERIA);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-accent/30">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl">
              <LayoutDashboard className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Compsheet
              </h1>
              <p className="text-slate-500 text-sm">Advanced Data Filtering & Visualization</p>
            </div>
          </div>
          {data.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              New Upload
            </button>
          )}
        </header>

        {/* Main Content */}
        {data.length === 0 ? (
          <div className="max-w-xl mx-auto mt-20">
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Top Row: Criteria & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5">
                <CriteriaPanel
                  criteria={criteria}
                  columns={columns}
                  data={data}
                  onUpdateCriteria={setCriteria}
                />
              </div>
              <div className="lg:col-span-7">
                <ScatterChart
                  data={filteredData}
                  columns={columns}
                />
              </div>
            </div>

            {/* Bottom Row: Data Table */}
            <DataTable
              data={filteredData}
              visibleColumns={criteria.filter(c => c.active).map(c => c.column)}
            />

          </div>
        )}
      </div>
    </div>
  );
}

export default App;
