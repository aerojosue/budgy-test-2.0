import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useHousehold } from '@/hooks/useHousehold';
import { formatCurrency } from '@/lib/utils';
import { Plus, Filter, X, Calendar } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Decimal from 'decimal.js';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  description: string | null;
  is_installment: boolean;
  accounts: { name: string; id: string } | null;
  categories: { name: string; type: string; icon: string; color: string } | null;
  to_account_id: string | null;
}

export function TransactionsPage() {
  const [showModal, setShowModal] = useState(false);
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    currency: 'USD',
    category_id: '',
    account_id: '',
    to_account_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const { data: household } = useHousehold();
  const queryClient = useQueryClient();

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

  const { data: categories } = useQuery({
    queryKey: ['categories', household?.id],
    queryFn: async () => {
      if (!household) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', household.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!household,
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', household?.id, filterAccount, filterType],
    queryFn: async () => {
      if (!household) return [];

      let query = supabase
        .from('transactions')
        .select('*, accounts(name, id), categories(name, type, icon, color)')
        .eq('household_id', household.id)
        .order('date', { ascending: false });

      if (filterAccount !== 'all') {
        query = query.eq('account_id', filterAccount);
      }

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Transaction[];
    },
    enabled: !!household,
  });

  const createTransaction = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('=== CREATE TRANSACTION START ===');
      console.log('Form data:', data);
      console.log('Household:', household);
      console.log('Available accounts:', accounts);

      if (!household) {
        console.error('ERROR: No household found!');
        alert('Error: No household ID found. Please refresh the page and try again.');
        throw new Error('No household');
      }

      const account = accounts?.find((a) => a.id === data.account_id);
      if (!account) {
        console.error('ERROR: Account not found!');
        alert('Error: Selected account not found. Please try again.');
        throw new Error('Account not found');
      }

      console.log('Selected account:', account);

      const amount = parseFloat(data.amount);

      const txData = {
        household_id: household.id,
        account_id: data.account_id,
        category_id: data.category_id || null,
        to_account_id: data.to_account_id || null,
        amount: amount,
        currency: data.currency,
        date: data.date,
        type: data.type,
        description: data.description || null,
        is_installment: false,
      };

      console.log('Inserting transaction:', txData);

      const { data: newTransaction, error: txError } = await supabase
        .from('transactions')
        .insert(txData)
        .select()
        .single();

      if (txError) {
        console.error('Transaction insert error:', txError);
        alert(`Error creating transaction: ${txError.message}`);
        throw txError;
      }

      console.log('Transaction created:', newTransaction);

      let newBalance: number;
      if (data.type === 'income') {
        newBalance = new Decimal(account.balance).plus(amount).toNumber();
      } else if (data.type === 'expense') {
        newBalance = new Decimal(account.balance).minus(amount).toNumber();
      } else {
        newBalance = new Decimal(account.balance).minus(amount).toNumber();

        if (data.to_account_id) {
          const toAccount = accounts?.find((a) => a.id === data.to_account_id);
          if (toAccount) {
            const toNewBalance = new Decimal(toAccount.balance).plus(amount).toNumber();
            console.log('Updating destination account balance:', toNewBalance);
            await supabase
              .from('accounts')
              .update({ balance: toNewBalance })
              .eq('id', data.to_account_id);
          }
        }
      }

      console.log('Updating account balance:', newBalance);

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', data.account_id);

      if (updateError) {
        console.error('Balance update error:', updateError);
        alert(`Error updating account balance: ${updateError.message}`);
        throw updateError;
      }

      console.log('Transaction completed successfully');
      return newTransaction;
    },
    onSuccess: () => {
      console.log('=== CREATE TRANSACTION SUCCESS ===');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
      setShowModal(false);
      setFormData({
        type: 'expense',
        amount: '',
        currency: 'USD',
        category_id: '',
        account_id: '',
        to_account_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    },
    onError: (error) => {
      console.error('=== CREATE TRANSACTION ERROR ===');
      console.error('Error details:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== TRANSACTION FORM SUBMIT ===');
    console.log('Household available:', !!household);
    console.log('Form data:', formData);
    console.log('Available accounts:', accounts?.length || 0);

    if (!household) {
      console.error('Cannot submit: No household');
      alert('Error: No household ID found. Please refresh the page and try again.');
      return;
    }

    if (!formData.account_id) {
      alert('Please select an account');
      return;
    }

    if (!accounts || accounts.length === 0) {
      alert('No accounts available. Please create an account first.');
      return;
    }

    createTransaction.mutate(formData);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[
      iconName.split('-').map((word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('')
    ];
    return IconComponent || LucideIcons.Circle;
  };

  const filteredCategories = categories?.filter(
    (cat) => cat.type === formData.type || formData.type === 'transfer'
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-gray-400">Track all your financial transactions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Transaction
        </button>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Accounts</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Account</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {transactions.map((tx) => {
                  const Icon = tx.categories?.icon ? getIcon(tx.categories.icon) : LucideIcons.Circle;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(tx.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: tx.categories?.color
                                ? `${tx.categories.color}20`
                                : '#7c3aed20',
                            }}
                          >
                            <Icon
                              className="w-4 h-4"
                              style={{ color: tx.categories?.color || '#7c3aed' }}
                            />
                          </div>
                          <span className="text-white font-medium">
                            {tx.categories?.name || 'Uncategorized'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {tx.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {tx.accounts?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-semibold ${
                            tx.type === 'income'
                              ? 'text-income-400'
                              : tx.type === 'expense'
                              ? 'text-expense-400'
                              : 'text-primary-400'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                          {formatCurrency(tx.amount, tx.currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No transactions found</p>
            <p className="text-sm text-gray-500 mt-2">
              Create your first transaction to get started
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">New Transaction</h2>
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
                  Transaction Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'income' | 'expense' | 'transfer',
                      category_id: '',
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {formData.type === 'transfer' ? 'From Account' : 'Account'}
                </label>
                {!accounts || accounts.length === 0 ? (
                  <div className="w-full px-4 py-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
                    No accounts found. Please create an account first in the Accounts page.
                  </div>
                ) : (
                  <select
                    value={formData.account_id}
                    onChange={(e) => {
                      const account = accounts?.find((a) => a.id === e.target.value);
                      setFormData({
                        ...formData,
                        account_id: e.target.value,
                        currency: account?.currency || 'USD',
                      });
                    }}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                    required
                  >
                    <option value="">Select account</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {formData.type === 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    To Account
                  </label>
                  <select
                    value={formData.to_account_id}
                    onChange={(e) =>
                      setFormData({ ...formData, to_account_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  >
                    <option value="">Select account</option>
                    {accounts
                      ?.filter((a) => a.id !== formData.account_id)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {formData.type !== 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  >
                    <option value="">Select category</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                  placeholder="Add a note..."
                />
              </div>

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
                  disabled={createTransaction.isPending}
                  className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {createTransaction.isPending ? 'Creating...' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
