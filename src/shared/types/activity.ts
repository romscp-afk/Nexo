import type { UserRole } from '@/shared/lib/constants'

export type ActivityLogRow = {
  id: string
  actor_id: string | null
  actor_role: UserRole | null
  action: string
  entity_type: string
  entity_id: string | null
  summary: string
  details: Record<string, unknown>
  created_at: string
}

export type ActivityLog = {
  id: string
  actorId: string | null
  actorRole: UserRole | null
  action: string
  entityType: string
  entityId: string | null
  summary: string
  details: Record<string, unknown>
  createdAt: string
}

export function mapActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    details: row.details ?? {},
    createdAt: row.created_at,
  }
}
