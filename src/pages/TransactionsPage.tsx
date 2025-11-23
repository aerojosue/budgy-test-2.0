import { CreditCard } from 'lucide-react';

export function TransactionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
        <p className="text-gray-400">View and manage your transactions</p>
      </div>

      <div className="glass-panel rounded-xl p-12 text-center">
        <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Transactions Coming Soon</h3>
        <p className="text-gray-400">This feature is under development</p>
      </div>
    </div>
  );
}
