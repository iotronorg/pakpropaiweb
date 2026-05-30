"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLog } from "@/lib/api";

interface AuditEntry {
  id: number;
  actor_phone: string | null;
  action: string;
  target_model: string;
  target_id: string;
  detail: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditLogResponse {
  count: number;
  limit: number;
  offset: number;
  results: AuditEntry[];
}

const ACTION_COLORS: Record<string, string> = {
  create:  "bg-green-100 text-green-700",
  update:  "bg-blue-100 text-blue-700",
  delete:  "bg-red-100 text-red-700",
  login:   "bg-purple-100 text-purple-700",
  logout:  "bg-gray-100 text-gray-600",
  approve: "bg-teal-100 text-teal-700",
  reject:  "bg-orange-100 text-orange-700",
  ban:     "bg-red-200 text-red-800",
  config:  "bg-yellow-100 text-yellow-700",
};

const ACTIONS = ["create", "update", "delete", "login", "logout", "approve", "reject", "ban", "config"];
const MODELS  = ["User", "Agent", "Lead", "Property", "Verification", "EscrowDeal", "Payment", "SystemConfig", "FraudBlacklist"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
}

function DiffCell({ label, data }: { label: string; data: Record<string, unknown> | null }) {
  if (!data) return <span className="text-gray-300 text-xs">—</span>;
  const keys = Object.keys(data);
  if (keys.length === 0) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <details className="cursor-pointer">
      <summary className="text-xs text-blue-600 hover:underline select-none">
        {label} ({keys.length} field{keys.length !== 1 ? "s" : ""})
      </summary>
      <pre className="mt-1 text-[10px] bg-gray-50 rounded p-1.5 overflow-auto max-w-[220px] max-h-[120px] text-gray-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

const PAGE_SIZE = 50;

export default function AdminAuditLogPage() {
  const [offset, setOffset] = useState(0);
  const [filterAction, setFilterAction] = useState("");
  const [filterModel, setFilterModel]   = useState("");
  const [filterActor, setFilterActor]   = useState("");
  const [draftActor, setDraftActor]     = useState("");

  const params: Record<string, unknown> = { limit: PAGE_SIZE, offset };
  if (filterAction) params.action       = filterAction;
  if (filterModel)  params.target_model = filterModel;
  if (filterActor)  params.actor        = filterActor;

  const { data, isLoading, isFetching } = useQuery<AuditLogResponse>({
    queryKey: ["system-audit-log", offset, filterAction, filterModel, filterActor],
    queryFn: () => getAuditLog(params).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const entries   = data?.results ?? [];
  const total     = data?.count   ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  function applySearch() {
    setFilterActor(draftActor.trim());
    setOffset(0);
  }

  function resetFilters() {
    setFilterAction("");
    setFilterModel("");
    setFilterActor("");
    setDraftActor("");
    setOffset(0);
  }

  const hasFilters = !!(filterAction || filterModel || filterActor);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">
          Immutable record of all admin write actions — creates, updates, deletes, approvals, config changes
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setOffset(0); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
          <select
            value={filterModel}
            onChange={(e) => { setFilterModel(e.target.value); setOffset(0); }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">All models</option>
            {MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Actor phone</label>
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="+923001234567"
              value={draftActor}
              onChange={(e) => setDraftActor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={applySearch}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Search
            </button>
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
          >
            Clear filters
          </button>
        )}

        <div className="ms-auto text-xs text-gray-400">
          {isFetching ? "Loading…" : `${total.toLocaleString()} entr${total !== 1 ? "ies" : "y"}`}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading audit log…</div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-medium text-gray-500">No audit entries found</p>
            {hasFilters && (
              <p className="text-xs text-gray-400 mt-1">Try adjusting the filters</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-start text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 w-[160px]">Timestamp</th>
                <th className="px-4 py-3 w-[130px]">Actor</th>
                <th className="px-4 py-3 w-[90px]">Action</th>
                <th className="px-4 py-3 w-[110px]">Target</th>
                <th className="px-4 py-3">Detail</th>
                <th className="px-4 py-3 w-[100px]">Before</th>
                <th className="px-4 py-3 w-[100px]">After</th>
                <th className="px-4 py-3 w-[110px]">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap font-mono">
                    {formatDate(e.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {e.actor_phone ? (
                      <span className="text-xs font-mono text-gray-700">{e.actor_phone}</span>
                    ) : (
                      <span className="text-xs text-gray-300 italic">system</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${ACTION_COLORS[e.action] ?? "bg-gray-100 text-gray-600"}`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {e.target_model ? (
                      <div>
                        <p className="text-xs font-medium text-gray-700">{e.target_model}</p>
                        {e.target_id && (
                          <p className="text-[10px] font-mono text-gray-400 truncate max-w-[90px]" title={e.target_id}>
                            #{e.target_id}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-600 max-w-[280px] break-words">{e.detail || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <DiffCell label="before" data={e.before} />
                  </td>
                  <td className="px-4 py-3">
                    <DiffCell label="after" data={e.after} />
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-gray-400">
                    {e.ip_address ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-400">
              Page {currentPage} of {totalPages} · {total.toLocaleString()} total entries
            </p>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
