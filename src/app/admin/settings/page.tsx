"use client";

import Link from "next/link";
import { Settings, ChevronRight } from "lucide-react";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { PasswordChangeCard } from "@/components/settings/PasswordChangeCard";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-lg space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Account Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Manage your preferences and system configuration</p>
      </div>

      <Link
        href="/admin/setup"
        className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5 hover:bg-blue-100 transition-colors group"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center" aria-hidden="true">
          <Settings size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-blue-900 group-hover:underline">System Configuration</p>
          <p className="text-sm text-blue-700 mt-0.5">
            API keys, WhatsApp credentials, Gemini AI, payment gateways, and feature flags
          </p>
        </div>
        <ChevronRight size={18} className="text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
      </Link>

      <NotificationPreferencesPanel />

      <PasswordChangeCard />
    </div>
  );
}
