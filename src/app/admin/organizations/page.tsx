"use client";

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

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

// ── Create modal ───────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", org_type: "agency", plan: "trial", country: "PK",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Create Organization</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme Real Estate"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select className={inputCls} value={form.org_type} onChange={(e) => setForm({ ...form, org_type: e.target.value })}>
                {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Plan</label>
              <select className={inputCls} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country (ISO 3166-1 alpha-2)</label>
            <input
              className={inputCls}
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
              placeholder="PK"
              maxLength={2}
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
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
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="mt-1 text-sm text-gray-500">All tenant organizations on the platform</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Create Organization
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-start text-xs font-semibold uppercase tracking-wider text-gray-400">
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
            <tbody className="divide-y divide-gray-50">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/organizations/${org.id}`} className="font-medium text-blue-600 hover:underline">
                      {org.name}
                    </Link>
                    {org.admin_phone && (
                      <p className="text-xs font-mono text-gray-400">{org.admin_phone}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600 capitalize">{org.org_type.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3">
                    <Badge
                      label={org.plan}
                      variant={org.plan === "enterprise" ? "blue" : org.plan === "professional" ? "green" : "gray"}
                    />
                  </td>
                  <td className="px-5 py-3 text-gray-600">{org.country}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-700">{org.agent_count}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-gray-700">{org.lead_count}</td>
                  <td className="px-5 py-3">
                    <Badge
                      label={org.is_active ? "Active" : "Suspended"}
                      variant={org.is_active ? "green" : "red"}
                    />
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(org.created_at)}</td>
                  <td className="px-5 py-3">
                    {org.is_active ? (
                      <button
                        onClick={() => suspendMutation.mutate(org.id)}
                        disabled={suspendMutation.isPending}
                        className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
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
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-400">No organizations found</td>
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
