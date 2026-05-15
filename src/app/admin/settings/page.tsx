"use client";

import Link from "next/link";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your preferences and system configuration</p>
      </div>

      <Link
        href="/admin/setup"
        className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5 hover:bg-blue-100 transition-colors group"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-lg">
          ⚙
        </div>
        <div className="flex-1">
          <p className="font-semibold text-blue-900 group-hover:underline">System Configuration</p>
          <p className="text-sm text-blue-700 mt-0.5">
            API keys, WhatsApp credentials, Gemini AI, payment gateways, and feature flags
          </p>
        </div>
        <span className="text-blue-400 text-lg mt-0.5">→</span>
      </Link>

      <NotificationPreferencesPanel />
    </div>
  );
}
