import { useState } from 'react'
import { useAdminUsers, useSetUserActive } from '@/features/admin/hooks/useAdmin'
import { QueryState } from '@/features/catalog/components/CatalogUi'

export function AdminUsersPage() {
  const { data: users, isLoading, error } = useAdminUsers()
  const setActive = useSetUserActive()
  const [actionError, setActionError] = useState('')

  const toggleActive = async (userId: string, isActive: boolean) => {
    setActionError('')
    try {
      await setActive.mutateAsync({ userId, isActive: !isActive })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      <p className="mt-1 text-slate-600">Manage platform accounts and access.</p>

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <QueryState loading={isLoading} error={error} empty={!users?.length}>
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">{user.fullName}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.isActive ? 'text-green-700' : 'text-slate-400 line-through'
                      }
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => toggleActive(user.userId, user.isActive)}
                        disabled={setActive.isPending}
                        className="text-teal-700 hover:underline disabled:opacity-50"
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </QueryState>
      </div>
    </div>
  )
}
