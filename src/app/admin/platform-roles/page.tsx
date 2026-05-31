'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, updateAdminPlatformRole } from '@/lib/api';
import type { AdminUser } from '@/types';

const PLATFORM_ROLES: { value: AdminUser['platform_role']; label: string }[] = [
  { value: 'super_admin',      label: 'Super Admin' },
  { value: 'ops_admin',        label: 'Operations Admin' },
  { value: 'ai_admin',         label: 'AI Admin' },
  { value: 'compliance_admin', label: 'Compliance Admin' },
  { value: 'billing_admin',    label: 'Billing Admin' },
  { value: 'support_admin',    label: 'Support Admin' },
];

export default function PlatformRolesPage() {
  const qc = useQueryClient();
  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  });
  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminUser['platform_role'] }) =>
      updateAdminPlatformRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  if (isLoading) return <div className="p-8 text-[var(--text-muted)]">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Platform Role Management</h1>
      <div className="bg-[var(--bg-surface)] rounded-xl shadow-sm border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-muted)] border-b border-[var(--border)]">
            <tr>
              <th className="text-start px-4 py-3 font-medium text-[var(--text-muted)]">Admin User</th>
              <th className="text-start px-4 py-3 font-medium text-[var(--text-muted)]">Platform Role</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b last:border-0 hover:bg-[var(--bg-muted)]">
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text-primary)]">{admin.name || admin.phone}</p>
                  <p className="text-[var(--text-muted)]">{admin.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={admin.platform_role || ''}
                    onChange={(e) => {
                      const newRole = (e.target.value as AdminUser['platform_role']) || null;
                      const label = PLATFORM_ROLES.find(r => r.value === newRole)?.label ?? 'Unassigned';
                      if (!window.confirm(`Change ${admin.name || admin.phone}'s platform role to "${label}"?`)) return;
                      mutation.mutate({ id: admin.id, role: newRole });
                    }}
                    className="border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Unassigned —</option>
                    {PLATFORM_ROLES.map((r) => (
                      <option key={r.value} value={r.value ?? ''}>{r.label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
