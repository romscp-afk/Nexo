export type NotificationType = 'booking' | 'review' | 'system' | 'admin'

export type NotificationRow = {
  id: string
  user_id: string
  title: string
  body: string
  type: NotificationType
  read_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type Notification = {
  id: string
  userId: string
  title: string
  body: string
  type: NotificationType
  readAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    type: row.type,
    readAt: row.read_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  }
}
