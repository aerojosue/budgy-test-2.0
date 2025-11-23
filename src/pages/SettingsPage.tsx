import { Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      <div className="glass-panel rounded-xl p-12 text-center">
        <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Settings Coming Soon</h3>
        <p className="text-gray-400">Configuration options are under development</p>
      </div>
    </div>
  );
}
