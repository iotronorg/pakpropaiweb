"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAgentsList, updateAgent } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { AgentProfile } from "@/types";

const SPECIALIZATION_LABELS: Record<string, string> = {
  residential_buy:  "Buy/Sell",
  residential_rent: "Rent/Lease",
  commercial:       "Commercial",
  plots:            "Plots",
  new_projects:     "Off-plan",
  luxury:           "Luxury",
  industrial:       "Industrial",
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  developer:  "Developer",
  agency:     "Agency",
};

export default function AgentsPage() {
  const qc = useQueryClient();
  const queryKey = ["admin-agents"];

  const [detailAgent, setDetailAgent] = useState<AgentProfile | null>(null);
  const [editId,      setEditId]      = useState<number | null>(null);
  const [editForm,    setEditForm]    = useState({
    name: "", phone: "", email: "", primary_city: "",
    is_verified: false, is_active: false, is_featured: false,
  });

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getAgentsList().then((r) => r.data),
  });

  const agents: AgentProfile[] = data?.results ?? data ?? [];

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateAgent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setEditId(null);
    },
  });

  function openEdit(a: AgentProfile) {
    setEditId(a.id);
    setEditForm({
      name:        a.name,
      phone:       a.phone,
      email:       a.email,
      primary_city: a.primary_city,
      is_verified: a.is_verified,
      is_active:   a.is_active,
      is_featured: a.is_featured,
    });
  }

  function toggleFlag(a: AgentProfile, flag: "is_verified" | "is_active" | "is_featured") {
    patchMutation.mutate({ id: a.id, data: { [flag]: !a[flag] } });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? "Loading…" : `${agents.length} agent${agents.length !== 1 ? "s" : ""}`}
            {" · "}manage verification, status and details
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Cities</th>
                <th className="px-6 py-3">Verified</th>
                <th className="px-6 py-3">Active</th>
                <th className="px-6 py-3">Featured</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agents.map((a) => (
                <>
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-800">{a.name}</div>
                      {a.company_name && (
                        <div className="text-xs text-gray-400">{a.company_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-700">{a.phone}</td>
                    <td className="px-6 py-3 text-gray-500 capitalize">
                      {AGENT_TYPE_LABELS[a.agent_type] ?? a.agent_type}
                    </td>
                    <td className="px-6 py-3 text-gray-500 max-w-[160px] truncate">
                      {a.cities?.join(", ") || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <Badge label={a.is_verified ? "Verified" : "Unverified"} variant={a.is_verified ? "green" : "gray"} />
                    </td>
                    <td className="px-6 py-3">
                      <Badge label={a.is_active ? "Active" : "Inactive"} variant={a.is_active ? "blue" : "red"} />
                    </td>
                    <td className="px-6 py-3">
                      <Badge label={a.is_featured ? "Featured" : "Normal"} variant={a.is_featured ? "yellow" : "gray"} />
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {a.rating ? `${Number(a.rating).toFixed(1)} ★` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setDetailAgent(a)}
                          className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => openEdit(a)}
                          className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleFlag(a, "is_verified")}
                          disabled={patchMutation.isPending}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium disabled:opacity-50 ${
                            a.is_verified
                              ? "text-red-600 border-red-200 hover:bg-red-50"
                              : "text-green-700 border-green-200 hover:bg-green-50"
                          }`}
                        >
                          {a.is_verified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          onClick={() => toggleFlag(a, "is_active")}
                          disabled={patchMutation.isPending}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium disabled:opacity-50 ${
                            a.is_active
                              ? "text-red-600 border-red-200 hover:bg-red-50"
                              : "text-green-700 border-green-200 hover:bg-green-50"
                          }`}
                        >
                          {a.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline edit row */}
                  {editId === a.id && (
                    <tr key={`${a.id}-edit`} className="bg-blue-50">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="flex flex-wrap gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Name"
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-40"
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500 w-36"
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-44"
                          />
                          <input
                            type="text"
                            placeholder="Primary City"
                            value={editForm.primary_city}
                            onChange={(e) => setEditForm((p) => ({ ...p, primary_city: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-32"
                          />
                          <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editForm.is_verified}
                              onChange={(e) => setEditForm((p) => ({ ...p, is_verified: e.target.checked }))}
                              className="rounded border-gray-300 accent-green-600"
                            />
                            Verified
                          </label>
                          <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editForm.is_active}
                              onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))}
                              className="rounded border-gray-300 accent-blue-600"
                            />
                            Active
                          </label>
                          <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editForm.is_featured}
                              onChange={(e) => setEditForm((p) => ({ ...p, is_featured: e.target.checked }))}
                              className="rounded border-gray-300 accent-yellow-500"
                            />
                            Featured
                          </label>
                          <button
                            onClick={() => patchMutation.mutate({ id: a.id, data: editForm })}
                            disabled={patchMutation.isPending}
                            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                          >
                            {patchMutation.isPending ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditId(null)} className="text-sm text-gray-400 hover:text-gray-600">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    No agents yet. Add agents via the Django admin panel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {detailAgent && (
        <Modal title="Agent Details" onClose={() => setDetailAgent(null)}>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            <DetailRow label="Name"        value={detailAgent.name} />
            <DetailRow label="Type"        value={AGENT_TYPE_LABELS[detailAgent.agent_type] ?? detailAgent.agent_type} />
            <DetailRow label="Phone"       value={detailAgent.phone} mono />
            <DetailRow label="WhatsApp"    value={detailAgent.whatsapp_number} mono />
            <DetailRow label="Email"       value={detailAgent.email} />
            <DetailRow label="Company"     value={detailAgent.company_name} />
            <DetailRow label="Designation" value={detailAgent.designation} />
            <DetailRow label="Primary City" value={detailAgent.primary_city} />
            <DetailRow label="Cities"      value={detailAgent.cities?.join(", ")} />
            <DetailRow label="Specializations" value={detailAgent.specializations?.map((s) => SPECIALIZATION_LABELS[s] ?? s).join(", ")} />
            <DetailRow label="License #"   value={detailAgent.designation} />
            <DetailRow label="Experience"  value={detailAgent.years_experience != null ? `${detailAgent.years_experience} years` : undefined} />
            <DetailRow label="Bio"         value={detailAgent.bio} />
            <DetailRow label="Verified">
              <Badge label={detailAgent.is_verified ? "Verified" : "Unverified"} variant={detailAgent.is_verified ? "green" : "gray"} />
            </DetailRow>
            <DetailRow label="Active">
              <Badge label={detailAgent.is_active ? "Active" : "Inactive"} variant={detailAgent.is_active ? "blue" : "red"} />
            </DetailRow>
            <DetailRow label="Featured">
              <Badge label={detailAgent.is_featured ? "Yes" : "No"} variant={detailAgent.is_featured ? "yellow" : "gray"} />
            </DetailRow>
            <DetailRow label="Rating"       value={detailAgent.rating ? `${Number(detailAgent.rating).toFixed(1)} / 5.0` : undefined} />
            <DetailRow label="Total Leads"  value={String(detailAgent.total_leads ?? 0)} />
            <DetailRow label="Listings"     value={String(detailAgent.total_listings ?? 0)} />
            <DetailRow label="Closed Deals" value={String(detailAgent.closed_deals ?? 0)} />
            <DetailRow label="User Phone"   value={detailAgent.user_phone} mono />
            <DetailRow label="User Email"   value={detailAgent.user_email} />
            <DetailRow label="Org"          value={detailAgent.parent_organization_name} />
            <DetailRow label="Joined"       value={formatDate(detailAgent.joined_at)} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function DetailRow({
  label, value, mono, children,
}: {
  label: string; value?: string | null; mono?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 w-32 flex-shrink-0">{label}</span>
      {children ?? (
        <span className={`text-sm text-right ${mono ? "font-mono" : ""} ${!value ? "text-gray-300" : "text-gray-800"}`}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}
