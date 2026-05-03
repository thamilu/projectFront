'use client';

import { memo } from 'react';
import { Settings } from 'lucide-react';
import { useSettingsStore } from '@/store/settings-store';

export const SettingsButton = memo(function SettingsButton() {
  const setSidebarOpen = useSettingsStore((state) => state.setSidebarOpen);

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      className="fixed right-4 bottom-4 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group"
      aria-label="Open Settings"
    >
      <Settings className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
    </button>
  );
});
