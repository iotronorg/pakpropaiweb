"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProperties, createProperty, updateProperty, deleteProperty,
  uploadPropertyImages, deletePropertyImage, requestVerification,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";
import { Property } from "@/types";

const TYPES = ["All", "apartment", "house", "plot", "commercial"];
const PROPERTY_TYPES = ["apartment", "house", "plot", "commercial"];
const CONSTRUCTION_STATUSES = ["under_construction", "ready", "shell"];
const FURNISHED_STATUSES = ["furnished", "semi_furnished", "unfurnished"];

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function PropertyForm({
  initial,
  onSubmit,
  loading,
  onClose,
}: {
  initial?: Partial<Property>;
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [propertyType, setPropertyType] = useState(initial?.property_type ?? "apartment");
  const [city, setCity] = useState(initial?.city ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [pricePkr, setPricePkr] = useState(String(initial?.price_pkr ?? ""));
  const [areaMarla, setAreaMarla] = useState(String(initial?.area_marla ?? ""));
  const [constructionStatus, setConstructionStatus] = useState(initial?.construction_status ?? "");
  const [furnishedStatus, setFurnishedStatus] = useState(initial?.furnished_status ?? "");
  const [description, setDescription] = useState((initial as Record<string, unknown>)?.description as string ?? "");

  function handleSubmit() {
    const payload: Record<string, unknown> = {
      title,
      property_type: propertyType,
      city,
      location,
      ...(pricePkr ? { price_pkr: Number(pricePkr) } : {}),
      ...(areaMarla ? { area_marla: Number(areaMarla) } : {}),
      ...(constructionStatus ? { construction_status: constructionStatus } : {}),
      ...(furnishedStatus ? { furnished_status: furnishedStatus } : {}),
      ...(description ? { description } : {}),
    };
    onSubmit(payload);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 5 Marla House DHA Phase 6" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select className={inputCls} value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City <span className="text-red-500">*</span></label>
          <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lahore" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Location / Society</label>
          <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. DHA Phase 6" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Price (PKR)</label>
          <input type="number" className={inputCls} value={pricePkr} onChange={(e) => setPricePkr(e.target.value)} placeholder="e.g. 15000000" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Area (Marla)</label>
          <input type="number" className={inputCls} value={areaMarla} onChange={(e) => setAreaMarla(e.target.value)} placeholder="e.g. 5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Construction Status</label>
          <select className={inputCls} value={constructionStatus} onChange={(e) => setConstructionStatus(e.target.value)}>
            <option value="">— Select —</option>
            {CONSTRUCTION_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Furnished Status</label>
          <select className={inputCls} value={furnishedStatus} onChange={(e) => setFurnishedStatus(e.target.value)}>
            <option value="">— Select —</option>
            {FURNISHED_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea
          rows={2}
          className={`${inputCls} resize-none`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details about this property..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={loading || !city}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Property"}
        </button>
      </div>
    </div>
  );
}

function PropertyFormModal({
  title,
  initial,
  onSubmit,
  loading,
  onClose,
}: {
  title: string;
  initial?: Partial<Property>;
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="px-6 py-5">
          <PropertyForm initial={initial} onSubmit={onSubmit} loading={loading} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

function PropertyImagesSection({
  propertyId,
  images,
}: {
  propertyId: string;
  images: { id: string; url: string; caption: string }[];
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadPropertyImages(propertyId, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-inventory"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => deletePropertyImage(propertyId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-inventory"] }),
  });

  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) uploadMutation.mutate(files);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
        >
          {uploadMutation.isPending ? "Uploading…" : "+ Photos"}
        </button>
        {images.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {images.length} photo{images.length !== 1 ? "s" : ""} {expanded ? "▲" : "▼"}
          </button>
        )}
      </div>
      {expanded && images.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-md overflow-hidden bg-gray-100 h-20">
              <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover" />
              <button
                onClick={() => deleteMutation.mutate(img.id)}
                disabled={deleteMutation.isPending}
                className="absolute top-0.5 right-0.5 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dev-inventory", typeFilter],
    queryFn: () =>
      getProperties(typeFilter !== "All" ? { property_type: typeFilter } : undefined).then(
        (r) => r.data
      ),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createProperty(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dev-inventory"] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateProperty(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dev-inventory"] });
      setEditProperty(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dev-inventory"] });
      setDeleteConfirmId(null);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => requestVerification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dev-inventory"] }),
  });

  const properties: Property[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            All units in your portfolio — {data?.count ?? 0} total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
          >
            + Add Property
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge label={p.property_type} variant="blue" />
                <Badge
                  label={p.legal_status}
                  variant={
                    p.legal_status === "verified" ? "green"
                    : p.legal_status === "disputed" ? "red"
                    : "yellow"
                  }
                />
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">{p.title || `Unit #${p.id}`}</h3>
                {p.ref_no && (
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{p.ref_no}</p>
                )}
                <p className="text-sm text-gray-500 mt-0.5">{p.location}, {p.city}</p>
              </div>

              <p className="text-xl font-bold text-blue-700">
                {p.price_pkr ? formatPKR(p.price_pkr) : "TBD"}
              </p>

              <div className="flex flex-wrap gap-1 text-xs">
                {p.area_marla && <span className="text-gray-400">{p.area_marla} marla</span>}
                {p.construction_status && (
                  <Badge label={p.construction_status.replace("_", " ")} variant={p.construction_status === "ready" ? "green" : "yellow"} />
                )}
                {p.ai_score !== null && (
                  <span className={`font-medium ${p.ai_score >= 70 ? "text-green-600" : p.ai_score >= 45 ? "text-yellow-600" : "text-red-500"}`}>
                    Score {p.ai_score}/100
                  </span>
                )}
              </div>

              {p.primary_image && (
                <div className="rounded-lg overflow-hidden bg-gray-100 h-28">
                  <img src={p.primary_image} alt={p.title} className="w-full h-full object-cover" />
                </div>
              )}

              <p className="text-xs text-gray-400">{formatDate(p.created_at)}</p>

              {/* Image gallery */}
              <PropertyImagesSection propertyId={p.id} images={p.images ?? []} />

              {/* Action bar */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-50">
                <button
                  onClick={() => setEditProperty(p)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </button>
                {p.legal_status === "unverified" && (
                  <button
                    onClick={() => verifyMutation.mutate(p.id)}
                    disabled={verifyMutation.isPending}
                    className="text-xs text-purple-600 hover:underline disabled:opacity-50"
                  >
                    Request Verification
                  </button>
                )}
                {p.legal_status === "pending" && (
                  <span className="text-xs text-yellow-600">Verification pending</span>
                )}
                <button
                  onClick={() => setDeleteConfirmId(p.id)}
                  className="text-xs text-red-500 hover:underline ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {properties.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400">
              <p>No inventory found</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Add your first property
              </button>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <PropertyFormModal
          title="Add Property"
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      )}

      {editProperty && (
        <PropertyFormModal
          title="Edit Property"
          initial={editProperty}
          onClose={() => setEditProperty(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editProperty.id, data })}
          loading={updateMutation.isPending}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Delete Property?</h3>
            <p className="text-sm text-gray-500 mb-4">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
