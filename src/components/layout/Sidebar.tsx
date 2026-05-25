"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { logout, getNotifications } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, TrendingUp, BarChart3, Settings, MessageSquare,
  ClipboardList, AlertTriangle, Calendar, Building2, Building,
  ShieldCheck, Home, GitCompare, BadgeCheck, Lock, AlertOctagon,
  FileBarChart, FileText, FolderOpen, Bell, Settings2, Users, User,
  LogOut, ChevronRight, SlidersHorizontal, Bot, Megaphone, Award,
} from "lucide-react";

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>;
type NavKey = string;

interface NavItemDef {
  key:   NavKey;
  href:  string;
  icon:  LucideIcon;
  exact?: boolean;
  badge?: boolean;
}

const NAV_DEFS: Record<string, NavItemDef[]> = {
  admin: [
    { key: "overview",      href: "/admin",                    icon: LayoutDashboard, exact: true },
    { key: "analytics",     href: "/admin/analytics",          icon: TrendingUp },
    { key: "marketTrends",  href: "/admin/market-trends",      icon: BarChart3 },
    { key: "systemSetup",   href: "/admin/setup",              icon: Settings },
    { key: "clients",       href: "/admin/clients",            icon: MessageSquare },
    { key: "leads",         href: "/admin/leads",              icon: ClipboardList, exact: true },
    { key: "duplicates",    href: "/admin/leads/duplicates",   icon: AlertTriangle },
    { key: "appointments",  href: "/admin/appointments",       icon: Calendar },
    { key: "agents",        href: "/admin/agents",             icon: Building2 },
    { key: "organizations", href: "/admin/organizations",      icon: Building },
    { key: "admins",        href: "/admin/admins",             icon: ShieldCheck },
    { key: "properties",    href: "/admin/properties",         icon: Home, exact: true },
    { key: "compare",       href: "/admin/properties/compare", icon: GitCompare },
    { key: "verification",  href: "/admin/verification",       icon: BadgeCheck },
    { key: "dealLocks",     href: "/admin/deals",              icon: Lock },
    { key: "fraudMonitor",  href: "/admin/fraud",              icon: AlertOctagon },
    { key: "reports",       href: "/admin/reports",            icon: FileBarChart },
    { key: "auditLog",      href: "/admin/audit",              icon: FileText, exact: true },
    { key: "benchmarks",    href: "/admin/audit/benchmarks",   icon: SlidersHorizontal },
    { key: "systemLog",     href: "/admin/audit-log",          icon: FolderOpen },
    { key: "notifications", href: "/admin/notifications",      icon: Bell, badge: true },
    { key: "settings",      href: "/admin/settings",           icon: Settings2 },
  ],
  agent: [
    { key: "overview",      href: "/agent",               icon: LayoutDashboard, exact: true },
    { key: "analytics",     href: "/agent/analytics",     icon: TrendingUp },
    { key: "myLeads",       href: "/agent/leads",         icon: ClipboardList, exact: true },
    { key: "appointments",  href: "/agent/appointments",  icon: Calendar },
    { key: "myListings",    href: "/agent/listings",      icon: Home },
    { key: "myProfile",     href: "/agent/profile",       icon: User },
    { key: "notifications", href: "/agent/notifications", icon: Bell, badge: true },
  ],
  developer: [
    { key: "overview",      href: "/organization",               icon: LayoutDashboard, exact: true },
    { key: "analytics",     href: "/organization/analytics",     icon: TrendingUp },
    { key: "aiMonitor",     href: "/organization/ai-monitor",    icon: Bot },
    { key: "inventory",     href: "/organization/inventory",     icon: Building },
    { key: "leadAnalytics", href: "/organization/leads",         icon: BarChart3 },
    { key: "dealLocks",     href: "/organization/deals",         icon: Lock },
    { key: "myTeam",        href: "/organization/team",          icon: Users },
    { key: "agents",        href: "/organization/agents",        icon: Award },
    { key: "campaigns",     href: "/organization/campaigns",     icon: Megaphone },
    { key: "reports",       href: "/organization/reports",       icon: FileBarChart },
    { key: "notifications", href: "/organization/notifications", icon: Bell, badge: true },
    { key: "settings",      href: "/organization/settings",      icon: Settings2 },
  ],
};

const ROLE_LABEL_KEYS: Record<string, string> = {
  admin:     "admin",
  agent:     "agent",
  developer: "developer",
};

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  admin:     { bg: "bg-sky-600",    text: "text-sky-600",    dot: "bg-sky-500" },
  agent:     { bg: "bg-violet-600", text: "text-violet-600", dot: "bg-violet-500" },
  developer: { bg: "bg-amber-600",  text: "text-amber-600",  dot: "bg-amber-500" },
};

function NavLink({ item, label, active, unreadCount = 0 }: { item: NavItemDef; label: string; active: boolean; unreadCount?: number }) {
  const Icon = item.icon;
  const showBadge = item.badge && unreadCount > 0;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer",
        active
          ? "bg-[var(--primary-dim)] text-[var(--primary)]"
          : "text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-[var(--primary-dim)]"
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      )}
      <span className="relative z-10 shrink-0">
        <Icon
          size={15}
          className={cn(
            active ? "text-[var(--primary)]" : "text-slate-400 group-hover:text-slate-600"
          )}
        />
        {showBadge && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-1 ring-white" />
        )}
      </span>
      <span className="relative z-10 truncate">{label}</span>
      {showBadge && !active && (
        <span className="relative z-10 ml-auto rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      {active && <ChevronRight size={12} className="relative z-10 ml-auto text-[var(--primary)]/50" />}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const tNav     = useTranslations("nav");
  const tRoles   = useTranslations("roles");
  const { user, clearAuth } = useAuthStore();
  const role  = user?.role ?? "admin";
  const defs  = NAV_DEFS[role] ?? [];
  const rc    = ROLE_COLORS[role] ?? ROLE_COLORS.admin;

  const { data: notifData } = useQuery({
    queryKey: ["notif-unread-count"],
    queryFn: () => getNotifications({ limit: 1 }).then((r) => r.data),
    refetchInterval: 60_000,
    enabled: !!user,
  });
  const unreadCount: number = (notifData as { unread_count?: number })?.unread_count ?? 0;

  function isActive(item: NavItemDef) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  }

  async function handleLogout() {
    try { await logout(); } catch { /* proceed */ }
    clearAuth();
    // user_role cookie is HttpOnly and cleared server-side by the logout endpoint.
    router.replace("/login");
  }

  const initials = (user?.name || user?.phone || "?")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)]"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 py-4">
        <div className={`h-7 w-7 rounded-lg ${rc.bg} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">RT</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-[var(--text-primary)]">RealTron</span>
          <span className={`rounded bg-sky-50 px-1 py-0.5 text-[10px] font-semibold text-sky-600 border border-sky-200`}>AI</span>
        </div>
      </div>

      {/* Role label */}
      <div className="px-5 pt-4 pb-2">
        <span className={`text-[10px] font-semibold uppercase tracking-widest ${rc.text}`}>
          {tRoles(ROLE_LABEL_KEYS[role] ?? role)}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {defs.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                label={tNav(item.key)}
                active={isActive(item)}
                unreadCount={unreadCount}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--border)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full ${rc.bg} flex items-center justify-center shrink-0`}>
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {user?.name || user?.phone}
            </p>
            {user?.name && (
              <p className="truncate text-xs text-[var(--text-muted)]">{user?.phone}</p>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] py-1.5 text-xs font-medium text-[var(--text-muted)] hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 cursor-pointer"
        >
          <LogOut size={12} />
          {tNav("signOut")}
        </motion.button>
      </div>
    </motion.aside>
  );
}
