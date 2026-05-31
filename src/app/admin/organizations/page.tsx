"use client";
import { X } from "lucide-react";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOrgs, createOrg, suspendOrg, activateOrg,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import type { AdminOrganization } from "@/types";

const PAGE_SIZE = 20;

const ORG_TYPES = [
  { value: "developer",             label: "Developer" },
  { value: "agency",                label: "Agency" },
  { value: "brokerage",             label: "Brokerage" },
  { value: "community_development", label: "Community Dev" },
  { value: "enterprise",            label: "Enterprise" },
];

const PLANS = ["trial", "basic", "professional", "enterprise"];

const inputCls = "w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all";

// ── Create modal ───────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", org_type: "agency", plan: "trial", country: "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => createOrg({
      name:     form.name,
      org_type: form.org_type,
      plan:     form.plan,
      country:  form.country,
    }),
    onSuccess: () => { onCreated(); onClose(); },
    onError: (e: unknown) => {
      const d = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const first = d ? Object.values(d)[0] : null;
      setError(Array.isArray(first) ? String(first[0]) : "Failed to create organization.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="create-org-title" onClick={(e)=>e.stopPropagation()} className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 id="create-org-title" className="font-semibold text-[var(--text-primary)]">Create Organization</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors"><X size={16} aria-hidden="true" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Real Estate"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Type</label>
              <select className={inputCls} value={form.org_type} onChange={(e) => setForm({ ...form, org_type: e.target.value })}>
                {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Plan</label>
              <select className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Country (ISO 3166-1 alpha-2)</label>
            <input
              className={inputCls}
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
              placeholder="PK"
              maxLength={2}
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-1 border-t border-[var(--border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-muted)]">Cancel</button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!form.name || mutation.isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminOrganizationsPage() {
  const qc = useQueryClient();
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate,   setShowCreate]   = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orgs", page, search, statusFilter],
    queryFn: () => getAdminOrgs({
      page,
      ...(search       ? { search }                  : {}),
      ...(statusFilter ? { is_active: statusFilter } : {}),
    }).then((r) => r.data),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendOrg(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orgs"] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateOrg(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orgs"] }),
  });

  const orgs: AdminOrganization[] = data?.results ?? [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Organizations</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">All tenant organizations on the platform</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Create Organization
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="org-search">Search organizations</label>
        <input
          id="org-search"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <label className="sr-only" htmlFor="org-status-filter">Filter by status</label>
        <select
          id="org-status-filter"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-5 py-3">Organization</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3 text-right">Agents</th>
                <th className="px-5 py-3 text-right">Leads</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-[var(--bg-muted)]">
                  <td className="px-5 py-3">
                    <Link href={`/admin/organizations/${org.id}`} className="font-medium text-blue-600 hover:underline">
                      {org.name}
                    </Link>
                    {org.admin_phone && (
                      <p className="text-xs font-mono text-[var(--text-muted)]">{org.admin_phone}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)] capitalize">{org.org_type.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3">
                    <Badge
                      label={org.plan}
                      variant={org.plan === "enterprise" ? "blue" : org.plan === "professional" ? "green" : "gray"}
                    />
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)]">{org.country}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-[var(--text-muted)]">{org.agent_count}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-[var(--text-muted)]">{org.lead_count}</td>
                  <td className="px-5 py-3">
                    <Badge
                      label={org.is_active ? "Active" : "Suspended"}
                      variant={org.is_active ? "green" : "red"}
                    />
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)] text-xs">{formatDate(org.created_at)}</td>
                  <td className="px-5 py-3">
                    {org.is_active ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Suspend "${org.name}"? They will lose platform access immediately.`)) return;
                          suspendMutation.mutate(org.id);
                        }}
                        disabled={suspendMutation.isPending}
                        className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => activateMutation.mutate(org.id)}
                        disabled={activateMutation.isPending}
                        className="text-xs text-green-600 hover:underline disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[var(--text-muted)]">No organizations found</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-5 pb-4">
            <Pagination page={page} pageSize={PAGE_SIZE} total={data?.count ?? 0} onPage={setPage} />
          </div>
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ["admin-orgs"] })}
        />
      )}
    </div>
  );
}
