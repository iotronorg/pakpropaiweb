"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrgTheme, updateOrgTheme } from "@/lib/api";
import type { OrgTheme } from "@/types";

const DEFAULT_THEME: OrgTheme = {
  primary_color:   '#2563EB',
  secondary_color: '#4F46E5',
  accent_color:    '#0891B2',
  logo_url:        '',
  updated_at:      null,
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 w-32">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-16 cursor-pointer rounded border border-gray-200 p-0.5"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={7}
        placeholder="#000000"
        className="w-28 rounded border border-gray-200 px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span
        className="h-6 w-6 rounded-full border border-gray-200"
        style={{ background: value }}
      />
    </div>
  )
}

export function ThemeCustomizationCard() {
  const qc = useQueryClient()

  const { data: saved, isLoading } = useQuery({
    queryKey: ['org-theme'],
    queryFn:  getOrgTheme,
  })

  const [form, setForm] = useState<OrgTheme>(DEFAULT_THEME)
  const [initialised, setInitialised] = useState(false)

  if (saved && !initialised) {
    setForm({ ...DEFAULT_THEME, ...saved })
    setInitialised(true)
  }

  const mutation = useMutation({
    mutationFn: updateOrgTheme,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['org-theme'] }),
  })

  const set = (field: keyof OrgTheme) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="h-5 w-40 rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-64 rounded bg-gray-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Brand Customization</h3>
        <p className="mt-1 text-sm text-gray-500">
          Set your organization&apos;s color palette and logo. Changes apply to all white-label portals.
        </p>
      </div>

      <div className="space-y-4">
        <ColorField label="Primary"   value={form.primary_color}   onChange={set('primary_color')}   />
        <ColorField label="Secondary" value={form.secondary_color} onChange={set('secondary_color')} />
        <ColorField label="Accent"    value={form.accent_color}    onChange={set('accent_color')}    />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Logo URL</label>
        <input
          type="url"
          value={form.logo_url}
          onChange={(e) => set('logo_url')(e.target.value)}
          placeholder="https://cdn.example.com/logo.png"
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {form.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.logo_url}
            alt="Logo preview"
            className="mt-2 h-10 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Save Theme'}
        </button>
        {mutation.isSuccess && (
          <span className="text-sm text-green-600">Saved. Reload to see changes.</span>
        )}
        {mutation.isError && (
          <span className="text-sm text-red-600">Save failed. Check the values.</span>
        )}
      </div>
    </div>
  )
}
