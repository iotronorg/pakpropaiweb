'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConnections,
  updateConnection,
  testConnection,
  triggerSync,
  getSyncLogs,
  getConflicts,
  resolveConflict,
} from '@/lib/api';
import type { ExternalPlatformConnection, WebhookDeliveryRecord, SyncConflictAlert } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  idle:      'bg-[var(--bg-subtle)] text-[var(--text-muted)]',
  syncing:   'bg-blue-100 text-blue-700',
  error:     'bg-red-100 text-red-700',
  paused:    'bg-amber-100 text-amber-700',
  pending:   'bg-[var(--bg-subtle)] text-[var(--text-muted)]',
  delivered: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
};

const _MASK = '••••••';

export default function ConnectionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const { data: connections = [] } = useQuery({
    queryKey: ['inventory-connections'],
    queryFn: getConnections,
  });
  const conn = connections.find(c => c.id === id);

  const [form, setForm] = useState<Partial<ExternalPlatformConnection>>({});
  const [mappingRows, setMappingRows] = useState<[string, string][]>([]);
  const [showJsonView, setShowJsonView] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; detail: string } | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Initialise form from connection
  const effectiveForm = { ...conn, ...form };

  const { data: logs = [] } = useQuery<WebhookDeliveryRecord[]>({
    queryKey: ['sync-logs', id],
    queryFn: () => getSyncLogs(id),
    enabled: !!id,
  });

  const { data: conflicts = [] } = useQuery<SyncConflictAlert[]>({
    queryKey: ['sync-conflicts'],
    queryFn: getConflicts,
  });
  const connConflicts = conflicts.filter(c => c.connection === id);

  const saveMutation = useMutation({
    mutationFn: () => updateConnection(id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-connections'] });
      setForm({});
    },
  });

  const testMutation = useMutation({
    mutationFn: () => testConnection(id),
    onSuccess: (data) => setTestResult(data),
  });

  const syncMutation = useMutation({
    mutationFn: () => triggerSync(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-connections'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ alertId, resolution }: { alertId: string; resolution: 'internal_wins' | 'external_wins' | 'manual' }) =>
      resolveConflict(alertId, resolution),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sync-conflicts'] }),
  });

  const fieldMappingJson = showJsonView
    ? JSON.stringify(
        Object.fromEntries(mappingRows),
        null, 2,
      )
    : '';

  if (!conn) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" aria-label="Loading connection" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] capitalize">{conn.platform} Integration</h1>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[conn.sync_status]}`}>
            {conn.sync_status}
          </span>
        </div>
        <button
          type="button"
          onClick={() => syncMutation.mutate()}
          disabled={conn.sync_status === 'syncing'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          Sync Now
        </button>
      </div>

      {/* Config Panel */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="detail-api-key" className="block text-sm font-medium text-[var(--text-muted)] mb-1">API Key</label>
            <input
              id="detail-api-key"
              type="text"
              defaultValue={conn.api_key || ''}
              placeholder={_MASK}
              onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
              className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="detail-api-secret" className="block text-sm font-medium text-[var(--text-muted)] mb-1">API Secret</label>
            <input
              id="detail-api-secret"
              type="password"
              defaultValue=""
              placeholder={_MASK}
              onChange={e => setForm(f => ({ ...f, api_secret: e.target.value }))}
              className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="detail-sync-dir" className="block text-sm font-medium text-[var(--text-muted)] mb-1">Sync Direction</label>
            <select
              id="detail-sync-dir"
              value={effectiveForm.sync_direction ?? conn.sync_direction}
              onChange={e => setForm(f => ({ ...f, sync_direction: e.target.value as 'inbound' | 'outbound' | 'bidirectional' }))}
              className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="inbound">Inbound Only</option>
              <option value="outbound">Outbound Only</option>
              <option value="bidirectional">Bidirectional</option>
            </select>
          </div>
          <div>
            <label htmlFor="detail-conflict" className="block text-sm font-medium text-[var(--text-muted)] mb-1">Conflict Resolution</label>
            <select
              id="detail-conflict"
              value={effectiveForm.conflict_resolution ?? conn.conflict_resolution}
              onChange={e => setForm(f => ({ ...f, conflict_resolution: e.target.value as 'internal_wins' | 'external_wins' | 'manual' }))}
              className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="internal_wins">Internal Wins</option>
              <option value="external_wins">External Wins</option>
              <option value="manual">Manual Review</option>
            </select>
          </div>
        </div>
        {testResult && (
          <div role="status" className={`mt-3 text-sm px-3 py-2 rounded-lg flex items-center gap-2 ${testResult.status === 'connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {testResult.status === 'connected'
              ? <CheckCircle2 size={14} aria-hidden="true" />
              : <AlertCircle size={14} aria-hidden="true" />}
            {testResult.detail}
          </div>
        )}
        {saveMutation.isError && (
          <p role="alert" className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">Failed to save. Please try again.</p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || Object.keys(form).length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="border border-[var(--border-strong)] px-4 py-2 rounded-lg text-sm hover:bg-[var(--bg-muted)] disabled:opacity-50 flex items-center gap-1.5"
          >
            {testMutation.isPending && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}{testMutation.isPending ? 'Testing…' : 'Test Connection'}
          </button>
        </div>
      </section>

      {/* Field Mapping Editor */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Field Mappings</h2>
          <button
            type="button"
            onClick={() => setShowJsonView(v => !v)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showJsonView ? 'Table View' : 'JSON View'}
          </button>
        </div>
        {showJsonView ? (
          <pre className="bg-[var(--bg-muted)] rounded-lg p-4 text-xs font-mono overflow-auto max-h-60">
            {fieldMappingJson}
          </pre>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-[var(--text-muted)] border-b">
                <th className="pb-2 font-medium">RealTron Field</th>
                <th className="pb-2 font-medium">External Field Name</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {mappingRows.map(([internal, external], i) => (
                <tr key={i} className="border-b border-[var(--border)]">
                  <td className="py-2 pe-3">
                    <input
                      value={internal}
                      onChange={e => {
                        const rows = [...mappingRows];
                        rows[i] = [e.target.value, external];
                        setMappingRows(rows);
                      }}
                      className="border border-[var(--border-strong)] rounded px-2 py-1 w-full text-sm"
                    />
                  </td>
                  <td className="py-2 pe-3">
                    <input
                      value={external}
                      onChange={e => {
                        const rows = [...mappingRows];
                        rows[i] = [internal, e.target.value];
                        setMappingRows(rows);
                      }}
                      className="border border-[var(--border-strong)] rounded px-2 py-1 w-full text-sm"
                    />
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => setMappingRows(rows => rows.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!showJsonView && (
          <button
            onClick={() => setMappingRows(rows => [...rows, ['', '']])}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            + Add row
          </button>
        )}
        <button
          onClick={() => saveMutation.mutate()}
          className="mt-3 ms-4 bg-[var(--bg-subtle)] text-[var(--text-muted)] px-3 py-1.5 rounded-lg text-sm hover:bg-[var(--bg-muted)]"
        >
          Save Mappings
        </button>
      </section>

      {/* Sync Log */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Sync Log <span className="text-[var(--text-muted)] font-normal text-sm">(last 100)</span></h2>
        {logs.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No delivery records yet.</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="border border-[var(--border)] rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[log.status]}`}>
                      {log.status}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">{log.event_type || 'property.update'}</span>
                    <span className="text-xs text-[var(--text-muted)]">attempt {log.attempt_count}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDate(log.delivered_at ?? log.created_at)}
                    </span>
                    {log.error_detail && (
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        {expandedLog === log.id ? 'Hide' : 'Error'}
                      </button>
                    )}
                  </div>
                </div>
                {expandedLog === log.id && log.error_detail && (
                  <p className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">{log.error_detail}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Conflict Alerts */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Conflict Alerts</h2>
        {connConflicts.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No conflicts.</p>
        ) : (
          <div className="space-y-3">
            {connConflicts.map(alert => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 ${alert.resolution === 'pending' ? 'border-amber-300 bg-amber-50' : 'border-[var(--border)]'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    alert.resolution === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'
                  }`}>
                    {alert.resolution}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{formatDate(alert.created_at)}</span>
                </div>
                <details className="mt-2">
                  <summary className="text-sm text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">External delta</summary>
                  <pre className="mt-1 text-xs bg-[var(--bg-surface)] rounded p-2 overflow-auto max-h-40">
                    {JSON.stringify(alert.external_delta, null, 2)}
                  </pre>
                </details>
                <details className="mt-2">
                  <summary className="text-sm text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]">Internal state</summary>
                  <pre className="mt-1 text-xs bg-[var(--bg-surface)] rounded p-2 overflow-auto max-h-40">
                    {JSON.stringify(alert.internal_state, null, 2)}
                  </pre>
                </details>
                {alert.resolution === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    {(['internal_wins', 'external_wins', 'manual'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => resolveMutation.mutate({ alertId: alert.id, resolution: r })}
                        disabled={resolveMutation.isPending}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-strong)] hover:bg-[var(--bg-muted)] disabled:opacity-50 capitalize"
                      >
                        {r.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
