import { NavLink } from 'react-router-dom';
import { Home, CreditCard, TrendingUp, Settings, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { signOut, profile } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/accounts', icon: Wallet, label: 'Accounts' },
    { to: '/transactions', icon: CreditCard, label: 'Transactions' },
    { to: '/reports', icon: TrendingUp, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 h-screen bg-gray-900/50 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">FinTrack</h1>
            <p className="text-xs text-gray-400">Multi-Currency Finance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="glass-panel rounded-lg p-4 mb-3">
          <p className="text-sm text-gray-400">Signed in as</p>
          <p className="text-white font-semibold truncate">{profile?.display_name}</p>
          <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
