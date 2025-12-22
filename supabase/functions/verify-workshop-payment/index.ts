import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
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
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      booking_id
    } = await req.json();

    console.log('Verifying workshop payment:', { razorpay_order_id, razorpay_payment_id, booking_id, userId: user.id });

    // Verify Razorpay signature
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      throw new Error('Razorpay secret not configured');
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature verification failed');
      return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Signature verified, updating booking');

    // Update booking with payment info - the trigger will update workshop slots
    const { data: booking, error: updateError } = await supabase
      .from('workshop_bookings')
      .update({
        payment_status: 'paid',
        booking_status: 'confirmed',
        razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .eq('razorpay_order_id', razorpay_order_id)
      .select(`
        *,
        workshops:workshop_id (
          title,
          location,
          maps_link,
          duration
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw updateError;
    }

    console.log('Booking updated successfully:', booking.id);

    // Create admin notification for new workshop booking
    try {
      const { error: notifError } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'workshop_booking',
          title: 'New Workshop Registration',
          message: `${booking.customer_name} registered for "${booking.workshops?.title}" on ${booking.booking_date} (${booking.guests} guest${booking.guests > 1 ? 's' : ''}) - ₹${booking.total_amount}`,
        });
      
      if (notifError) {
        console.error('Error creating admin notification:', notifError);
      } else {
        console.log('Admin notification created');
      }
    } catch (notifErr) {
      console.error('Error creating admin notification:', notifErr);
    }

    // Send confirmation email in background
    try {
      console.log('Sending confirmation email to:', user.email);
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-workshop-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: booking.customer_email,
          booking: {
            id: booking.id,
            workshop_title: booking.workshops?.title,
            booking_date: booking.booking_date,
            time_slot: booking.time_slot,
            guests: booking.guests,
            total_amount: booking.total_amount,
            location: booking.workshops?.location,
            maps_link: booking.workshops?.maps_link,
            customer_name: booking.customer_name
          }
        }),
      });
      
      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Failed to send confirmation email:', errorText);
      } else {
        console.log('Confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the payment verification if email fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      booking 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error verifying workshop payment:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
