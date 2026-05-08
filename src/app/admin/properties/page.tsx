"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProperties, createProperty, updateProperty, deleteProperty,
  rescoreProperty, rescoreAllProperties, searchUsers,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { formatPKR, formatDate } from "@/lib/utils";
import { Property, User } from "@/types";

// ── Option maps ───────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial",  label: "Commercial"  },
  { value: "plot",        label: "Plot"        },
  { value: "industrial",  label: "Industrial"  },
];

const LEGAL_STATUSES = [
  { value: "unverified", label: "Unverified" },
  { value: "pending",    label: "Pending"    },
  { value: "verified",   label: "Verified"   },
  { value: "disputed",   label: "Disputed"   },
];

const FURNISHED_STATUSES = [
  { value: "",               label: "— Not specified —" },
  { value: "furnished",      label: "Furnished"         },
  { value: "unfurnished",    label: "Unfurnished"       },
  { value: "semi_furnished", label: "Semi-Furnished"    },
];

const CONSTRUCTION_STATUSES = [
  { value: "",                   label: "— Not specified —"   },
  { value: "ready",              label: "Ready"               },
  { value: "builder",            label: "Builder / New"       },
  { value: "under_construction", label: "Under Construction"  },
];

// ── Blank form ────────────────────────────────────────────────────────────────

const BLANK_FORM = {
  title: "",
  description: "",
  city: "",
  location: "",
  area_marla: "",
  price_pkr: "",
  property_type: "residential",
  furnished_status: "",
  construction_status: "",
  legal_status: "unverified",
  assigned_agent: "",
  owner: "",            // UUID of the selected owner User
  owner_display: null as User | null,  // resolved user object (display only)
};

type PropertyForm = typeof BLANK_FORM;

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function PropertiesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Modal state
  const [showAdd,   setShowAdd]   = useState(false);
  const [editProp,  setEditProp]  = useState<Property | null>(null);
  const [detailProp, setDetailProp] = useState<Property | null>(null);
  const [deleteId,  setDeleteId]  = useState<string | null>(null);

  const [addForm,  setAddForm]  = useState<PropertyForm>(BLANK_FORM);
  const [editForm, setEditForm] = useState<PropertyForm>(BLANK_FORM);
  const [formError, setFormError] = useState("");

  const [rescoreMsg, setRescoreMsg] = useState<string | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["admin-properties", search, page],
    queryFn:  () => getProperties({
      ...(search ? { search } : {}),
      page,
    }).then((r) => r.data),
  });

  const properties: Property[] = data?.results ?? [];
  const totalCount: number = data?.count ?? 0;

  // ── Mutations ────────────────────────────────────────────────────────────────

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-properties"] });

  const addMutation = useMutation({
    mutationFn: (form: PropertyForm) =>
      createProperty(formToPayload(form)),
    onSuccess: () => { invalidate(); setShowAdd(false); setAddForm(BLANK_FORM); setFormError(""); },
    onError: (err: unknown) => setFormError(extractError(err)),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: PropertyForm }) =>
      updateProperty(id, formToPayload(form)),
    onSuccess: () => { invalidate(); setEditProp(null); setFormError(""); },
    onError: (err: unknown) => setFormError(extractError(err)),
  });

  const verify = useMutation({
    mutationFn: (id: string) => updateProperty(id, { legal_status: "verified" }),
    onSuccess: invalidate,
  });

  const rescore = useMutation({
    mutationFn: (id: string) => rescoreProperty(id),
    onSuccess: invalidate,
  });

  const rescoreAll = useMutation({
    mutationFn: () => rescoreAllProperties(),
    onSuccess: () => {
      invalidate();
      setRescoreMsg("All properties queued for rescoring.");
      setTimeout(() => setRescoreMsg(null), 4000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => { invalidate(); setDeleteId(null); },
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function openEdit(p: Property) {
    setEditProp(p);
    setEditForm({
      title:               p.title ?? "",
      description:         p.description ?? "",
      city:                p.city ?? "",
      location:            p.location ?? "",
      area_marla:          p.area_marla != null ? String(p.area_marla) : "",
      price_pkr:           p.price_pkr  != null ? String(p.price_pkr)  : "",
      property_type:       p.property_type ?? "residential",
      furnished_status:    p.furnished_status    ?? "",
      construction_status: p.construction_status ?? "",
      legal_status:        p.legal_status ?? "unverified",
      assigned_agent:      p.assigned_agent != null ? String(p.assigned_agent) : "",
      owner:               p.owner ?? "",
      owner_display:       p.owner_phone
        ? { id: p.owner ?? "", phone: p.owner_phone, name: null, role: "user", is_active: true, date_joined: "", last_active: null, ntn: null, cnic: null, is_filer: false } as User
        : null,
    });
    setFormError("");
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isLoading ? "Loading…" : `${properties.length} listing${properties.length !== 1 ? "s" : ""}`}
              {" · "}create, verify, rescore and manage listings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties…"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-56"
            />
            <button
              onClick={() => rescoreAll.mutate()}
              disabled={rescoreAll.isPending}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {rescoreAll.isPending ? "Rescoring…" : "Rescore All"}
            </button>
            <button
              onClick={() => { setShowAdd(true); setAddForm(BLANK_FORM); setFormError(""); }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              + Add Property
            </button>
          </div>
        </div>
        {rescoreMsg && (
          <p className="text-sm text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-4 py-2">
            {rescoreMsg}
          </p>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">AI Score</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Listed</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                    {p.title || `Property #${p.id.slice(0, 8)}`}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{p.city}</td>
                  <td className="px-5 py-3 text-gray-700">{p.price_pkr ? formatPKR(p.price_pkr) : "—"}</td>
                  <td className="px-5 py-3">
                    <Badge label={p.property_type} />
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {p.ai_score != null ? `${p.ai_score}/100` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      label={p.legal_status}
                      variant={
                        p.legal_status === "verified" ? "green" :
                        p.legal_status === "disputed" ? "red"   : "yellow"
                      }
                    />
                  </td>
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{formatDate(p.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setDetailProp(p)}
                        className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50 font-medium"
                      >
                        Edit
                      </button>
                      {p.legal_status !== "verified" && (
                        <button
                          onClick={() => verify.mutate(p.id)}
                          disabled={verify.isPending}
                          className="text-xs px-2.5 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => rescore.mutate(p.id)}
                        disabled={rescore.isPending}
                        className="text-xs px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 font-medium"
                      >
                        Rescore
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="text-xs px-2.5 py-1 rounded-md border border-red-100 text-red-400 hover:bg-red-50 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                    No properties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={totalCount}
          onPage={(p) => { setPage(p); window.scrollTo(0, 0); }}
        />
        </>
      )}

      {/* ── Add Modal ─────────────────────────────────────────────────────────── */}
      {showAdd && (
        <Modal title="Add Property" onClose={() => setShowAdd(false)} wide>
          <PropertyForm
            form={addForm}
            onChange={setAddForm}
            error={formError}
            onSubmit={() => addMutation.mutate(addForm)}
            pending={addMutation.isPending}
            submitLabel="Create Property"
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      {editProp && (
        <Modal title="Edit Property" onClose={() => setEditProp(null)} wide>
          <PropertyForm
            form={editForm}
            onChange={setEditForm}
            error={formError}
            onSubmit={() => editMutation.mutate({ id: editProp.id, form: editForm })}
            pending={editMutation.isPending}
            submitLabel="Save Changes"
            onCancel={() => setEditProp(null)}
          />
        </Modal>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      {detailProp && (
        <Modal title="Property Details" onClose={() => setDetailProp(null)}>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            <DetailRow label="Title"       value={detailProp.title} />
            <DetailRow label="Description" value={detailProp.description} />
            <DetailRow label="City"        value={detailProp.city} />
            <DetailRow label="Location"    value={detailProp.location} />
            <DetailRow label="Type"        value={detailProp.property_type} />
            <DetailRow label="Area"        value={detailProp.area_marla != null ? `${detailProp.area_marla} Marla` : undefined} />
            <DetailRow label="Price"       value={detailProp.price_pkr ? formatPKR(detailProp.price_pkr) : undefined} />
            <DetailRow label="Furnished"   value={detailProp.furnished_status ?? undefined} />
            <DetailRow label="Construction" value={detailProp.construction_status ?? undefined} />
            <DetailRow label="Legal Status">
              <Badge
                label={detailProp.legal_status}
                variant={
                  detailProp.legal_status === "verified" ? "green" :
                  detailProp.legal_status === "disputed" ? "red"   : "yellow"
                }
              />
            </DetailRow>
            <DetailRow label="AI Score"    value={detailProp.ai_score != null ? `${detailProp.ai_score}/100` : undefined} />
            <DetailRow label="Risk Level"  value={detailProp.risk_level ?? undefined} />
            <DetailRow label="Agent ID"    value={detailProp.assigned_agent != null ? String(detailProp.assigned_agent) : undefined} />
            <DetailRow label="Owner Phone" value={detailProp.owner_phone ?? undefined} mono />
            <DetailRow label="Active">
              <Badge label={detailProp.is_active ? "Yes" : "No"} variant={detailProp.is_active ? "green" : "red"} />
            </DetailRow>
            <DetailRow label="Listed"      value={formatDate(detailProp.created_at)} />
            <DetailRow label="Updated"     value={formatDate(detailProp.updated_at)} />
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      {deleteId && (
        <Modal title="Delete Property" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to permanently delete this property? This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Property form (shared by Add + Edit) ──────────────────────────────────────

function PropertyForm({
  form, onChange, error, onSubmit, pending, submitLabel, onCancel,
}: {
  form: PropertyForm;
  onChange: (f: PropertyForm) => void;
  error: string;
  onSubmit: () => void;
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  const set = (key: keyof PropertyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

      {/* Basic Info */}
      <Section label="Basic Info">
        <Field label="Title" required>
          <input
            type="text" value={form.title} onChange={set("title")}
            placeholder="e.g. 5 Marla House DHA Lahore Phase 5"
            className={inputCls}
          />
        </Field>
        <Field label="Property Type" required>
          <select value={form.property_type} onChange={set("property_type")} className={inputCls}>
            {PROPERTY_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <textarea
            value={form.description} onChange={set("description")} rows={3}
            placeholder="Brief description of the property…"
            className={inputCls}
          />
        </Field>
      </Section>

      {/* Location */}
      <Section label="Location">
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" required>
            <input
              type="text" value={form.city} onChange={set("city")}
              placeholder="e.g. Lahore"
              className={inputCls}
            />
          </Field>
          <Field label="Area / Society" required>
            <input
              type="text" value={form.location} onChange={set("location")}
              placeholder="e.g. DHA Phase 5, Block E"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* Size & Price */}
      <Section label="Size & Price">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Area (Marla)">
            <input
              type="number" min="0" step="0.5"
              value={form.area_marla} onChange={set("area_marla")}
              placeholder="e.g. 5"
              className={inputCls}
            />
          </Field>
          <Field label="Price (PKR)">
            <input
              type="number" min="0"
              value={form.price_pkr} onChange={set("price_pkr")}
              placeholder="e.g. 15000000"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* Property Details */}
      <Section label="Property Details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Furnished Status">
            <select value={form.furnished_status} onChange={set("furnished_status")} className={inputCls}>
              {FURNISHED_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Construction Status">
            <select value={form.construction_status} onChange={set("construction_status")} className={inputCls}>
              {CONSTRUCTION_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {/* Owner */}
      <Section label="Property Owner">
        <OwnerPicker
          selected={form.owner_display}
          onSelect={(u) => onChange({ ...form, owner: u?.id ?? "", owner_display: u ?? null })}
        />
      </Section>

      {/* Admin Controls */}
      <Section label="Admin Controls">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Legal Status">
            <select value={form.legal_status} onChange={set("legal_status")} className={inputCls}>
              {LEGAL_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Assigned Agent ID">
            <input
              type="number" min="1"
              value={form.assigned_agent} onChange={set("assigned_agent")}
              placeholder="Agent ID (optional)"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={pending || !form.title || !form.city || !form.location}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Modal({
  title, onClose, children, wide,
}: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
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

// ── Owner Picker ──────────────────────────────────────────────────────────────

const ROLE_VARIANT: Record<string, "green" | "blue" | "yellow" | "gray"> = {
  agent:     "green",
  developer: "yellow",
  user:      "blue",
  admin:     "gray",
};

const ROLE_LABEL: Record<string, string> = {
  agent:     "Agent",
  developer: "Developer",
  user:      "Client",
  admin:     "Admin",
};

function OwnerPicker({
  selected,
  onSelect,
}: {
  selected: User | null;
  onSelect: (u: User | null) => void;
}) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchUsers(query.trim());
      setResults(res.data?.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {selected.name || "—"}
            <Badge
              label={ROLE_LABEL[selected.role] ?? selected.role}
              variant={ROLE_VARIANT[selected.role] ?? "gray"}
            />
          </p>
          <p className="text-xs font-mono text-gray-500 mt-0.5">{selected.phone}</p>
          {selected.email && <p className="text-xs text-gray-400">{selected.email}</p>}
        </div>
        <button
          type="button"
          onClick={() => { onSelect(null); setQuery(""); setResults([]); setSearched(false); }}
          className="text-xs text-red-400 hover:text-red-600 font-medium ml-4"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">Search by phone number or name to find the owner.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="+923001234567 or name…"
          className={`${inputCls} flex-1`}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {searched && results.length === 0 && !loading && (
        <p className="text-xs text-gray-400 py-1">No users found. Try a different phone or name.</p>
      )}

      {results.length > 0 && (
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-50 max-h-48 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => { onSelect(u); setResults([]); setSearched(false); }}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 text-left transition-colors"
            >
              <div>
                <span className="text-sm font-medium text-gray-800">{u.name || "(no name)"}</span>
                <span className="ml-2">
                  <Badge label={ROLE_LABEL[u.role] ?? u.role} variant={ROLE_VARIANT[u.role] ?? "gray"} />
                </span>
                <p className="text-xs font-mono text-gray-500">{u.phone}</p>
              </div>
              <span className="text-xs text-blue-600 font-medium ml-3">Select</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-300 italic">Leave empty to create an anonymous listing.</p>
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

function formToPayload(form: PropertyForm): Record<string, unknown> {
  return {
    title:               form.title,
    description:         form.description || undefined,
    city:                form.city,
    location:            form.location,
    property_type:       form.property_type,
    area_marla:          form.area_marla  ? Number(form.area_marla)  : null,
    price_pkr:           form.price_pkr   ? Number(form.price_pkr)   : null,
    furnished_status:    form.furnished_status    || null,
    construction_status: form.construction_status || null,
    legal_status:        form.legal_status,
    assigned_agent:      form.assigned_agent ? Number(form.assigned_agent) : null,
    owner:               form.owner || null,
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
