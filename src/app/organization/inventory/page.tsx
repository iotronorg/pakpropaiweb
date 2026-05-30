"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProperties, getPropertyReport, getProperty, uploadPropertyImages, deletePropertyImage, getMyOrganization, getTrustCertificate } from "@/lib/api";
import { formatArea } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { StatCard, BreakdownBar, ChartCard, BarChart, type Period, type TrendPoint } from "@/components/ui/Charts";
import type { Property, PropertyImage, PropertyReportData } from "@/types";

// ── Trust Certificate Cell ────────────────────────────────────────────────────

function CertificateCell({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await getTrustCertificate(propertyId);
      if (res.status === 202) {
        setGenerating(true);
        return;
      }
      const url: string = res.data?.certificate_url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // certificate not ready or not found
      setGenerating(true);
    } finally {
      setLoading(false);
    }
  }

  if (generating) {
    return <span className="text-xs text-gray-400 italic">Generating…</span>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-medium text-emerald-600 hover:text-emerald-800 whitespace-nowrap disabled:opacity-50"
    >
      {loading ? "Loading…" : "Download"}
    </button>
  );
}

// ── Image Management Modal ────────────────────────────────────────────────────

function ImageManageModal({
  propertyId,
  propertyTitle,
  onClose,
}: {
  propertyId: string;
  propertyTitle: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const { data: prop, isLoading } = useQuery({
    queryKey: ["property-detail", propertyId],
    queryFn: () => getProperty(propertyId).then((r) => r.data as Property),
  });

  const deleteMut = useMutation({
    mutationFn: ({ imgId }: { imgId: string }) =>
      deletePropertyImage(propertyId, imgId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["property-detail", propertyId] }),
    onError: () => setError("Failed to delete image."),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      await uploadPropertyImages(propertyId, files);
      await qc.invalidateQueries({ queryKey: ["property-detail", propertyId] });
      await qc.invalidateQueries({ queryKey: ["org-inventory"] });
    } catch {
      setError("Upload failed. Max 5 MB per image; JPEG/PNG/WebP only.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const images: PropertyImage[] = prop?.images ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Manage Images</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{propertyTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : images.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No images uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="group relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                  <img src={img.url} alt={img.caption || "property"} className="w-full h-full object-cover" />
                  <button
                    onClick={() => deleteMut.mutate({ imgId: img.id })}
                    disabled={deleteMut.isPending}
                    className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs shadow"
                    title="Delete"
                  >
                    &times;
                  </button>
                  {img.caption && (
                    <p className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black/50 px-2 py-1 truncate">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">{images.length}/10 images · JPEG, PNG, WebP · max 5 MB each</p>
            <div className="flex items-center gap-2">
              {uploading && <LoadingSpinner />}
              <label className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium ${images.length >= 10 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                {uploading ? "Uploading…" : "Upload Images"}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={images.length >= 10 || uploading}
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LEGAL_VARIANT: Record<string, "green" | "yellow" | "red" | "gray"> = {
  verified:   "green",
  pending:    "yellow",
  disputed:   "red",
  unverified: "gray",
};

const RISK_COLOR: Record<string, string> = {
  low:    "text-green-600 bg-green-50",
  medium: "text-amber-600 bg-amber-50",
  high:   "text-red-600 bg-red-50",
};

export default function OrgInventoryPage() {
  const [search,    setSearch]    = useState("");
  const [typeFilter, setType]     = useState("");
  const [legalFilter, setLegal]   = useState("");
  const [period, setPeriod]       = useState<Period>("monthly");
  const [imageModal, setImageModal] = useState<{ id: string; title: string } | null>(null);

  const { data: propResponse, isLoading: l1 } = useQuery({
    queryKey: ["org-inventory"],
    queryFn: () => getProperties().then((r) => r.data),
  });

  const { data: reportData, isLoading: l2 } = useQuery({
    queryKey: ["org-property-report", period],
    queryFn: () => getPropertyReport({ period }).then((r) => r.data as PropertyReportData),
  });

  const { data: orgProfile } = useQuery({
    queryKey: ["org-profile"],
    queryFn: () => getMyOrganization().then((r) => r.data),
  });

  if (l1 || l2) {
    return (
      <div className="flex items-center justify-center py-32">
        <LoadingSpinner />
      </div>
    );
  }

  const allProperties: Property[] = propResponse?.results ?? propResponse ?? [];
  const report = reportData ?? {
    total: 0, avg_ai_score: 0, installment_available: 0,
    by_type: {}, by_legal_status: {}, by_risk_level: {}, by_city: {},
  };
  const trend: TrendPoint[] = report.trend ?? [];

  const filtered = allProperties.filter((p) => {
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.ref_no.toLowerCase().includes(search.toLowerCase());
    const matchType  = !typeFilter  || p.property_type === typeFilter;
    const matchLegal = !legalFilter || p.legal_status  === legalFilter;
    return matchSearch && matchType && matchLegal;
  });

  const types  = [...new Set(allProperties.map((p) => p.property_type).filter(Boolean))];
  const legals = ["verified", "pending", "unverified", "disputed"];

  return (
    <div className="space-y-7 pb-10">

      {imageModal && (
        <ImageManageModal
          propertyId={imageModal.id}
          propertyTitle={imageModal.title}
          onClose={() => setImageModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Your organization's property portfolio</p>
        </div>
        <a
          href="/organization/inventory/analytics"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View Analytics →
        </a>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Listings"       value={report.total}                accent="blue"    icon="🏠" />
        <StatCard label="Verified"             value={report.by_legal_status?.verified ?? 0} accent="emerald" icon="✅" sub="Legally confirmed" />
        <StatCard label="Installment Plans"    value={report.installment_available} accent="violet"  icon="📅" />
        <StatCard label="Avg AI Score"         value={`${report.avg_ai_score}/100`} accent="amber"   icon="🤖" />
      </div>

      {/* Distribution row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">By Property Type</h3>
          {Object.keys(report.by_type).length > 0
            ? <BreakdownBar data={report.by_type} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Legal Status</h3>
          {Object.keys(report.by_legal_status).length > 0
            ? <BreakdownBar data={report.by_legal_status} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Cities</h3>
          {Object.keys(report.by_city).length > 0
            ? <BreakdownBar data={report.by_city} />
            : <p className="text-xs text-gray-400 text-center py-4">No data</p>}
        </div>
      </div>

      {/* Trend chart */}
      {trend.length > 0 && (
        <ChartCard title="Inventory Growth" period={period} onPeriodChange={setPeriod}>
          <BarChart data={trend} period={period} color="emerald" height={28} />
        </ChartCard>
      )}

      {/* Filters + Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-800 me-auto">All Listings</h2>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by title, city, ref…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 w-52"
          />

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>

          {/* Legal filter */}
          <select
            value={legalFilter}
            onChange={(e) => setLegal(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Legal</option>
            {legals.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <span className="text-xs text-gray-400">{filtered.length} results</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Ref", "Title", "City", "Type", "Price", "AI Score", "Risk", "Legal", "Agent", "Status", "Images", "Certificate"].map((h) => (
                  <th key={h} className="px-5 py-3 text-start text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-sm text-gray-400">
                    {allProperties.length === 0
                      ? "No inventory yet — add properties to get started"
                      : "No results match your filters"}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{p.ref_no}</td>
                    <td className="px-5 py-3 max-w-[200px]">
                      <p className="font-medium text-gray-900 truncate">{p.title}</p>
                      {p.area_sqm && (
                        <p className="text-xs text-gray-400">{formatArea(p.area_sqm, orgProfile?.measurement_system ?? 'pk_traditional')}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{p.city}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize whitespace-nowrap">
                      {p.property_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap tabular-nums">
                      {p.price
                        ? <span className="font-medium text-gray-800">
                            {p.price >= 10_000_000
                              ? `${(p.price / 10_000_000).toFixed(1)}Cr`
                              : p.price >= 100_000
                              ? `${(p.price / 100_000).toFixed(1)}L`
                              : p.price.toLocaleString()}
                          </span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {p.ai_score !== null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 rounded-full bg-gray-100">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                p.ai_score >= 70 ? "bg-emerald-500"
                                : p.ai_score >= 40 ? "bg-amber-400"
                                : "bg-red-400"
                              }`}
                              style={{ width: `${p.ai_score}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums text-gray-700">{p.ai_score}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.risk_level ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${RISK_COLOR[p.risk_level] ?? "text-gray-500 bg-gray-50"}`}>
                          {p.risk_level}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 capitalize">
                      <Badge
                        label={p.legal_status}
                        variant={LEGAL_VARIANT[p.legal_status] ?? "gray"}
                      />
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {p.owner_phone ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        label={p.is_active ? "Active" : "Inactive"}
                        variant={p.is_active ? "green" : "gray"}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setImageModal({ id: p.id, title: p.title })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                      >
                        {p.primary_image ? "View / Edit" : "Upload"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      {p.legal_status === "verified" ? (
                        <CertificateCell propertyId={p.id} />
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
