import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Table2, LayoutDashboard, LineChart } from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { path: '/', label: 'Filtered Data', icon: LayoutDashboard },
    { path: '/charts', label: 'Charts', icon: BarChart3 },
    { path: '/analysis', label: 'Analysis', icon: LineChart },
    { path: '/data', label: 'Raw Data', icon: Table2 },
];

export function Navigation() {
    const location = useLocation();

    return (
        <nav className="w-64 min-h-screen bg-slate-900/50 border-r border-slate-800 p-4 flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-3 py-4 mb-8">
                <div className="p-2 bg-accent/10 rounded-lg">
                    <LayoutDashboard className="w-6 h-6 text-accent" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Compsheet
                    </h1>
                    <p className="text-xs text-slate-500">Data Analytics</p>
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all',
                                isActive
                                    ? 'bg-accent/10 text-accent shadow-lg shadow-accent/5'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800">
                <div className="px-3 py-2 text-xs text-slate-500">
                    Compsheet v1.0
                </div>
            </div>
        </nav>
    );
}
