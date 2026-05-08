"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFraudStats,
  getFraudAlerts,
  getFlaggedUsers,
  getBlacklist,
  addBlacklistToken,
  removeBlacklistToken,
} from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface FraudStats {
  suspicious_scans: number;
  red_flag_scans: number;
  fraud_verifications: number;
  disputed_properties: number;
  high_risk_properties: number;
  blacklisted_tokens: number;
  alerts_last_7_days: number;
}

interface Alert {
  id: string | number;
  type: "document_scan" | "verification" | "property";
  severity: "high" | "medium" | "low";
  phone: string;
  detail: string;
  owner: string;
  created_at: string;
}

interface FlaggedUser {
  phone: string;
  reason: string;
  flags: string[];
  risk: "high" | "medium" | "low";
  last_seen: string;
}

interface BlacklistEntry {
  id: number;
  token: string;
  reason: string;
  added_by: string;
  expires_at: string | null;
  created_at: string;
}

// ── Sub-components ───────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low:    "bg-gray-100 text-gray-600 border-gray-200",
};

const TYPE_ICONS = {
  document_scan: "📄",
  verification:  "🔍",
  property:      "🏠",
};

function StatCard({
  label, value, sub, color,
}: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function AlertsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["fraud-alerts"],
    queryFn:  () => getFraudAlerts(100).then(r => r.data),
  });
  const alerts: Alert[] = data?.results ?? [];

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (!alerts.length) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">🛡️</p>
      <p className="font-medium">No fraud alerts — all clear</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div
          key={`${a.type}-${a.id}-${i}`}
          className={`flex items-start gap-4 rounded-xl border p-4 ${SEVERITY_STYLES[a.severity]}`}
        >
          <span className="text-2xl flex-shrink-0">{TYPE_ICONS[a.type]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase">{a.severity}</span>
              <span className="text-xs opacity-60 capitalize">{a.type.replace("_", " ")}</span>
            </div>
            <p className="font-medium text-sm truncate">{a.owner || a.detail}</p>
            <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{a.detail}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {a.phone && <p className="text-xs font-mono opacity-70">{a.phone}</p>}
            <p className="text-xs opacity-50 mt-0.5">{formatDate(a.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FlaggedUsersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["fraud-users"],
    queryFn:  () => getFlaggedUsers().then(r => r.data),
  });
  const users: FlaggedUser[] = data?.results ?? [];

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (!users.length) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">👤</p>
      <p className="font-medium">No flagged users</p>
    </div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {["Phone", "Risk", "Reason", "Flags", "Last Seen"].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map(u => (
            <tr key={u.phone} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs">{u.phone}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  u.risk === "high"   ? "bg-red-100 text-red-700"
                  : u.risk === "medium" ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-500"
                }`}>{u.risk}</span>
              </td>
              <td className="px-4 py-3 text-gray-700">{u.reason}</td>
              <td className="px-4 py-3">
                {u.flags.length ? (
                  <div className="flex flex-wrap gap-1">
                    {u.flags.map((f, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                ) : <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.last_seen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlacklistTab() {
  const qc = useQueryClient();
  const [token, setToken]   = useState("");
  const [reason, setReason] = useState("");
  const [ttl, setTtl]       = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["blacklist"],
    queryFn:  () => getBlacklist().then(r => r.data),
  });
  const entries: BlacklistEntry[] = data?.results ?? [];

  const addMutation = useMutation({
    mutationFn: () => addBlacklistToken({
      token,
      reason,
      ...(ttl ? { ttl_days: parseInt(ttl) } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blacklist"] });
      qc.invalidateQueries({ queryKey: ["fraud-stats"] });
      setToken(""); setReason(""); setTtl("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeBlacklistToken(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blacklist"] });
      qc.invalidateQueries({ queryKey: ["fraud-stats"] });
    },
  });

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-4">Add to Blacklist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Token / Keyword *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 'sky residencia', '03001234567'"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Why is this flagged?"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expires After (days)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              type="number"
              min="1"
              placeholder="Leave blank = never"
              value={ttl}
              onChange={e => setTtl(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => addMutation.mutate()}
          disabled={!token.trim() || addMutation.isPending}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {addMutation.isPending ? "Adding..." : "Add to Blacklist"}
        </button>
      </div>

      {/* Current entries */}
      {isLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : entries.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Blacklist is empty.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {["Token", "Reason", "Added By", "Expires", "Added", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-red-700">{e.token}</td>
                  <td className="px-4 py-3 text-gray-600">{e.reason || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{e.added_by}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {e.expires_at ? formatDate(e.expires_at) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(e.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeMutation.mutate(e.id)}
                      disabled={removeMutation.isPending}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "alerts" | "users" | "blacklist";

export default function FraudMonitorPage() {
  const [tab, setTab] = useState<Tab>("alerts");

  const { data: statsData } = useQuery({
    queryKey: ["fraud-stats"],
    queryFn:  () => getFraudStats().then(r => r.data as FraudStats),
    refetchInterval: 60_000,
  });
  const stats = statsData ?? null;

  const TABS: { id: Tab; label: string }[] = [
    { id: "alerts",    label: "🚨 Alerts" },
    { id: "users",     label: "👤 Flagged Users" },
    { id: "blacklist", label: "🚫 Blacklist" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Fraud Monitoring</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time fraud signals, suspicious activity, and blacklist management
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Alerts (7d)"
          value={stats?.alerts_last_7_days ?? "—"}
          sub="New fraud signals"
          color={stats && stats.alerts_last_7_days > 0 ? "text-red-600" : "text-green-600"}
        />
        <StatCard
          label="Suspicious Docs"
          value={stats?.suspicious_scans ?? "—"}
          sub="WhatsApp doc scans"
          color="text-orange-600"
        />
        <StatCard
          label="High-Risk Properties"
          value={stats?.high_risk_properties ?? "—"}
          sub="AI risk score: high"
          color="text-red-600"
        />
        <StatCard
          label="Disputed Properties"
          value={stats?.disputed_properties ?? "—"}
          sub="Legal status disputed"
          color="text-yellow-600"
        />
        <StatCard
          label="Red-Flag Scans"
          value={stats?.red_flag_scans ?? "—"}
          sub="Docs with any red flag"
        />
        <StatCard
          label="Fraud Verifications"
          value={stats?.fraud_verifications ?? "—"}
          sub="Verifs with fraud flags"
          color="text-red-500"
        />
        <StatCard
          label="Blacklisted Tokens"
          value={stats?.blacklisted_tokens ?? "—"}
          sub="Active blacklist entries"
          color="text-gray-700"
        />
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100 p-5 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-400 mb-1">System</p>
          <p className="text-sm font-bold text-red-700">
            {stats?.alerts_last_7_days === 0
              ? "✅ All Clear"
              : `⚠️ ${stats?.alerts_last_7_days} Alert${(stats?.alerts_last_7_days ?? 0) > 1 ? "s" : ""}`}
          </p>
          <p className="text-xs text-red-400 mt-0.5">Last 7 days</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "alerts"    && <AlertsTab />}
      {tab === "users"     && <FlaggedUsersTab />}
      {tab === "blacklist" && <BlacklistTab />}
    </div>
  );
}
