import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkshopBooking {
  id: string;
  workshop_title: string;
  booking_date: string;
  time_slot: string;
  guests: number;
  total_amount: number;
  location?: string;
  maps_link?: string;
  customer_name: string;
}

interface EmailRequest {
  email: string;
  booking: WorkshopBooking;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, booking }: EmailRequest = await req.json();

    console.log('Sending workshop confirmation email to:', email);

    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const locationSection = booking.location ? `
                      <tr>
                        <td style="color: #78716c; padding: 8px;">Location</td>
                        <td style="color: #292524; font-weight: bold; padding: 8px;">
                          ${booking.location}
                          ${booking.maps_link ? `<br><a href="${booking.maps_link}" target="_blank" style="color: #a68b6a; text-decoration: underline; font-size: 13px;">View on Google Maps</a>` : ''}
                        </td>
                      </tr>` : '';

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Workshop Registration Confirmed</title>
</head>
<body style="font-family: Georgia, serif; background-color: #faf9f7; margin: 0; padding: 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<tr>
<td style="background-color: #292524; padding: 32px; text-align: center;">
<img src="https://grdolasawzsrwuqhpheu.supabase.co/storage/v1/object/public/email-assets/logo-email.png" alt="Basho Byy Shivangi" style="max-width: 120px; height: auto; margin-bottom: 16px;" />
<h1 style="font-family: Georgia, serif; color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">Basho Byy Shivangi</h1>
<p style="color: #a8a29e; margin: 8px 0 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Workshop Registration Confirmed</p>
</td>
</tr>
<tr>
<td style="padding: 32px;">
<h2 style="color: #292524; margin: 0 0 8px 0;">Welcome, ${booking.customer_name}!</h2>
<p style="color: #78716c; margin: 0 0 24px 0;">Thank you for registering for our pottery workshop. We are excited to have you join us!</p>
<h3 style="color: #292524; margin: 0 0 16px 0; border-bottom: 2px solid #a68b6a; padding-bottom: 8px;">Booking Details</h3>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; border-radius: 8px; margin-bottom: 24px;">
<tr>
<td style="padding: 16px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="color: #78716c; padding: 8px;">Workshop</td>
<td style="color: #292524; font-weight: bold; padding: 8px;">${booking.workshop_title}</td>
</tr>
<tr>
<td style="color: #78716c; padding: 8px;">Date</td>
<td style="color: #292524; font-weight: bold; padding: 8px;">${formattedDate}</td>
</tr>
<tr>
<td style="color: #78716c; padding: 8px;">Time</td>
<td style="color: #292524; font-weight: bold; padding: 8px;">${booking.time_slot}</td>
</tr>
${locationSection}
<tr>
<td style="color: #78716c; padding: 8px;">Guests</td>
<td style="color: #292524; font-weight: bold; padding: 8px;">${booking.guests} ${booking.guests === 1 ? 'person' : 'people'}</td>
</tr>
<tr>
<td style="color: #78716c; padding: 8px;">Amount Paid</td>
<td style="color: #a68b6a; font-weight: bold; font-size: 18px; padding: 8px;">Rs. ${booking.total_amount.toLocaleString('en-IN')}</td>
</tr>
<tr>
<td style="color: #78716c; padding: 8px;">Booking ID</td>
<td style="color: #292524; padding: 8px;">${booking.id.slice(0, 8).toUpperCase()}</td>
</tr>
</table>
</td>
</tr>
</table>
<h3 style="color: #292524; margin: 24px 0 12px 0;">What to Bring</h3>
<ul style="color: #57534e; padding-left: 20px; margin: 0;">
<li style="margin-bottom: 8px;">Comfortable clothes that can get a bit messy</li>
<li style="margin-bottom: 8px;">An apron (we will also have spares available)</li>
<li style="margin-bottom: 8px;">Your creativity and enthusiasm!</li>
</ul>
<h3 style="color: #292524; margin: 24px 0 12px 0;">Important Notes</h3>
<ul style="color: #57534e; padding-left: 20px; margin: 0;">
<li style="margin-bottom: 8px;">Please arrive 10-15 minutes before your scheduled time</li>
<li style="margin-bottom: 8px;">All materials and tools will be provided</li>
<li style="margin-bottom: 8px;">Your finished pieces will be fired and ready for pickup in 2-3 weeks</li>
</ul>
<p style="color: #57534e; margin-top: 24px;">If you have any questions or need to reschedule, please contact us at least 48 hours before your workshop.</p>
</td>
</tr>
<tr>
<td style="background-color: #292524; padding: 24px; text-align: center;">
<p style="color: #a8a29e; margin: 0 0 16px 0; font-size: 14px;">We look forward to creating something beautiful with you!</p>
<div style="margin-bottom: 16px;">
<a href="https://instagram.com/bashobyyshivangi" target="_blank" style="display: inline-block; margin: 0 8px; color: #a8a29e; text-decoration: none; font-size: 14px;">Instagram</a>
<span style="color: #78716c;">|</span>
<a href="https://basho-by-shivangi.lovable.app" target="_blank" style="display: inline-block; margin: 0 8px; color: #a8a29e; text-decoration: none; font-size: 14px;">Website</a>
<span style="color: #78716c;">|</span>
<a href="mailto:hello@basho.in" style="display: inline-block; margin: 0 8px; color: #a8a29e; text-decoration: none; font-size: 14px;">Email Us</a>
</div>
<p style="color: #78716c; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Basho Byy Shivangi. All rights reserved.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

    // Send email via Gmail SMTP
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailAppPassword) {
      console.error("Gmail credentials not configured");
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailUser,
          password: gmailAppPassword,
        },
      },
    });

    try {
      await client.send({
        from: `Basho Byy Shivangi <${gmailUser}>`,
        to: email,
        subject: `Workshop Registration Confirmed - ${booking.workshop_title}`,
        html: emailHtml,
      });

      console.log("Workshop confirmation email sent successfully to:", email);
    } finally {
      try {
        await client.close();
      } catch (closeError) {
        console.error("SMTP close error:", closeError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    console.error("Error sending workshop confirmation email:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
