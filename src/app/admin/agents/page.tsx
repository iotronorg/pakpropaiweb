"use client";
import { X, Check } from "lucide-react";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAgentsList, createAgent, updateAgent, deleteAgent, getPendingAgents, approveAgent, rejectAgent } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import { AgentProfile } from "@/types";

const PAGE_SIZE = 20;

// ── Constants ─────────────────────────────────────────────────────────────────

const AGENT_TYPES = [
  { value: "individual", label: "Individual Agent" },
  { value: "agency",     label: "Agency / Organization" },
  { value: "developer",  label: "Real Estate Developer" },
];

const SPECIALIZATION_OPTIONS = [
  { value: "residential_buy",  label: "Residential — Buy/Sell" },
  { value: "residential_rent", label: "Residential — Rent/Lease" },
  { value: "commercial",       label: "Commercial" },
  { value: "plots",            label: "Plots & Land" },
  { value: "new_projects",     label: "New Projects / Off-plan" },
  { value: "luxury",           label: "Luxury / High-end" },
  { value: "industrial",       label: "Industrial / Warehouse" },
];

const SPEC_LABEL: Record<string, string> = Object.fromEntries(
  SPECIALIZATION_OPTIONS.map((s) => [s.value, s.label])
);

// ── Blank form ────────────────────────────────────────────────────────────────

const BLANK_FORM = {
  // Identity
  name:             "",
  agent_type:       "individual",
  phone:            "",
  whatsapp_number:  "",
  email:            "",
  // Professional
  company_name:     "",
  designation:      "",
  license_number:   "",
  years_experience: "",
  bio:              "",
  // Coverage
  primary_city: "",
  cities:       "",   // comma-separated → string[]
  areas:        "",   // comma-separated → string[]
  // Specializations
  specializations: [] as string[],
  // Status
  is_verified: false,
  is_active:   true,
  is_featured: false,
};

type AgentForm = typeof BLANK_FORM;

function agentToForm(a: AgentProfile): AgentForm {
  return {
    name:             a.name,
    agent_type:       a.agent_type,
    phone:            a.phone,
    whatsapp_number:  a.whatsapp_number,
    email:            a.email,
    company_name:     a.company_name,
    designation:      a.designation,
    license_number:   "",
    years_experience: a.years_experience ? String(a.years_experience) : "",
    bio:              a.bio,
    primary_city:     a.primary_city,
    cities:           (a.cities ?? []).join(", "),
    areas:            (a.areas  ?? []).join(", "),
    specializations:  a.specializations ?? [],
    is_verified:      a.is_verified,
    is_active:        a.is_active,
    is_featured:      a.is_featured,
  };
}

function formToPayload(f: AgentForm): Record<string, unknown> {
  return {
    name:             f.name,
    agent_type:       f.agent_type,
    phone:            f.phone,
    whatsapp_number:  f.whatsapp_number  || undefined,
    email:            f.email            || undefined,
    company_name:     f.company_name     || undefined,
    designation:      f.designation      || undefined,
    license_number:   f.license_number   || undefined,
    years_experience: f.years_experience ? Number(f.years_experience) : 0,
    bio:              f.bio              || undefined,
    primary_city:     f.primary_city     || undefined,
    cities:  f.cities ? f.cities.split(",").map((s) => s.trim()).filter(Boolean) : [],
    areas:   f.areas  ? f.areas.split(",").map((s)  => s.trim()).filter(Boolean) : [],
    specializations: f.specializations,
    is_verified: f.is_verified,
    is_active:   f.is_active,
    is_featured: f.is_featured,
  };
}

function extractError(err: unknown): string {
  const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!d) return "Something went wrong.";
  const first = Object.values(d)[0];
  if (Array.isArray(first)) return String(first[0]);
  if (typeof first === "string") return first;
  return "Something went wrong.";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const qc = useQueryClient();
  const queryKey = ["admin-agents"];

  const [tab,        setTab]        = useState<"all" | "pending">("all");
  const [showAdd,    setShowAdd]    = useState(false);
  const [editAgent,  setEditAgent]  = useState<AgentProfile | null>(null);
  const [detailAgent,setDetailAgent]= useState<AgentProfile | null>(null);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [addForm,    setAddForm]    = useState<AgentForm>(BLANK_FORM);
  const [editForm,   setEditForm]   = useState<AgentForm>(BLANK_FORM);
  const [formError,  setFormError]  = useState("");
  const [copiedId,   setCopiedId]   = useState<number | null>(null);
  const [page,       setPage]       = useState(1);
  const [rejectId,   setRejectId]   = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => getAgentsList({ page }).then((r) => r.data),
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin-agents-pending"],
    queryFn: () => getPendingAgents().then((r) => r.data),
  });

  const agents: AgentProfile[] = data?.results ?? [];
  const pendingAgents: AgentProfile[] = pendingData?.results ?? pendingData ?? [];

  const invalidatePending = () => qc.invalidateQueries({ queryKey: ["admin-agents-pending"] });

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveAgent(id),
    onSuccess: () => { invalidatePending(); invalidate(); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectAgent(id, reason),
    onSuccess: () => { invalidatePending(); setRejectId(null); setRejectReason(""); },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey, exact: false });

  const addMutation = useMutation({
    mutationFn: (f: AgentForm) => createAgent(formToPayload(f)),
    onSuccess: () => { invalidate(); setShowAdd(false); setAddForm(BLANK_FORM); setFormError(""); },
    onError:   (e: unknown) => setFormError(extractError(e)),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, f }: { id: number; f: AgentForm }) => updateAgent(id, formToPayload(f)),
    onSuccess: () => { invalidate(); setEditAgent(null); setFormError(""); },
    onError:   (e: unknown) => setFormError(extractError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAgent(id),
    onSuccess: () => { invalidate(); setDeleteId(null); },
  });

  const toggleFlag = (a: AgentProfile, flag: "is_verified" | "is_active" | "is_featured") =>
    editMutation.mutate({ id: a.id, f: { ...agentToForm(a), [flag]: !a[flag] } });

  function openEdit(a: AgentProfile) {
    setEditAgent(a);
    setEditForm(agentToForm(a));
    setFormError("");
  }

  function copyId(id: number) {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Agents</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isLoading ? "Loading…" : `${data?.count ?? agents.length} agent${(data?.count ?? agents.length) !== 1 ? "s" : ""}`}
            {" · "}create, verify, manage and assign agents to properties
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddForm(BLANK_FORM); setFormError(""); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Add Agent
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Agent views" className="mb-5 flex gap-1 border-b border-[var(--border)]">
        {(["all", "pending"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t === "all" ? "All Agents" : (
              <span className="flex items-center gap-2">
                Pending Approval
                {pendingAgents.length > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
                    {pendingAgents.length}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Pending Approval Tab ─────────────────────────────────────────────── */}
      {tab === "pending" && (
        <div>
          {pendingLoading ? (
            <LoadingSpinner />
          ) : pendingAgents.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-6 py-16 text-center text-[var(--text-muted)]">
              <p className="font-medium">No pending applications</p>
              <p className="text-sm mt-1">New agent registrations will appear here for review.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Organization</th>
                    <th className="px-5 py-3">City</th>
                    <th className="px-5 py-3">Specializations</th>
                    <th className="px-5 py-3">Applied</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {pendingAgents.map((a) => (
                    <tr key={a.id} className="hover:bg-amber-50/40">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{a.name}</p>
                        {a.email && <p className="text-xs text-[var(--text-muted)]">{a.email}</p>}
                      </td>
                      <td className="px-5 py-3 font-mono text-[var(--text-muted)]">{a.phone}</td>
                      <td className="px-5 py-3 text-[var(--text-muted)] text-xs capitalize">
                        {AGENT_TYPES.find((t) => t.value === a.agent_type)?.label ?? a.agent_type}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)] text-xs">
                        {a.parent_organization_name ?? <span className="text-[var(--text-faint)]">Independent</span>}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)]">{a.primary_city || "—"}</td>
                      <td className="px-5 py-3 text-[var(--text-muted)] text-xs">
                        {a.specializations?.slice(0, 2).map((s) => SPEC_LABEL[s] ?? s).join(", ") || "—"}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)] text-xs">{formatDate(a.joined_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDetailAgent(a)}
                            className="text-xs px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => approveMutation.mutate(a.id)}
                            disabled={approveMutation.isPending}
                            className="text-xs px-2.5 py-1 rounded-md border border-green-200 text-green-700 hover:bg-green-50 font-medium disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectId(a.id); setRejectReason(""); }}
                            className="text-xs px-2.5 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reject modal */}
          {rejectId !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRejectId(null)}>
              <div role="dialog" aria-modal="true" aria-labelledby="reject-agent-title" onClick={(e) => e.stopPropagation()} className="bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 id="reject-agent-title" className="text-lg font-bold text-[var(--text-primary)] mb-1">Reject Application</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">This reason will be sent to the agent via notification.</p>
                <label htmlFor="reject-reason" className="sr-only">Rejection reason</label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Incomplete license details. Please reapply with a valid registration number."
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRejectId(null)}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectId && rejectMutation.mutate({ id: rejectId, reason: rejectReason })}
                    disabled={!rejectReason.trim() || rejectMutation.isPending}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {rejectMutation.isPending ? "Rejecting…" : "Confirm Reject"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── All Agents Tab ─────────────────────────────────────────────────────── */}
      {tab === "all" && <>

      {/* ID usage hint */}
      <div className="mb-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-2.5 text-sm text-blue-700">
        <strong>Agent ID</strong> — use this number when assigning an agent to a property listing.
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Cities</th>
                <th className="px-5 py-3">Verified</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3">Featured</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--bg-muted)]">

                  {/* ID — prominent with copy button */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-subtle)] rounded px-1.5 py-0.5 text-xs">
                        #{a.id}
                      </span>
                      <button
                        onClick={() => copyId(a.id)}
                        title="Copy ID"
                        className="text-[var(--text-faint)] hover:text-blue-500 transition-colors"
                      >
                        {copiedId === a.id ? (
                          <Check size={12} className="text-green-500" aria-hidden="true" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <div className="font-medium text-[var(--text-primary)]">{a.name}</div>
                    {a.company_name && <div className="text-xs text-[var(--text-muted)]">{a.company_name}</div>}
                  </td>
                  <td className="px-5 py-3 font-mono text-[var(--text-muted)]">{a.phone}</td>
                  <td className="px-5 py-3 text-[var(--text-muted)] capitalize text-xs">
                    {AGENT_TYPES.find((t) => t.value === a.agent_type)?.label ?? a.agent_type}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-muted)] max-w-[140px] truncate text-xs">
                    {a.cities?.join(", ") || <span className="text-[var(--text-faint)]">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Badge label={a.is_verified ? "Verified" : "Unverified"} variant={a.is_verified ? "green" : "gray"} />
                  </td>
                  <td className="px-5 py-3">
                    <Badge label={a.is_active ? "Active" : "Inactive"} variant={a.is_active ? "blue" : "red"} />
                  </td>
                  <td className="px-5 py-3">
                    <Badge label={a.is_featured ? "Featured" : "—"} variant={a.is_featured ? "yellow" : "gray"} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setDetailAgent(a)}
                        className="text-xs px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(a)}
                        className="text-xs px-2.5 py-1 rounded-md border border-[var(--border)] text-blue-600 hover:bg-blue-50 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleFlag(a, "is_verified")}
                        disabled={editMutation.isPending}
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
                        disabled={editMutation.isPending}
                        className={`text-xs px-2.5 py-1 rounded-md border font-medium disabled:opacity-50 ${
                          a.is_active
                            ? "text-red-600 border-red-200 hover:bg-red-50"
                            : "text-green-700 border-green-200 hover:bg-green-50"
                        }`}
                      >
                        {a.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setDeleteId(a.id)}
                        className="text-xs px-2.5 py-1 rounded-md border border-red-100 text-red-400 hover:bg-red-50 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-[var(--text-muted)]">
                    No agents yet. Click <strong>+ Add Agent</strong> to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-5 pb-4">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data?.count ?? 0}
              onPage={setPage}
            />
          </div>
        </div>
      )}

      </> /* end tab === "all" */}

      {/* ── Add Modal ─────────────────────────────────────────────────────────── */}
      {showAdd && (
        <Modal title="Add Agent" onClose={() => setShowAdd(false)}>
          <AgentFormBody
            form={addForm}
            onChange={setAddForm}
            error={formError}
            onSubmit={() => addMutation.mutate(addForm)}
            pending={addMutation.isPending}
            submitLabel="Create Agent"
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {editAgent && (
        <Modal title={`Edit Agent — #${editAgent.id}`} onClose={() => setEditAgent(null)}>
          <AgentFormBody
            form={editForm}
            onChange={setEditForm}
            error={formError}
            onSubmit={() => editMutation.mutate({ id: editAgent.id, f: editForm })}
            pending={editMutation.isPending}
            submitLabel="Save Changes"
            onCancel={() => setEditAgent(null)}
          />
        </Modal>
      )}

      {/* ── Details Modal ─────────────────────────────────────────────────────── */}
      {detailAgent && (
        <Modal title={`Agent Details — #${detailAgent.id}`} onClose={() => setDetailAgent(null)}>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pe-1">
            {/* ID callout */}
            <div className="flex items-center justify-between rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] px-4 py-3 mb-3">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider mb-0.5">Agent ID</p>
                <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">#{detailAgent.id}</p>
              </div>
              <button
                onClick={() => copyId(detailAgent.id)}
                className="text-xs px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] font-medium"
              >
                {copiedId === detailAgent.id ? "Copied!" : "Copy ID"}
              </button>
            </div>
            <DetailRow label="Name"         value={detailAgent.name} />
            <DetailRow label="Type"         value={AGENT_TYPES.find((t) => t.value === detailAgent.agent_type)?.label} />
            <DetailRow label="Phone"        value={detailAgent.phone} mono />
            <DetailRow label="WhatsApp"     value={detailAgent.whatsapp_number} mono />
            <DetailRow label="Email"        value={detailAgent.email} />
            <DetailRow label="Company"      value={detailAgent.company_name} />
            <DetailRow label="Designation"  value={detailAgent.designation} />
            <DetailRow label="Experience"   value={detailAgent.years_experience ? `${detailAgent.years_experience} yrs` : undefined} />
            <DetailRow label="Primary City" value={detailAgent.primary_city} />
            <DetailRow label="Cities"       value={detailAgent.cities?.join(", ")} />
            <DetailRow label="Areas"        value={detailAgent.areas?.join(", ")} />
            <DetailRow label="Specializations" value={detailAgent.specializations?.map((s) => SPEC_LABEL[s] ?? s).join(", ")} />
            <DetailRow label="Bio"          value={detailAgent.bio} />
            <DetailRow label="Verified">
              <Badge label={detailAgent.is_verified ? "Verified" : "Unverified"} variant={detailAgent.is_verified ? "green" : "gray"} />
            </DetailRow>
            <DetailRow label="Active">
              <Badge label={detailAgent.is_active ? "Active" : "Inactive"} variant={detailAgent.is_active ? "blue" : "red"} />
            </DetailRow>
            <DetailRow label="Featured">
              <Badge label={detailAgent.is_featured ? "Yes" : "No"} variant={detailAgent.is_featured ? "yellow" : "gray"} />
            </DetailRow>
            <DetailRow label="Rating"        value={detailAgent.rating ? `${Number(detailAgent.rating).toFixed(1)} / 5.0` : undefined} />
            <DetailRow label="Total Leads"   value={String(detailAgent.total_leads ?? 0)} />
            <DetailRow label="Listings"      value={String(detailAgent.total_listings ?? 0)} />
            <DetailRow label="Closed Deals"  value={String(detailAgent.closed_deals ?? 0)} />
            <DetailRow label="User Phone"    value={detailAgent.user_phone} mono />
            <DetailRow label="User Email"    value={detailAgent.user_email} />
            <DetailRow label="Organisation"  value={detailAgent.parent_organization_name} />
            <DetailRow label="Joined"        value={formatDate(detailAgent.joined_at)} />
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      {deleteId && (
        <Modal title="Delete Agent" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Are you sure you want to permanently delete agent <strong>#{deleteId}</strong>?
          </p>
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-6">
            This will unlink their leads and assigned properties. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-muted)]">
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Agent"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Agent Form ────────────────────────────────────────────────────────────────

function AgentFormBody({
  form, onChange, error, onSubmit, pending, submitLabel, onCancel,
}: {
  form: AgentForm;
  onChange: (f: AgentForm) => void;
  error: string;
  onSubmit: () => void;
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  const set = (key: keyof AgentForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange({ ...form, [key]: e.target.value });

  const toggleSpec = (value: string) => {
    const current = form.specializations;
    onChange({
      ...form,
      specializations: current.includes(value)
        ? current.filter((s) => s !== value)
        : [...current, value],
    });
  };

  return (
    <div className="space-y-5 max-h-[75vh] overflow-y-auto pe-1">

      {/* Identity */}
      <Section label="Identity">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name" required>
            <input type="text" value={form.name} onChange={set("name")}
              placeholder="e.g. Ali Hassan" className={inputCls} />
          </Field>
          <Field label="Agent Type" required>
            <select value={form.agent_type} onChange={set("agent_type")} className={inputCls}>
              {AGENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" required>
            <input type="tel" value={form.phone} onChange={set("phone")}
              placeholder="+923001234567" className={`${inputCls} font-mono`} />
          </Field>
          <Field label="WhatsApp Number">
            <input type="tel" value={form.whatsapp_number} onChange={set("whatsapp_number")}
              placeholder="+923001234567 (if different)" className={`${inputCls} font-mono`} />
          </Field>
        </div>
        <Field label="Email">
          <input type="email" value={form.email} onChange={set("email")}
            placeholder="agent@example.com" className={inputCls} />
        </Field>
      </Section>

      {/* Professional */}
      <Section label="Professional Details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company / Brand Name">
            <input type="text" value={form.company_name} onChange={set("company_name")}
              placeholder="e.g. DHA Properties" className={inputCls} />
          </Field>
          <Field label="Designation">
            <input type="text" value={form.designation} onChange={set("designation")}
              placeholder="e.g. Senior Consultant" className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="License / Registration Number">
            <input type="text" value={form.license_number} onChange={set("license_number")}
              placeholder="e.g. REA-2024-12345" className={inputCls} />
          </Field>
          <Field label="Years of Experience">
            <input type="number" min="0" value={form.years_experience} onChange={set("years_experience")}
              placeholder="e.g. 8" className={inputCls} />
          </Field>
        </div>
        <Field label="Bio">
          <textarea value={form.bio} onChange={set("bio")} rows={2}
            placeholder="Short professional bio…" className={inputCls} />
        </Field>
      </Section>

      {/* Coverage */}
      <Section label="Geographic Coverage">
        <Field label="Primary City">
          <input type="text" value={form.primary_city} onChange={set("primary_city")}
            placeholder="e.g. Dubai, London, New York" className={inputCls} />
        </Field>
        <Field label="All Cities Covered">
          <input type="text" value={form.cities} onChange={set("cities")}
            placeholder="Dubai, Abu Dhabi, Sharjah (comma-separated)" className={inputCls} />
          <p className="text-xs text-[var(--text-muted)] mt-1">Comma-separated list of cities this agent covers.</p>
        </Field>
        <Field label="Specific Areas / Districts">
          <input type="text" value={form.areas} onChange={set("areas")}
            placeholder="Downtown, Marina, JBR (comma-separated)" className={inputCls} />
        </Field>
      </Section>

      {/* Specializations */}
      <Section label="Specializations">
        <div className="grid grid-cols-2 gap-2">
          {SPECIALIZATION_OPTIONS.map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.specializations.includes(s.value)}
                onChange={() => toggleSpec(s.value)}
                className="rounded border-[var(--border-strong)] accent-blue-600"
              />
              {s.label}
            </label>
          ))}
        </div>
      </Section>

      {/* Status */}
      <Section label="Status">
        <div className="flex items-center gap-6 flex-wrap">
          {[
            { key: "is_verified" as const, label: "Verified", color: "accent-green-600" },
            { key: "is_active"   as const, label: "Active",   color: "accent-blue-600"  },
            { key: "is_featured" as const, label: "Featured", color: "accent-yellow-500"},
          ].map(({ key, label, color }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => onChange({ ...form, [key]: e.target.checked })}
                className={`rounded border-[var(--border-strong)] ${color}`}
              />
              {label}
            </label>
          ))}
        </div>
      </Section>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)]">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-muted)]">
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={pending || !form.name || !form.phone}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = `modal-title-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-xl bg-[var(--bg-surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 id={titleId} className="font-semibold text-[var(--text-primary)]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors"><X size={16} aria-hidden="true" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
        {label}{required && <span className="text-red-500 ms-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function DetailRow({
  label, value, mono, children,
}: {
  label: string; value?: string | null; mono?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-sm text-[var(--text-muted)] w-32 flex-shrink-0">{label}</span>
      {children ?? (
        <span className={`text-sm text-right ${mono ? "font-mono" : ""} ${!value ? "text-[var(--text-faint)]" : "text-[var(--text-primary)]"}`}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
