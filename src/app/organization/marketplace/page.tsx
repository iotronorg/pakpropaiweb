'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth'
import { getMyOrganization } from '@/lib/api'
import {
  getSyndicationListings, syndicateListing, withdrawListing,
  getPartnerships, invitePartner, revokePartnership, acceptPartnership,
  getSubmissions, acceptSubmission, rejectSubmission,
  getLedger, verifyLedgerChain,
} from '@/lib/api'
import type {
  SyndicationListing, BrokerNetworkPartnership,
  SyndicationLeadSubmission, CommissionLedgerEntry,
} from '@/types'

const TABS = ['Syndicate Inventory', 'Partner Network', 'Inbound Submissions', 'Commission Ledger'] as const
type Tab = typeof TABS[number]

const statusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  syndicated: 'bg-green-100 text-green-700',
  withdrawn: 'bg-amber-100 text-amber-700',
  invited: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-amber-100 text-amber-700',
  revoked: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  converted: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  paid: 'bg-purple-100 text-purple-700',
  disputed: 'bg-red-100 text-red-700',
}

function Badge({ label }: { label: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[label] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  )
}

// ── Syndicate Inventory Tab ───────────────────────────────────────────────────

function SyndicateInventoryTab() {
  const qc = useQueryClient()
  const [publishId, setPublishId] = useState<string | null>(null)
  const [form, setForm] = useState({ commission_type: 'percentage', commission_value: '', commission_currency: 'USD', syndication_scope: 'platform_wide', description: '', expires_at: '' })

  const { data: listings = [] } = useQuery({ queryKey: ['syndication-listings'], queryFn: () => getSyndicationListings() })

  const syndicate = useMutation({
    mutationFn: (id: string) => syndicateListing(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['syndication-listings'] }); setPublishId(null) },
  })
  const withdraw = useMutation({
    mutationFn: (id: string) => withdrawListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['syndication-listings'] }),
  })

  return (
    <div className="space-y-4">
      <table className="w-full text-sm border rounded-lg overflow-hidden">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Property</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Commission</th>
            <th className="px-4 py-3 text-left">Scope</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {listings.map((l) => (
            <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <td className="px-4 py-3 font-medium">{l.property_title}</td>
              <td className="px-4 py-3"><Badge label={l.status} /></td>
              <td className="px-4 py-3">
                {l.commission_type === 'percentage' ? `${l.commission_value}%` : `${l.commission_currency} ${Number(l.commission_value).toLocaleString()}`}
              </td>
              <td className="px-4 py-3 capitalize">{l.syndication_scope.replace('_', ' ')}</td>
              <td className="px-4 py-3 text-right space-x-2">
                {l.status === 'draft' && (
                  <button onClick={() => setPublishId(l.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                    Publish to Network
                  </button>
                )}
                {l.status === 'syndicated' && (
                  <button onClick={() => withdraw.mutate(l.id)} className="text-xs bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600">
                    Withdraw
                  </button>
                )}
              </td>
            </motion.tr>
          ))}
          {listings.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No listings yet.</td></tr>
          )}
        </tbody>
      </table>

      <AnimatePresence>
        {publishId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold">Publish to Broker Network</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <select value={form.commission_type} onChange={e => setForm(f => ({ ...f, commission_type: e.target.value }))}
                    className="border rounded px-3 py-2 text-sm w-1/2">
                    <option value="percentage">Percentage %</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                  <input type="number" placeholder="Value" value={form.commission_value}
                    onChange={e => setForm(f => ({ ...f, commission_value: e.target.value }))}
                    className="border rounded px-3 py-2 text-sm w-1/2" />
                </div>
                <select value={form.syndication_scope} onChange={e => setForm(f => ({ ...f, syndication_scope: e.target.value }))}
                  className="border rounded px-3 py-2 text-sm w-full">
                  <option value="platform_wide">Platform-wide (all brokers)</option>
                  <option value="selected_partners">Selected Partners only</option>
                </select>
                <textarea placeholder="Description (optional)" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="border rounded px-3 py-2 text-sm w-full h-20 resize-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setPublishId(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
                <button onClick={() => syndicate.mutate(publishId!)}
                  className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700">
                  Syndicate
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Partner Network Tab ───────────────────────────────────────────────────────

function PartnerNetworkTab() {
  const qc = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({ broker_org: '', commission_override_type: '', commission_override_value: '', notes: '' })

  const { data: partners = [] } = useQuery({ queryKey: ['partnerships'], queryFn: () => getPartnerships() })

  const invite = useMutation({
    mutationFn: () => invitePartner({ broker_org: form.broker_org || undefined, commission_override_type: form.commission_override_type || undefined, commission_override_value: form.commission_override_value || undefined, notes: form.notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partnerships'] }); setShowInvite(false) },
  })
  const revoke = useMutation({
    mutationFn: (id: string) => revokePartnership(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partnerships'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowInvite(true)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          + Invite Partner
        </button>
      </div>
      <table className="w-full text-sm border rounded-lg overflow-hidden">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Partner</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Commission Override</th>
            <th className="px-4 py-3 text-left">Joined</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {partners.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-medium">{p.broker_org_name ?? p.broker_agent_name ?? '—'}</td>
              <td className="px-4 py-3"><Badge label={p.status} /></td>
              <td className="px-4 py-3 text-gray-600">
                {p.commission_override_value ? `${p.commission_override_value}${p.commission_override_type === 'percentage' ? '%' : ''}` : '—'}
              </td>
              <td className="px-4 py-3 text-gray-500">{p.activated_at ? new Date(p.activated_at).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3 text-right">
                {p.status === 'active' && (
                  <button onClick={() => revoke.mutate(p.id)} className="text-xs text-red-600 hover:underline">Revoke</button>
                )}
              </td>
            </tr>
          ))}
          {partners.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No partners yet.</td></tr>
          )}
        </tbody>
      </table>

      <AnimatePresence>
        {showInvite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold">Invite Partner</h3>
              <input placeholder="Partner Org ID (UUID)" value={form.broker_org}
                onChange={e => setForm(f => ({ ...f, broker_org: e.target.value }))}
                className="border rounded px-3 py-2 text-sm w-full" />
              <div className="flex gap-3">
                <select value={form.commission_override_type} onChange={e => setForm(f => ({ ...f, commission_override_type: e.target.value }))}
                  className="border rounded px-3 py-2 text-sm w-1/2">
                  <option value="">No Override</option>
                  <option value="percentage">Percentage %</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input type="number" placeholder="Override Value" value={form.commission_override_value}
                  onChange={e => setForm(f => ({ ...f, commission_override_value: e.target.value }))}
                  className="border rounded px-3 py-2 text-sm w-1/2" disabled={!form.commission_override_type} />
              </div>
              <textarea placeholder="Notes (optional)" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="border rounded px-3 py-2 text-sm w-full h-20 resize-none" />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowInvite(false)} className="text-sm text-gray-500 hover:underline">Cancel</button>
                <button onClick={() => invite.mutate()} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">Send Invitation</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Inbound Submissions Tab ───────────────────────────────────────────────────

function InboundSubmissionsTab() {
  const qc = useQueryClient()
  const { data: submissions = [] } = useQuery({ queryKey: ['submissions'], queryFn: () => getSubmissions() })

  const accept = useMutation({ mutationFn: (id: string) => acceptSubmission(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }) })
  const reject = useMutation({ mutationFn: (id: string) => rejectSubmission(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }) })

  return (
    <table className="w-full text-sm border rounded-lg overflow-hidden">
      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
        <tr>
          <th className="px-4 py-3 text-left">Lead</th>
          <th className="px-4 py-3 text-left">Listing</th>
          <th className="px-4 py-3 text-left">Submitted By</th>
          <th className="px-4 py-3 text-left">Commission</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody className="divide-y">
        {submissions.map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-3 font-medium">{s.lead_name}</td>
            <td className="px-4 py-3 text-gray-600">{s.listing_title}</td>
            <td className="px-4 py-3 text-gray-500">{s.submitted_by_org_name ?? '—'}</td>
            <td className="px-4 py-3">
              {s.commission_calculated ? `${s.commission_currency} ${Number(s.commission_calculated).toLocaleString()}` : '—'}
            </td>
            <td className="px-4 py-3">
              <motion.span animate={s.status === 'pending' ? { opacity: [1, 0.5, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Badge label={s.status} />
              </motion.span>
            </td>
            <td className="px-4 py-3 text-right space-x-2">
              {s.status === 'pending' && (
                <>
                  <button onClick={() => accept.mutate(s.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Accept</button>
                  <button onClick={() => reject.mutate(s.id)} className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Reject</button>
                </>
              )}
            </td>
          </tr>
        ))}
        {submissions.length === 0 && (
          <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No submissions yet.</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ── Commission Ledger Tab ─────────────────────────────────────────────────────

function CommissionLedgerTab() {
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; errors: string[] } | null>(null)
  const { data: entries = [] } = useQuery({ queryKey: ['ledger'], queryFn: () => getLedger() })
  const { data: org } = useQuery({ queryKey: ['my-org'], queryFn: () => getMyOrganization() })

  const handleVerify = async () => {
    const orgId = (org as any)?.id
    if (!orgId) return
    const result = await verifyLedgerChain(orgId)
    setVerifyResult(result)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center gap-3">
        <button onClick={handleVerify} className="bg-gray-800 text-white text-sm px-4 py-2 rounded hover:bg-gray-700">
          Verify Chain Integrity
        </button>
        {verifyResult && (
          <span className={`text-sm font-medium ${verifyResult.valid ? 'text-green-600' : 'text-red-600'}`}>
            {verifyResult.valid ? `✓ Chain intact (${entries.length} entries)` : `✗ ${verifyResult.errors.length} integrity error(s)`}
          </span>
        )}
      </div>
      <table className="w-full text-sm border rounded-lg overflow-hidden">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Entry ID</th>
            <th className="px-4 py-3 text-left">Broker</th>
            <th className="px-4 py-3 text-left">Commission</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((e) => (
            <tr key={e.entry_id}>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.entry_id.slice(0, 8)}…</td>
              <td className="px-4 py-3">{e.broker_org_name ?? '—'}</td>
              <td className="px-4 py-3 font-medium">{e.commission_currency} {Number(e.commission_amount).toLocaleString()}</td>
              <td className="px-4 py-3"><Badge label={e.status} /></td>
              <td className="px-4 py-3 text-gray-500">{new Date(e.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No ledger entries yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { user } = useAuthStore()
  const role = user?.role
  const [activeTab, setActiveTab] = useState<Tab>('Syndicate Inventory')

  if (role && role !== 'developer' && role !== 'admin') {
    return <div className="p-8 text-gray-500">Access restricted to developer organizations.</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Broker Marketplace</h1>

      {/* Tabs */}
      <div className="flex border-b space-x-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'Syndicate Inventory'   && <SyndicateInventoryTab />}
          {activeTab === 'Partner Network'       && <PartnerNetworkTab />}
          {activeTab === 'Inbound Submissions'   && <InboundSubmissionsTab />}
          {activeTab === 'Commission Ledger'     && <CommissionLedgerTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
