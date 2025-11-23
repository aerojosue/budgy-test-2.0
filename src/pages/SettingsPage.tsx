import { useState } from 'react';
import { Settings, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';
import { seedUserData } from '@/lib/seedData';
import { useQueryClient } from '@tanstack/react-query';

export function SettingsPage() {
  const { user } = useAuth();
  const { data: household } = useHousehold();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeedData = async () => {
    if (!user || !household) {
      setMessage('Please wait for user data to load');
      return;
    }

    setLoading(true);
    setMessage('Creating seed data...');

    try {
      const result = await seedUserData(user.id, household.id);
      if (result.success) {
        setMessage('✅ Seed data created successfully! Refreshing...');

        // Invalidate all queries to refetch data
        await queryClient.invalidateQueries({ queryKey: ['accounts'] });
        await queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
        await queryClient.invalidateQueries({ queryKey: ['transactions'] });

        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        setMessage('❌ Error creating seed data. Check console for details.');
      }
    } catch (error) {
      console.error('Seed error:', error);
      setMessage('❌ Error creating seed data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      <div className="glass-panel rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-primary-400" />
          <h2 className="text-xl font-bold text-white">Development Tools</h2>
        </div>

        <p className="text-gray-400 mb-6">
          Generate realistic seed data to test the application with sample accounts,
          transactions, and installment payments.
        </p>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.includes('✅')
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : message.includes('❌')
              ? 'bg-red-500/10 border border-red-500/50 text-red-400'
              : 'bg-primary-500/10 border border-primary-500/50 text-primary-400'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleSeedData}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Database className="w-5 h-5" />
          {loading ? 'Creating Seed Data...' : 'Generate Seed Data'}
        </button>

        <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">What gets created:</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• 4 Accounts: Chase Checking (USD), Nubank Card (BRL), Galicia Visa (ARS), Cash Wallet (USD)</li>
            <li>• 8 Categories: Salary, Freelance, Groceries, Transportation, Restaurants, Shopping, Entertainment, Bills</li>
            <li>• Exchange Rates: USD/ARS (1:1000), USD/BRL (1:5)</li>
            <li>• Multiple transactions across different currencies</li>
            <li>• 1 Credit card purchase with 6 installments (Cuotas)</li>
          </ul>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-12 text-center">
        <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">More Settings Coming Soon</h3>
        <p className="text-gray-400">Additional configuration options are under development</p>
      </div>
    </div>
  );
}
