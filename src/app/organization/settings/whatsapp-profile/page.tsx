"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWhatsAppConfig, updateWhatsAppConfig, syncWaProfile } from "@/lib/api";
import type { OrgWhatsAppConfig } from "@/types";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday",
  thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
};

const META_VERTICALS = [
  "REAL_ESTATE", "FINANCE", "LEGAL", "PROFESSIONAL_SERVICES",
  "CONSTRUCTION", "OTHER",
];

function defaultHours(): OrgWhatsAppConfig["support_hours"] {
  return Object.fromEntries(
    DAYS.map((d) => [d, { open: "09:00", close: "18:00", closed: false }])
  );
}

export default function WhatsAppProfilePage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["wa-config"],
    queryFn: getWhatsAppConfig,
  });

  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput]   = useState("");
  const [tags, setTags]         = useState<string[]>([]);
  const [greeting, setGreeting] = useState("");
  const [hours, setHours]       = useState<OrgWhatsAppConfig["support_hours"]>(defaultHours());
  const [initialised, setInit]  = useState(false);

  if (data && !initialised) {
    setKeywords(data.directory_keywords ?? []);
    setTags(data.category_tags ?? []);
    setGreeting(data.localized_greeting ?? "");
    setHours(
      Object.keys(data.support_hours ?? {}).length ? data.support_hours : defaultHours()
    );
    setInit(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateWhatsAppConfig({
        directory_keywords: keywords,
        category_tags:      tags,
        localized_greeting: greeting,
        support_hours:      hours,
      } as Partial<OrgWhatsAppConfig>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wa-config"] }),
  });

  const syncMutation = useMutation({ mutationFn: syncWaProfile });

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (kw && !keywords.includes(kw)) setKeywords((p) => [...p, kw]);
    setKwInput("");
  };

  const toggleDay = (day: string) =>
    setHours((h) => ({
      ...h,
      [day]: { ...h[day], closed: !h[day].closed },
    }));

  const setTime = (day: string, field: "open" | "close", val: string) =>
    setHours((h) => ({ ...h, [day]: { ...h[day], [field]: val } }));

  if (isLoading) {
    return <div className="p-8 text-gray-500 text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">WhatsApp Business Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure how your organisation appears in Meta&apos;s Business Directory.
        </p>
      </div>

      {/* Directory Keywords */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Directory Keywords
        </h2>
        <p className="text-xs text-gray-500">
          Keywords Meta uses to surface your number in Business Directory searches.
        </p>
        <div className="flex gap-2">
          <input
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addKeyword();
              }
            }}
            placeholder="Type keyword and press Enter"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={addKeyword}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full"
            >
              {kw}
              <button
                onClick={() => setKeywords((p) => p.filter((k) => k !== kw))}
                className="ml-1 text-blue-400 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Category Tags */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Business Category
        </h2>
        <p className="text-xs text-gray-500">Meta WABA vertical — select all that apply.</p>
        <div className="flex flex-wrap gap-2">
          {META_VERTICALS.map((v) => (
            <button
              key={v}
              onClick={() =>
                setTags((p) => (p.includes(v) ? p.filter((t) => t !== v) : [...p, v]))
              }
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                tags.includes(v)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
              }`}
            >
              {v.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </section>

      {/* Localized Greeting */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Localized Greeting
        </h2>
        <p className="text-xs text-gray-500">
          Shown to users who discover you via directory. Max 256 characters.
        </p>
        <textarea
          value={greeting}
          onChange={(e) => setGreeting(e.target.value.slice(0, 256))}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          placeholder="Welcome! We help you find your perfect property…"
        />
        <p className="text-xs text-gray-400 text-right">{greeting.length}/256</p>
      </section>

      {/* Support Hours */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Support Hours
        </h2>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
          {DAYS.map((day) => {
            const h = hours[day] ?? { open: "09:00", close: "18:00", closed: false };
            return (
              <div key={day} className="flex items-center gap-4 px-4 py-3">
                <span className="w-24 text-sm text-gray-700">{DAY_LABELS[day]}</span>
                {h.closed ? (
                  <span className="text-xs text-gray-400 flex-1">Closed</span>
                ) : (
                  <div className="flex items-center gap-2 flex-1 text-sm">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => setTime(day, "open", e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => setTime(day, "close", e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                )}
                <button
                  onClick={() => toggleDay(day)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {h.closed ? "Open" : "Close"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sync Status */}
      <section className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Meta Sync Status</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {data?.meta_profile_synced_at
              ? `Last synced: ${new Date(data.meta_profile_synced_at).toLocaleString()}`
              : "Not yet synced to Meta"}
          </p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {syncMutation.isPending ? "Queuing…" : "Push to Meta"}
        </button>
      </section>

      {syncMutation.isSuccess && (
        <p className="text-xs text-green-600">
          Sync queued — changes will appear on Meta within minutes.
        </p>
      )}
      {syncMutation.isError && (
        <p className="text-xs text-red-600">
          Sync failed. Check that access_token and phone_number_id are configured.
        </p>
      )}

      {/* Save */}
      <div className="flex justify-end gap-3">
        {saveMutation.isError && (
          <p className="text-xs text-red-600 self-center">Save failed.</p>
        )}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
