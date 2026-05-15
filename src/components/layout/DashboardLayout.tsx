"use client";

import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useAuthStore } from "@/store/auth";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-3">
          <div />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-4 w-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)]">{user?.phone}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
