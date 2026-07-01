import { useAdminActivityLogs } from '@/features/admin/hooks/useAdmin'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatDateTime } from '@/shared/lib/utils'

export function AdminActivityPage() {
  const { data: logs, isLoading, error } = useAdminActivityLogs()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Activity log</h1>
      <p className="mt-1 text-slate-600">
        All platform actions — bookings, payments, status changes — for audit and tracking.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <QueryState loading={isLoading} error={error} empty={!logs?.length}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Summary</th>
                <th className="px-4 py-3 font-medium">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 capitalize">{log.actorRole ?? 'system'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3 max-w-md">{log.summary}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {log.entityType}
                    {log.entityId && (
                      <>
                        <br />
                        <span className="font-mono">{log.entityId.slice(0, 8)}…</span>
                      </>
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
