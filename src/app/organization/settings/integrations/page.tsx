'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getConnections,
  createConnection,
  triggerSync,
  deleteConnection,
} from '@/lib/api';
import type { ExternalPlatformConnection, InventoryPlatform } from '@/types';
import Link from 'next/link';

const PLATFORM_LABELS: Record<InventoryPlatform, string> = {
  zameen:         'Zameen',
  propertyfinder: 'PropertyFinder',
  bayut:          'Bayut',
  rightmove:      'Rightmove',
  zillow:         'Zillow',
  custom:         'Custom REST',
};

const STATUS_COLORS: Record<string, string> = {
  idle:    'bg-gray-100 text-gray-600',
  syncing: 'bg-blue-100 text-blue-700',
  error:   'bg-red-100 text-red-700',
  paused:  'bg-amber-100 text-amber-700',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.idle}`}>
      {status === 'syncing' && (
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {status}
    </span>
  );
}

const EMPTY_FORM = {
  platform:            'zameen' as InventoryPlatform,
  api_key:             '',
  api_secret:          '',
  base_url:            '',
  sync_direction:      'inbound' as const,
  conflict_resolution: 'internal_wins' as const,
};

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['inventory-connections'],
    queryFn: getConnections,
  });

  const createMutation = useMutation({
    mutationFn: createConnection,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-connections'] });
      setShowModal(false);
      setForm(EMPTY_FORM);
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => triggerSync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-connections'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConnection(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-connections'] }),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-500 mt-1 text-sm">Connect external real estate platforms for inventory sync.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          + Add Integration
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔗</div>
          <p className="font-medium">No integrations yet</p>
          <p className="text-sm mt-1">Add a platform connection to start syncing inventory.</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {connections.map((conn) => (
            <motion.div
              key={conn.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900">{PLATFORM_LABELS[conn.platform as InventoryPlatform] ?? conn.platform}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={conn.sync_status} />
                    {!conn.is_active && (
                      <span className="text-xs text-gray-400">inactive</span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/organization/settings/integrations/${conn.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Manage
                </Link>
              </div>
              {conn.last_synced_at && (
                <p className="text-xs text-gray-400">
                  Last synced: {new Date(conn.last_synced_at).toLocaleString()}
                </p>
              )}
              {conn.error_detail && (
                <p className="text-xs text-red-500 truncate">{conn.error_detail}</p>
              )}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => syncMutation.mutate(conn.id)}
                  disabled={conn.sync_status === 'syncing'}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  Sync Now
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this integration?')) deleteMutation.mutate(conn.id);
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-lg font-bold mb-4">Add Integration</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PLATFORM_LABELS) as InventoryPlatform[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setForm(f => ({ ...f, platform: p }))}
                        className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                          form.platform === p
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {PLATFORM_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="text"
                    value={form.api_key}
                    onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter API key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                  <input
                    type="password"
                    value={form.api_secret}
                    onChange={e => setForm(f => ({ ...f, api_secret: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter API secret"
                  />
                </div>
                {form.platform === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                    <input
                      type="url"
                      value={form.base_url}
                      onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="https://api.yourplatform.com"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sync Direction</label>
                  <select
                    value={form.sync_direction}
                    onChange={e => setForm(f => ({ ...f, sync_direction: e.target.value as typeof form.sync_direction }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="inbound">Inbound Only</option>
                    <option value="outbound">Outbound Only</option>
                    <option value="bidirectional">Bidirectional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conflict Resolution</label>
                  <select
                    value={form.conflict_resolution}
                    onChange={e => setForm(f => ({ ...f, conflict_resolution: e.target.value as typeof form.conflict_resolution }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="internal_wins">Internal Wins (default)</option>
                    <option value="external_wins">External Wins</option>
                    <option value="manual">Manual Review</option>
                  </select>
                </div>
              </div>
              {createMutation.isError && (
                <p className="text-red-500 text-sm mt-3">{(createMutation.error as Error)?.message}</p>
              )}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate(form)}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Adding…' : 'Add Integration'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
