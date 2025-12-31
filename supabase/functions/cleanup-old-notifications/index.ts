import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    console.log('🗑️ Cleaning notifications older than:', thirtyDaysAgo.toISOString())

    // Delete old notifications
    const { data, error, count } = await supabaseAdmin
      .from('notifications')
      .delete({ count: 'exact' })
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (error) {
      console.error('Error deleting old notifications:', error)
      throw error
    }

    console.log(`✅ Deleted ${count || 0} old notifications`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned up ${count || 0} notifications older than 30 days`,
        deletedCount: count,
        cutoffDate: thirtyDaysAgo.toISOString(),
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Cleanup function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})