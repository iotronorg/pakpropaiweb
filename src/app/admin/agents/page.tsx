"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";

interface AgentRow {
  id: number;
  name: string;
  phone: string;
  cities: string[];
  specializations: string[];
  is_verified: boolean;
  is_active: boolean;
}

// Placeholder data — populated from Django admin in real usage
const PLACEHOLDER: AgentRow[] = [
  { id: 1, name: "Ahmed Raza", phone: "+923001234567", cities: ["Lahore", "DHA Lahore"], specializations: ["Residential", "Plots"], is_verified: true, is_active: true },
  { id: 2, name: "Fatima Khan", phone: "+923009876543", cities: ["Karachi", "DHA Karachi"], specializations: ["Commercial"], is_verified: false, is_active: true },
];

export default function AgentsPage() {
  const [agents] = useState<AgentRow[]>(PLACEHOLDER);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="mt-1 text-sm text-gray-500">Verified agents in the system</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-5 py-3">
        <p className="text-sm text-blue-700">
          Add and manage agents via the Django admin at <code className="rounded bg-blue-100 px-1">/admin → Agents → Add Agent</code>.
          Fill in identity, coverage cities, specializations, then tick <strong>is_verified</strong> + <strong>is_active</strong>.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Cities</th>
              <th className="px-6 py-3">Specializations</th>
              <th className="px-6 py-3">Verified</th>
              <th className="px-6 py-3">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {agents.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{a.name}</td>
                <td className="px-6 py-3 font-mono text-gray-600">{a.phone}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.cities.map((c) => <Badge key={c} label={c} variant="blue" />)}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-1">
                    {a.specializations.map((s) => <Badge key={s} label={s} />)}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <Badge label={a.is_verified ? "Yes" : "No"} variant={a.is_verified ? "green" : "red"} />
                </td>
                <td className="px-6 py-3">
                  <Badge label={a.is_active ? "Active" : "Inactive"} variant={a.is_active ? "green" : "gray"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
