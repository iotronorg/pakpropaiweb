"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProperties, requestVerification, getDealLocks, uploadPropertyImages, deletePropertyImage, initiateDealLock } from "@/lib/api";
import type { DealLock, Property } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";

const LEGAL_COLOR: Record<string, "green" | "yellow" | "red" | "gray"> = {
  verified:   "green",
  pending:    "yellow",
  unverified: "gray",
  disputed:   "red",
};

const FILTERS = ["all", "verified", "pending", "unverified", "disputed"] as const;
type Filter = typeof FILTERS[number];

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-300">Not scored</span>;
  const color = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">{score}/100</span>
    </div>
  );
}

function PropertyImageUploader({ propertyId }: { propertyId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadPropertyImages(propertyId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent-listings"] }),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) uploadMutation.mutate(files);
    e.target.value = "";
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploadMutation.isPending}
        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
      >
        {uploadMutation.isPending ? "Uploading..." : "+ Add Photos"}
      </button>
      {uploadMutation.isError && (
        <p className="text-xs text-red-500 mt-0.5">Upload failed</p>
      )}
    </div>
  );
}

const GATEWAYS = [
  { value: "manual",    label: "Manual Payment" },
  { value: "safepay",   label: "Safepay" },
  { value: "jazzcash",  label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
];

function DealLockInitiateModal({
  propertyId,
  propertyTitle,
  onClose,
  onSuccess,
}: {
  propertyId: string;
  propertyTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tokenAmount, setTokenAmount] = useState(25000);
  const [gateway, setGateway] = useState("manual");
  const [error, setError] = useState("");

  const initiateMutation = useMutation({
    mutationFn: () =>
      initiateDealLock({ property_id: propertyId, token_amount: tokenAmount, payment_gateway: gateway }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: unknown) => {
      const d = (e as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const first = d ? Object.values(d)[0] : null;
      setError(Array.isArray(first) ? String(first[0]) : "Failed to initiate deal lock.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Lock Deal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">{propertyTitle}</p>
            <p className="text-xs text-blue-600">
              Locking this deal gives the buyer 48 hours of exclusivity. Both parties will be notified via WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Token Amount (PKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={25000}
              max={100000}
              step={5000}
              value={tokenAmount}
              onChange={(e) => setTokenAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">PKR 25,000 – 100,000</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Gateway</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GATEWAYS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={() => initiateMutation.mutate()}
              disabled={initiateMutation.isPending || tokenAmount < 25000 || tokenAmount > 100000}
              className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {initiateMutation.isPending ? "Initiating…" : "Lock Deal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentListingsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedImages, setExpandedImages] = useState<string | null>(null);
  const [lockModalProperty, setLockModalProperty] = useState<Property | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-listings"],
    queryFn: () => getMyProperties().then((r) => r.data),
  });

  const { data: dealsData } = useQuery({
    queryKey: ["active-deals"],
    queryFn: () => getDealLocks({ status: "locked" }).then((r) => (r.data?.results ?? []) as DealLock[]),
  });
  const lockedPropertyIds = new Set<string>((dealsData ?? []).map((d) => d.property));

  const verifyMutation = useMutation({
    mutationFn: (id: string) => requestVerification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent-listings"] }),
  });

  const allProperties: Property[] = data?.results ?? [];
  const properties = filter === "all"
    ? allProperties
    : allProperties.filter((p) => p.legal_status === filter);

  const counts = {
    all:        allProperties.length,
    verified:   allProperties.filter((p) => p.legal_status === "verified").length,
    pending:    allProperties.filter((p) => p.legal_status === "pending").length,
    unverified: allProperties.filter((p) => p.legal_status === "unverified").length,
    disputed:   allProperties.filter((p) => p.legal_status === "disputed").length,
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Properties you have listed via WhatsApp or manually
          </p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 max-w-xs text-right">
          <p className="text-xs text-blue-700">
            List a property by WhatsApp — AI structures it automatically
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`ml-1.5 ${filter === f ? "text-blue-200" : "text-gray-400"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : properties.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-gray-400">
            {filter === "all" ? "No listings yet" : `No ${filter} listings`}
          </p>
          {filter === "all" && (
            <p className="mt-1 text-xs text-gray-300">
              Send a WhatsApp message to list your first property
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-3"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <Badge label={p.property_type} />
                <div className="flex gap-1 items-center">
                  {lockedPropertyIds.has(p.id) && (
                    <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      🔒 Locked
                    </span>
                  )}
                  <Badge
                    label={p.legal_status}
                    variant={LEGAL_COLOR[p.legal_status] ?? "gray"}
                  />
                </div>
              </div>

              {/* Title + location */}
              <div>
                <h3 className="font-semibold text-gray-900 leading-snug">
                  {p.title || `Property #${p.id}`}
                </h3>
                <p className="mt-0.5 text-sm text-gray-500">{p.location}, {p.city}</p>
              </div>

              {/* Price + area */}
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-bold text-blue-700">
                  {p.price_pkr ? formatPKR(p.price_pkr) : "Price TBD"}
                </p>
                {p.area_marla && (
                  <span className="text-sm text-gray-500">{p.area_marla} marla</span>
                )}
              </div>

              {/* AI score */}
              <ScoreBar score={p.ai_score} />

              {/* Secondary badges */}
              <div className="flex flex-wrap gap-1">
                {p.construction_status && (
                  <Badge
                    label={p.construction_status.replace("_", " ")}
                    variant={p.construction_status === "ready" ? "green" : "yellow"}
                  />
                )}
                {p.furnished_status && (
                  <Badge label={p.furnished_status.replace("_", " ")} />
                )}
                {p.risk_level && (
                  <Badge
                    label={`${p.risk_level} risk`}
                    variant={p.risk_level === "low" ? "green" : p.risk_level === "high" ? "red" : "yellow"}
                  />
                )}
              </div>

              {/* Images */}
              {p.primary_image && (
                <div className="rounded-lg overflow-hidden bg-gray-100 h-32">
                  <img
                    src={p.primary_image}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-400">{formatDate(p.created_at)}</p>
                  <span className="text-gray-300">·</span>
                  <PropertyImageUploader propertyId={p.id} />
                  {(p.images?.length ?? 0) > 0 && (
                    <span className="text-xs text-gray-400">{p.images.length} photo{p.images.length !== 1 ? "s" : ""}</span>
                  )}
                </div>
                {p.legal_status === "unverified" && (
                  <button
                    onClick={() => verifyMutation.mutate(p.id)}
                    disabled={verifyMutation.isPending}
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Request Verification
                  </button>
                )}
                {p.legal_status === "pending" && (
                  <span className="text-xs text-yellow-600 font-medium">Verification pending</span>
                )}
                {!lockedPropertyIds.has(p.id) && p.legal_status === "verified" && (
                  <button
                    onClick={() => setLockModalProperty(p)}
                    className="rounded-md bg-orange-600 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-700 transition-colors"
                  >
                    Lock Deal
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lockModalProperty && (
        <DealLockInitiateModal
          propertyId={lockModalProperty.id}
          propertyTitle={lockModalProperty.title || `Property #${lockModalProperty.id}`}
          onClose={() => setLockModalProperty(null)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["active-deals"] })}
        />
      )}
    </div>
  );
}
