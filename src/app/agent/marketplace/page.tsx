'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { browseSyndicatedInventory, getSubmissions, createSubmission } from '@/lib/api'
import type { SyndicationListing } from '@/types'

function SubmitLeadModal({ listing, onClose }: { listing: SyndicationListing; onClose: () => void }) {
  const qc = useQueryClient()
  const [leadId, setLeadId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const submit = useMutation({
    mutationFn: () => createSubmission({ listing: listing.id, lead: leadId, notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agent-submissions'] }); onClose() },
    onError: (e: any) => setError(e?.response?.data?.detail ?? 'Submission failed.'),
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold">Submit Client Lead</h3>
        <p className="text-sm text-gray-500">
          {listing.property_title} —{' '}
          {listing.commission_type === 'percentage'
            ? `Earn ${listing.commission_value}%`
            : `Earn ${listing.commission_currency} ${Number(listing.commission_value).toLocaleString()}`}
        </p>
        <input placeholder="Lead ID (UUID)" value={leadId} onChange={e => setLeadId(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full" />
        <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full h-20 resize-none" />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-gray-500 hover:underline">Cancel</button>
          <button onClick={() => submit.mutate()} disabled={!leadId}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-40">
            Submit Lead
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function AgentMarketplacePage() {
  const [selected, setSelected] = useState<SyndicationListing | null>(null)
  const { data: listings = [], isLoading } = useQuery({ queryKey: ['browse-listings'], queryFn: browseSyndicatedInventory })
  const { data: mySubmissions = [] } = useQuery({ queryKey: ['agent-submissions'], queryFn: () => getSubmissions() })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Developer Marketplace</h1>
      <p className="text-sm text-gray-500">Browse syndicated properties and earn commission by submitting qualified leads.</p>

      {isLoading && <p className="text-gray-400 text-sm">Loading listings…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((l, i) => (
          <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{l.property_title}</h3>
              <span className="shrink-0 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                {l.developer_org_name}
              </span>
            </div>
            <p className="text-sm font-semibold text-green-600">
              {l.commission_type === 'percentage' ? `Earn ${l.commission_value}%` : `Earn ${l.commission_currency} ${Number(l.commission_value).toLocaleString()}`}
            </p>
            {l.description && <p className="text-xs text-gray-500 line-clamp-2">{l.description}</p>}
            {l.expires_at && (
              <p className="text-xs text-amber-600">Expires {new Date(l.expires_at).toLocaleDateString()}</p>
            )}
            <button onClick={() => setSelected(l)}
              className="w-full text-sm bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Submit Client Lead
            </button>
          </motion.div>
        ))}
        {!isLoading && listings.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">No syndicated listings available for your account.</p>
        )}
      </div>

      {mySubmissions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">My Submissions</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-start">Listing</th>
                  <th className="px-4 py-3 text-start">Lead</th>
                  <th className="px-4 py-3 text-start">Commission</th>
                  <th className="px-4 py-3 text-start">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mySubmissions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">{s.listing_title}</td>
                    <td className="px-4 py-3">{s.lead_name}</td>
                    <td className="px-4 py-3">
                      {s.commission_calculated ? `${s.commission_currency} ${Number(s.commission_calculated).toLocaleString()}` : 'Pending'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'accepted'  ? 'bg-green-100 text-green-700' :
                        s.status === 'rejected'  ? 'bg-red-100 text-red-700'    :
                        s.status === 'converted' ? 'bg-blue-100 text-blue-700'  :
                        'bg-amber-100 text-amber-700'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && <SubmitLeadModal listing={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
