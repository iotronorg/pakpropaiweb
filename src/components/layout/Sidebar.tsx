"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  admin: [
    { label: "Overview",    href: "/admin",              icon: "⬛" },
    { label: "System Setup",href: "/admin/setup",        icon: "⚙️" },
    { label: "Clients",     href: "/admin/clients",      icon: "💬" },
    { label: "Agents",      href: "/admin/agents",       icon: "🏢" },
    { label: "Developers",  href: "/admin/developers",   icon: "🏗️" },
    { label: "Admins",      href: "/admin/admins",       icon: "🔑" },
    { label: "Properties",  href: "/admin/properties",   icon: "🏠" },
    { label: "Verification",href: "/admin/verification", icon: "✅" },
    { label: "Deal Locks",  href: "/admin/deals",        icon: "🔒" },
    { label: "Fraud Monitor",href: "/admin/fraud",       icon: "🚨" },
  ],
  agent: [
    { label: "Overview", href: "/agent", icon: "⬛" },
    { label: "My Leads", href: "/agent/leads", icon: "📋" },
    { label: "My Listings", href: "/agent/listings", icon: "🏠" },
    { label: "My Profile", href: "/agent/profile", icon: "👤" },
  ],
  developer: [
    { label: "Overview", href: "/developer", icon: "⬛" },
    { label: "Inventory", href: "/developer/inventory", icon: "🏗️" },
    { label: "Lead Analytics", href: "/developer/leads", icon: "📊" },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  agent: "Agent",
  developer: "Developer",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const role = user?.role ?? "admin";
  const items = NAV_ITEMS[role] ?? [];

  function handleLogout() {
    clearAuth();
    document.cookie = "access_token=; Max-Age=0; path=/";
    document.cookie = "user_role=; Max-Age=0; path=/";
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <span className="text-xl font-bold text-blue-700">PakProp</span>
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">AI</span>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {ROLE_LABELS[role]}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 px-5 py-4">
        <p className="text-sm font-medium text-gray-800">{user?.name || user?.phone}</p>
        <p className="text-xs text-gray-400">{user?.phone}</p>
        <button
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
