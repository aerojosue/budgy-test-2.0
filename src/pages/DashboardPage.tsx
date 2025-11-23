import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHousehold } from '@/hooks/useHousehold';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import Decimal from 'decimal.js';

export function DashboardPage() {
  const { data: household } = useHousehold();

  const { data: accounts } = useQuery({
    queryKey: ['accounts', household?.id],
    queryFn: async () => {
      if (!household) return [];
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('household_id', household.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!household,
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['recent-transactions', household?.id],
    queryFn: async () => {
      if (!household) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*, accounts(name), categories(name, type, color)')
        .eq('household_id', household.id)
        .order('date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!household,
  });

  const totalBalance = accounts?.reduce((sum, account) => {
    return new Decimal(sum).plus(account.balance).toNumber();
  }, 0) || 0;

  const totalIncome = recentTransactions?.reduce((sum, tx) => {
    if (tx.type === 'income') {
      return new Decimal(sum).plus(tx.amount).toNumber();
    }
    return sum;
  }, 0) || 0;

  const totalExpenses = recentTransactions?.reduce((sum, tx) => {
    if (tx.type === 'expense') {
      return new Decimal(sum).plus(tx.amount).toNumber();
    }
    return sum;
  }, 0) || 0;

  const stats = [
    {
      title: 'Total Net Worth',
      value: formatCurrency(totalBalance, 'USD'),
      icon: Wallet,
      color: 'primary',
      change: '+12.5%',
    },
    {
      title: 'Monthly Income',
      value: formatCurrency(totalIncome, 'USD'),
      icon: TrendingUp,
      color: 'income',
      change: '+8.2%',
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(totalExpenses, 'USD'),
      icon: TrendingDown,
      color: 'expense',
      change: '-3.1%',
    },
    {
      title: 'Active Accounts',
      value: accounts?.length || 0,
      icon: CreditCard,
      color: 'primary',
      change: `${accounts?.length || 0} accounts`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your financial status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="glass-panel glass-panel-hover rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${
                    stat.color === 'primary'
                      ? 'bg-primary-600/20'
                      : stat.color === 'income'
                      ? 'bg-income-600/20'
                      : 'bg-expense-600/20'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      stat.color === 'primary'
                        ? 'text-primary-400'
                        : stat.color === 'income'
                        ? 'text-income-400'
                        : 'text-expense-400'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-400">{stat.change}</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Transactions</h2>
          <div className="space-y-4">
            {recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: tx.categories?.color
                          ? `${tx.categories.color}20`
                          : '#7c3aed20',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: tx.categories?.color || '#7c3aed',
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {tx.categories?.name || 'Uncategorized'}
                      </p>
                      <p className="text-xs text-gray-400">{tx.accounts?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.type === 'income' ? 'text-income-400' : 'text-expense-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No transactions yet</p>
                <p className="text-sm mt-2">Start by adding an account and recording transactions</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Accounts Overview</h2>
          <div className="space-y-4">
            {accounts && accounts.length > 0 ? (
              accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{account.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{account.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    <p className="text-xs text-gray-400">{account.currency}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No accounts yet</p>
                <p className="text-sm mt-2">Create your first account to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
