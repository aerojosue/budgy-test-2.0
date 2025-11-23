import { TrendingUp } from 'lucide-react';

export function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
        <p className="text-gray-400">Financial insights and analytics</p>
      </div>

      <div className="glass-panel rounded-xl p-12 text-center">
        <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Reports Coming Soon</h3>
        <p className="text-gray-400">Advanced analytics and reports are under development</p>
      </div>
    </div>
  );
}
