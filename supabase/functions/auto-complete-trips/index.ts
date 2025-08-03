import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting auto-complete trips process...')

    // Get current date
    const today = new Date().toISOString().split('T')[0]
    
    // Find trips that have ended but are not marked as completed
    const { data: expiredTrips, error: fetchError } = await supabase
      .from('trips')
      .select('id, title, end_date, status')
      .lt('end_date', today)
      .neq('status', 'completed')

    if (fetchError) {
      console.error('Error fetching expired trips:', fetchError)
      throw fetchError
    }

    console.log(`Found ${expiredTrips?.length || 0} expired trips to update`)

    if (expiredTrips && expiredTrips.length > 0) {
      // Update all expired trips to completed status
      const tripIds = expiredTrips.map(trip => trip.id)
      
      const { error: updateError } = await supabase
        .from('trips')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .in('id', tripIds)

      if (updateError) {
        console.error('Error updating trips:', updateError)
        throw updateError
      }

      console.log(`Successfully updated ${expiredTrips.length} trips to completed status`)
      
      // Log which trips were updated
      expiredTrips.forEach(trip => {
        console.log(`Updated trip: ${trip.title} (ID: ${trip.id}) - End date: ${trip.end_date}`)
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated ${expiredTrips?.length || 0} expired trips`,
        updatedTrips: expiredTrips?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Auto-complete trips error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})