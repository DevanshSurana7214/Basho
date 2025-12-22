import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Auth client for user verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      workshop_id, 
      booking_date, 
      time_slot, 
      guests, 
      total_amount,
      customer_name,
      customer_email,
      customer_phone 
    } = await req.json();

    console.log('Creating workshop booking:', { 
      workshop_id, 
      booking_date, 
      time_slot, 
      guests, 
      total_amount, 
      userId: user.id 
    });

    // Validate required fields
    if (!workshop_id || !booking_date || !time_slot || !guests || !total_amount || !customer_name || !customer_email || !customer_phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify workshop exists and check slot availability
    const { data: workshop, error: workshopError } = await supabase
      .from('workshops')
      .select('id, title, time_slots')
      .eq('id', workshop_id)
      .single();

    if (workshopError || !workshop) {
      console.error('Workshop not found:', workshopError);
      return new Response(JSON.stringify({ error: 'Workshop not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check slot availability
    const slots = workshop.time_slots as Array<{date: string; time: string; max_spots: number; booked: number}>;
    const targetSlot = slots?.find(s => s.date === booking_date && s.time === time_slot);
    
    if (!targetSlot) {
      return new Response(JSON.stringify({ error: 'Time slot not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const available = targetSlot.max_spots - targetSlot.booked;
    if (guests > available) {
      return new Response(JSON.stringify({ error: `Only ${available} spots available` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Razorpay order
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(total_amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `ws_${Date.now()}`,
        notes: {
          workshop_id,
          workshop_title: workshop.title,
          booking_date,
          time_slot,
          guests: guests.toString(),
          customer_name,
          customer_email
        }
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay error:', errorText);
      throw new Error('Failed to create Razorpay order');
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('Razorpay order created:', razorpayOrder.id);

    // Create booking record with pending payment
    const { data: booking, error: bookingError } = await supabase
      .from('workshop_bookings')
      .insert({
        user_id: user.id,
        workshop_id,
        booking_date,
        time_slot,
        guests,
        total_amount,
        customer_name,
        customer_email,
        customer_phone,
        payment_status: 'pending',
        booking_status: 'pending',
        razorpay_order_id: razorpayOrder.id
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw bookingError;
    }

    console.log('Booking created:', booking.id);

    return new Response(JSON.stringify({
      order_id: razorpayOrder.id,
      booking_id: booking.id,
      amount: total_amount,
      currency: 'INR',
      key_id: razorpayKeyId,
      workshop_title: workshop.title
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error creating workshop order:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
