"use client";

import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

export default function DeveloperSettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your notification preferences</p>
      </div>
      <NotificationPreferencesPanel />
    </div>
  );
}
