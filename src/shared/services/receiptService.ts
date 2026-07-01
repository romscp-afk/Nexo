import { supabase } from '@/shared/lib/supabase'
import type { AuthResult } from '@/shared/services/authService'
import { mapReceipt, type Receipt, type ReceiptRow } from '@/shared/types/receipt'

function isMissingReceiptsTable(message: string): boolean {
  return (
    message.includes("Could not find the table 'public.receipts'") ||
    message.includes('relation "public.receipts" does not exist') ||
    message.includes('PGRST205')
  )
}

export const receiptService = {
  async listForBooking(bookingId: string): Promise<AuthResult<Receipt[]>> {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingReceiptsTable(error.message)) {
        return {
          data: [],
          error: 'Receipts table missing. Run supabase/fix-receipts.sql in the Supabase SQL Editor.',
        }
      }
      return { data: [], error: error.message }
    }

    return { data: (data as ReceiptRow[]).map(mapReceipt), error: null }
  },
}
