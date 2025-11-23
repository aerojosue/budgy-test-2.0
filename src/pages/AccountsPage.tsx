import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHousehold } from '@/hooks/useHousehold';
import { formatCurrency } from '@/lib/utils';
import { Plus, Wallet, Building2, CreditCard, Bitcoin, X } from 'lucide-react';
import { CURRENCIES, ACCOUNT_TYPES } from '@/lib/constants';

export function AccountsPage() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as 'cash' | 'bank' | 'credit_card' | 'crypto',
    currency: 'USD',
    balance: '0',
    credit_limit: '',
    closing_day: '',
    due_day: '',
  });

  const { data: household } = useHousehold();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
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

  const createAccount = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!household) throw new Error('No household');

      const { error } = await supabase.from('accounts').insert({
        household_id: household.id,
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance: parseFloat(data.balance),
        credit_limit: data.credit_limit ? parseFloat(data.credit_limit) : null,
        closing_day: data.closing_day ? parseInt(data.closing_day) : null,
        due_day: data.due_day ? parseInt(data.due_day) : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setShowModal(false);
      setFormData({
        name: '',
        type: 'bank',
        currency: 'USD',
        balance: '0',
        credit_limit: '',
        closing_day: '',
        due_day: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAccount.mutate(formData);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return Wallet;
      case 'bank':
        return Building2;
      case 'credit_card':
        return CreditCard;
      case 'crypto':
        return Bitcoin;
      default:
        return Wallet;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Accounts</h1>
          <p className="text-gray-400">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Account
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const Icon = getAccountIcon(account.type);
            const availableCredit =
              account.type === 'credit_card' && account.credit_limit
                ? account.credit_limit - Math.abs(account.balance)
                : null;

            return (
              <div key={account.id} className="glass-panel glass-panel-hover rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-600/20 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{account.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">
                        {account.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Balance</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>

                  {account.type === 'credit_card' && (
                    <>
                      {account.credit_limit && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Credit Limit</p>
                          <p className="text-white font-semibold">
                            {formatCurrency(account.credit_limit, account.currency)}
                          </p>
                        </div>
                      )}
                      {availableCredit !== null && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Available Credit</p>
                          <p className="text-income-400 font-semibold">
                            {formatCurrency(availableCredit, account.currency)}
                          </p>
                        </div>
                      )}
                      {account.closing_day && (
                        <div className="flex justify-between">
                          <div>
                            <p className="text-gray-400 text-xs">Closing Day</p>
                            <p className="text-white font-medium">{account.closing_day}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Due Day</p>
                            <p className="text-white font-medium">{account.due_day}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-xl p-12 text-center">
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No accounts yet</h3>
          <p className="text-gray-400 mb-6">Create your first account to start tracking your finances</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Account
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Account</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  placeholder="My Savings Account"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as typeof formData.type,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  >
                    {ACCOUNT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  required
                />
              </div>

              {formData.type === 'credit_card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Credit Limit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.credit_limit}
                      onChange={(e) =>
                        setFormData({ ...formData, credit_limit: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                      placeholder="10000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Closing Day (1-31)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.closing_day}
                        onChange={(e) =>
                          setFormData({ ...formData, closing_day: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                        placeholder="15"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Due Day (1-31)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.due_day}
                        onChange={(e) =>
                          setFormData({ ...formData, due_day: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                        placeholder="25"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAccount.isPending}
                  className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {createAccount.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
