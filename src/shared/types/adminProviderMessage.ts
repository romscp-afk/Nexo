export type AdminProviderMessageRow = {
  id: string
  provider_id: string
  sender_id: string
  body: string
  created_at: string
}

export type AdminProviderMessage = {
  id: string
  providerId: string
  senderId: string
  body: string
  createdAt: string
  senderName?: string
  isFromAdmin: boolean
}

export function mapAdminProviderMessage(
  row: AdminProviderMessageRow,
  meta?: { senderName?: string; isFromAdmin?: boolean },
): AdminProviderMessage {
  return {
    id: row.id,
    providerId: row.provider_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    senderName: meta?.senderName,
    isFromAdmin: meta?.isFromAdmin ?? false,
  }
}
