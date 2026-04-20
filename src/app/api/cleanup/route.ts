import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const now = new Date().toISOString()

    // Delete expired polls
    const { error: pollsError } = await supabase
      .from('polls')
      .delete()
      .lt('expires_at', now)

    if (pollsError) {
      console.error('Error deleting expired polls:', pollsError)
    }

    // Delete expired tournaments (only if not finished)
    const { error: tournamentsError } = await supabase
      .from('tournaments')
      .delete()
      .lt('expires_at', now)
      .neq('status', 'finished')

    if (tournamentsError) {
      console.error('Error deleting expired tournaments:', tournamentsError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in cleanup:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
