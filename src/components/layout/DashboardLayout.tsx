"use client";

import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/ui/NotificationBell";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-end gap-2 border-b border-gray-100 bg-white px-6 py-2">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
