"use client";

import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { User } from "@/types";

const ROLE_COLORS: Record<string, "blue" | "green" | "yellow" | "gray"> = {
  admin: "blue",
  agent: "green",
  developer: "yellow",
  user: "gray",
};

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getUsers().then((r) => r.data),
  });

  const users: User[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage system users and their roles</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-gray-700">{u.phone}</td>
                  <td className="px-6 py-3 text-gray-800">{u.name || "—"}</td>
                  <td className="px-6 py-3">
                    <Badge label={u.role} variant={ROLE_COLORS[u.role] ?? "gray"} />
                  </td>
                  <td className="px-6 py-3">
                    <Badge label={u.is_active ? "Active" : "Inactive"} variant={u.is_active ? "green" : "red"} />
                  </td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(u.date_joined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
