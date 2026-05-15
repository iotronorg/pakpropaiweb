"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAgentProfile, updateAgentProfile } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

const inputCls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

interface OrgProfile {
  company_name?: string;
  office_address?: string;
  website?: string;
  ntn_number?: string;
}

function OrgProfilePanel() {
  const [companyName, setCompanyName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [ntnNumber, setNtnNumber] = useState("");
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-profile-dev"],
    queryFn: () => getAgentProfile().then((r) => r.data as OrgProfile),
  });

  useEffect(() => {
    if (data) {
      setCompanyName(data.company_name ?? "");
      setOfficeAddress(data.office_address ?? "");
      setWebsite(data.website ?? "");
      setNtnNumber(data.ntn_number ?? "");
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAgentProfile({
        ...(companyName ? { company_name: companyName } : {}),
        ...(officeAddress ? { office_address: officeAddress } : {}),
        ...(website ? { website } : {}),
        ...(ntnNumber ? { ntn_number: ntnNumber } : {}),
      }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-800">Organization Profile</h2>
        <p className="text-xs text-gray-500 mt-0.5">Company details shown to buyers and agents</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
          <input
            className={inputCls}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. ABC Real Estate"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">NTN Number</label>
          <input
            className={inputCls}
            value={ntnNumber}
            onChange={(e) => setNtnNumber(e.target.value)}
            placeholder="e.g. 1234567-8"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Office Address</label>
          <input
            className={inputCls}
            value={officeAddress}
            onChange={(e) => setOfficeAddress(e.target.value)}
            placeholder="e.g. Office 5, DHA Phase 6, Lahore"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Website</label>
          <input
            className={inputCls}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="e.g. https://abcrealestate.com"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving…" : "Save Profile"}
        </button>
        {saved && <span className="text-xs text-green-600 font-medium">Saved!</span>}
      </div>
    </div>
  );
}

export default function DeveloperSettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your organization profile and preferences</p>
      </div>
      <OrgProfilePanel />
      <NotificationPreferencesPanel />
    </div>
  );
}
