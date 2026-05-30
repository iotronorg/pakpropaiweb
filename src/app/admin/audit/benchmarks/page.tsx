"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBenchmarks, createBenchmark, updateBenchmark, deleteBenchmark } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, Check, X, ChevronDown } from "lucide-react";

interface Benchmark {
  id: number;
  city: string;
  location_key: string;
  ppm_min: number;
  ppm_max: number;
  yield_pct: number;
  appr_pct: number;
  liq_months: number;
  approved: boolean | null;
  is_active: boolean;
  updated_at: string;
}

type Draft = Omit<Benchmark, "id" | "updated_at">;

const CITIES = ["all", "lahore", "islamabad", "karachi", "rawalpindi", "default"];

const EMPTY_DRAFT: Draft = {
  city: "lahore",
  location_key: "",
  ppm_min: 1_000_000,
  ppm_max: 3_000_000,
  yield_pct: 4.0,
  appr_pct: 8.0,
  liq_months: 4,
  approved: null,
  is_active: true,
};

function fmtBenchmarkPrice(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  return formatCurrency(n);
}

function approvedLabel(v: boolean | null) {
  if (v === true) return { text: "Yes", cls: "text-green-700 bg-green-50 border-green-200" };
  if (v === false) return { text: "No", cls: "text-red-700 bg-red-50 border-red-200" };
  return { text: "Unknown", cls: "text-gray-500 bg-gray-50 border-gray-200" };
}

function parseApproved(val: string): boolean | null {
  if (val === "true") return true;
  if (val === "false") return false;
  return null;
}

// ── Shared input style ─────────────────────────────────────────────────────────
const INPUT = "w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200";

// ── Row form (used for both edit-in-place and add-new) ────────────────────────
function BenchmarkForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
  isNew,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew?: boolean;
}) {
  return (
    <tr className={isNew ? "bg-blue-50 border-y border-blue-200" : "bg-yellow-50 border-y border-yellow-200"}>
      {/* city */}
      <td className="px-3 py-2">
        <input
          className={INPUT}
          value={draft.city}
          onChange={(e) => onChange({ city: e.target.value.toLowerCase() })}
          placeholder="e.g. lahore"
        />
      </td>
      {/* location_key */}
      <td className="px-3 py-2">
        <input
          className={INPUT}
          value={draft.location_key}
          onChange={(e) => onChange({ location_key: e.target.value.toLowerCase() })}
          placeholder="e.g. dha, default"
        />
      </td>
      {/* ppm_min */}
      <td className="px-3 py-2">
        <input
          type="number"
          className={INPUT}
          value={draft.ppm_min}
          onChange={(e) => onChange({ ppm_min: Number(e.target.value) })}
        />
      </td>
      {/* ppm_max */}
      <td className="px-3 py-2">
        <input
          type="number"
          className={INPUT}
          value={draft.ppm_max}
          onChange={(e) => onChange({ ppm_max: Number(e.target.value) })}
        />
      </td>
      {/* yield_pct */}
      <td className="px-3 py-2">
        <input
          type="number"
          step="0.1"
          className={INPUT}
          value={draft.yield_pct}
          onChange={(e) => onChange({ yield_pct: Number(e.target.value) })}
        />
      </td>
      {/* appr_pct */}
      <td className="px-3 py-2">
        <input
          type="number"
          step="0.5"
          className={INPUT}
          value={draft.appr_pct}
          onChange={(e) => onChange({ appr_pct: Number(e.target.value) })}
        />
      </td>
      {/* liq_months */}
      <td className="px-3 py-2">
        <input
          type="number"
          className={INPUT}
          value={draft.liq_months}
          onChange={(e) => onChange({ liq_months: Number(e.target.value) })}
        />
      </td>
      {/* approved */}
      <td className="px-3 py-2">
        <div className="relative">
          <select
            className={`${INPUT} appearance-none pe-6`}
            value={draft.approved === null ? "null" : String(draft.approved)}
            onChange={(e) => onChange({ approved: parseApproved(e.target.value) })}
          >
            <option value="null">Unknown</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </td>
      {/* is_active */}
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={() => onChange({ is_active: !draft.is_active })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            draft.is_active ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            draft.is_active ? "translate-x-4" : "translate-x-0.5"
          }`} />
        </button>
      </td>
      {/* actions */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Check size={11} />
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <X size={11} />
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BenchmarksPage() {
  const qc = useQueryClient();

  const [cityFilter, setCityFilter] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ ...EMPTY_DRAFT });
  const [showAdd, setShowAdd] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>({ ...EMPTY_DRAFT });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data, isLoading } = useQuery<Benchmark[]>({
    queryKey: ["benchmarks"],
    queryFn: () => getBenchmarks().then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["benchmarks"] });

  const addMutation = useMutation({
    mutationFn: (d: Draft) => createBenchmark(d as Record<string, unknown>),
    onSuccess: () => { invalidate(); setShowAdd(false); setNewDraft({ ...EMPTY_DRAFT }); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, d }: { id: number; d: Partial<Draft> }) =>
      updateBenchmark(id, d as Record<string, unknown>),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBenchmark(id),
    onSuccess: () => { invalidate(); setDeleteConfirmId(null); },
  });

  const toggleActive = (b: Benchmark) =>
    editMutation.mutate({ id: b.id, d: { is_active: !b.is_active } });

  const startEdit = (b: Benchmark) => {
    setEditingId(b.id);
    setEditDraft({
      city: b.city,
      location_key: b.location_key,
      ppm_min: b.ppm_min,
      ppm_max: b.ppm_max,
      yield_pct: b.yield_pct,
      appr_pct: b.appr_pct,
      liq_months: b.liq_months,
      approved: b.approved,
      is_active: b.is_active,
    });
    setShowAdd(false);
  };

  const benchmarks = data ?? [];
  const filtered =
    cityFilter === "all"
      ? benchmarks
      : benchmarks.filter((b) => b.city === cityFilter);

  const uniqueCities = Array.from(new Set(benchmarks.map((b) => b.city))).sort();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Benchmarks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Price-per-marla ranges, yield, appreciation, and liquidity data used to score every
            property audit report. Edit any row to update future audits instantly.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setNewDraft({ ...EMPTY_DRAFT }); }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          Add Benchmark
        </button>
      </div>

      {/* City filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["all", ...uniqueCities].map((c) => (
          <button
            key={c}
            onClick={() => setCityFilter(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              cityFilter === c
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {c === "all" ? "All Cities" : c}
            {c !== "all" && (
              <span className="ms-1.5 opacity-60">
                ({benchmarks.filter((b) => b.city === c).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-start text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-3 py-3">City</th>
                <th className="px-3 py-3">Location Key</th>
                <th className="px-3 py-3">PPM Min</th>
                <th className="px-3 py-3">PPM Max</th>
                <th className="px-3 py-3">Yield %</th>
                <th className="px-3 py-3">Appr. %</th>
                <th className="px-3 py-3">Liq. Months</th>
                <th className="px-3 py-3">Approved</th>
                <th className="px-3 py-3">Active</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Add-new row at top */}
              {showAdd && (
                <BenchmarkForm
                  draft={newDraft}
                  onChange={(p) => setNewDraft((d) => ({ ...d, ...p }))}
                  onSave={() => addMutation.mutate(newDraft)}
                  onCancel={() => setShowAdd(false)}
                  saving={addMutation.isPending}
                  isNew
                />
              )}

              {filtered.map((b) =>
                editingId === b.id ? (
                  <BenchmarkForm
                    key={b.id}
                    draft={editDraft}
                    onChange={(p) => setEditDraft((d) => ({ ...d, ...p }))}
                    onSave={() => editMutation.mutate({ id: b.id, d: editDraft })}
                    onCancel={() => setEditingId(null)}
                    saving={editMutation.isPending}
                  />
                ) : (
                  <tr
                    key={b.id}
                    className={`hover:bg-gray-50 transition-colors ${!b.is_active ? "opacity-50" : ""}`}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-800 capitalize">{b.city}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-700">{b.location_key}</td>
                    <td className="px-3 py-2.5 text-gray-600">{fmtBenchmarkPrice(b.ppm_min)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{fmtBenchmarkPrice(b.ppm_max)}</td>
                    <td className="px-3 py-2.5 text-blue-700 font-medium">{b.yield_pct}%</td>
                    <td className="px-3 py-2.5 text-green-700 font-medium">{b.appr_pct}%</td>
                    <td className="px-3 py-2.5 text-gray-600">{b.liq_months} mo</td>
                    <td className="px-3 py-2.5">
                      {(() => {
                        const { text, cls } = approvedLabel(b.approved);
                        return (
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}>
                            {text}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => toggleActive(b)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          b.is_active ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          b.is_active ? "translate-x-4" : "translate-x-0.5"
                        }`} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      {deleteConfirmId === b.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteMutation.mutate(b.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? "…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded border border-gray-300 bg-white px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(b)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(b.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              )}

              {filtered.length === 0 && !showAdd && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                    No benchmarks found
                    {cityFilter !== "all" && ` for "${cityFilter}"`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Info footer */}
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>How benchmarks work:</strong> When an audit is requested, the engine finds the
        best-matching row by city + location key substring match, falls back to the city{" "}
        <code className="font-mono">default</code>, then the global{" "}
        <code className="font-mono">default / default</code> row. Changes take effect on the{" "}
        <em>next</em> audit request — existing reports are not retroactively updated.
      </div>
    </div>
  );
}
