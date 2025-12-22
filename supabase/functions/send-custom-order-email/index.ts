import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  customOrderId: string;
  emailType: "payment_request" | "payment_confirmed" | "in_delivery" | "delivered" | "custom";
  customMessage?: string;
}

interface CustomOrder {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  preferred_size: string;
  usage_description: string;
  notes: string | null;
  shipping_address: string | null;
  status: string;
  admin_notes: string | null;
  estimated_price: number | null;
  estimated_delivery_date: string | null;
  emails_sent: Array<{ type: string; sent_at: string }> | null;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth token to verify admin
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      console.error("User is not admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { customOrderId, emailType, customMessage }: EmailRequest = await req.json();

    console.log("Sending custom order email:", { customOrderId, emailType });

    // Fetch the custom order
    const { data: order, error: orderError } = await supabase
      .from("custom_order_requests")
      .select("*")
      .eq("id", customOrderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(
        JSON.stringify({ error: "Custom order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const typedOrder = order as CustomOrder;

    // Generate email content based on type
    let subject = "";
    let heading = "";
    let content = "";
    let paymentLink = "";

    const baseUrl = "https://basho-by-shivangi.lovable.app";

    switch (emailType) {
      case "payment_request":
        if (!typedOrder.estimated_price) {
          return new Response(
            JSON.stringify({ error: "Estimated price is required for payment request" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        paymentLink = `${baseUrl}/custom-order-payment/${typedOrder.id}`;
        subject = "Payment Request for Your Custom Order - Basho By Shivangi";
        heading = "Your Custom Order is Ready for Payment";
        content = `
          <p>Great news! We've reviewed your custom pottery request and are excited to bring your vision to life.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Size: ${typedOrder.preferred_size}</li>
            <li>Estimated Price: ₹${typedOrder.estimated_price.toLocaleString()}</li>
            ${typedOrder.estimated_delivery_date ? `<li>Estimated Delivery: ${new Date(typedOrder.estimated_delivery_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</li>` : ""}
          </ul>
          <p>Please click the button below to complete your payment and confirm your order:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${paymentLink}" style="display: inline-block; background-color: #292524; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Pay ₹${typedOrder.estimated_price.toLocaleString()} Now
            </a>
          </div>
        `;
        break;

      case "payment_confirmed":
        subject = "Payment Confirmed - Your Custom Order is in Production! - Basho By Shivangi";
        heading = "Thank You! Your Payment is Confirmed";
        content = `
          <p>We've received your payment and our artisans have started working on your custom pottery piece!</p>
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our skilled craftspeople will carefully create your unique piece</li>
            <li>Each step - shaping, drying, firing, and glazing - is done with meticulous attention</li>
            <li>We'll notify you once your piece is ready for delivery</li>
          </ul>
          ${typedOrder.estimated_delivery_date ? `<p>Estimated delivery: <strong>${new Date(typedOrder.estimated_delivery_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</strong></p>` : ""}
        `;
        break;

      case "in_delivery":
        subject = "Your Custom Order is On Its Way! - Basho By Shivangi";
        heading = "Your Pottery is Out for Delivery!";
        content = `
          <p>Exciting news! Your custom pottery piece has been carefully packed and is now on its way to you.</p>
          <p><strong>Delivery Address:</strong></p>
          <p style="background-color: #f5f5f4; padding: 16px; border-radius: 8px;">
            ${typedOrder.shipping_address || "Address on file"}
          </p>
          <p>Please ensure someone is available to receive the package. Handle with care - it's handcrafted with love!</p>
        `;
        break;

      case "delivered":
        subject = "Your Custom Order Has Been Delivered! - Basho By Shivangi";
        heading = "Your Pottery Has Arrived!";
        content = `
          <p>We hope you're delighted with your custom pottery piece!</p>
          <p>Each piece from our studio is unique and crafted with care. We'd love to hear what you think!</p>
          <p><strong>Care Tips:</strong></p>
          <ul>
            <li>Hand wash with mild soap for best results</li>
            <li>Avoid sudden temperature changes</li>
            <li>Display with pride - it's one of a kind!</li>
          </ul>
          <p>Thank you for supporting handcrafted pottery. We hope to create more beautiful pieces for you in the future!</p>
        `;
        break;

      case "custom":
        if (!customMessage) {
          return new Response(
            JSON.stringify({ error: "Custom message is required" }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        subject = "Update on Your Custom Order - Basho By Shivangi";
        heading = "Message About Your Custom Order";
        content = `<p>${customMessage.replace(/\n/g, "<br>")}</p>`;
        break;
    }

    const year = new Date().getFullYear();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #faf9f7;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr><td style="background-color: #292524; padding: 32px; text-align: center;">
                <img src="https://grdolasawzsrwuqhpheu.supabase.co/storage/v1/object/public/email-assets/logo-email.png" alt="Basho Byy Shivangi" style="max-width: 120px; height: auto; margin-bottom: 16px;" />
                <h1 style="font-family: Georgia, serif; color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px;">Basho Byy Shivangi</h1>
                <p style="color: #a8a29e; margin: 8px 0 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Handcrafted Pottery</p>
              </td></tr>
              
              <!-- Content -->
              <tr><td style="padding: 40px 32px;">
                <h2 style="color: #292524; margin: 0 0 24px 0; font-size: 24px; font-weight: normal; font-family: Georgia, serif;">${heading}</h2>
                <p style="color: #78716c; margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">Hi ${typedOrder.name},</p>
                <div style="color: #57534e; font-size: 15px; line-height: 1.7;">
                  ${content}
                </div>
              </td></tr>
              
              <!-- Divider -->
              <tr><td style="padding: 0 32px;">
                <div style="height: 1px; background-color: #d6d3d1;"></div>
              </td></tr>
              
              <!-- Footer -->
              <tr><td style="padding: 32px; text-align: center;">
                <p style="color: #78716c; margin: 0 0 16px 0; font-size: 14px;">Made with love in our pottery studio</p>
                <div style="margin-bottom: 16px;">
                  <a href="https://instagram.com/bashobyyshivangi" target="_blank" style="display: inline-block; margin: 0 8px; color: #78716c; text-decoration: none; font-size: 14px;">Instagram</a>
                  <span style="color: #a8a29e;">|</span>
                  <a href="https://basho-by-shivangi.lovable.app" target="_blank" style="display: inline-block; margin: 0 8px; color: #78716c; text-decoration: none; font-size: 14px;">Website</a>
                  <span style="color: #a8a29e;">|</span>
                  <a href="mailto:hello@basho.in" style="display: inline-block; margin: 0 8px; color: #78716c; text-decoration: none; font-size: 14px;">Email Us</a>
                </div>
                <p style="color: #a8a29e; margin: 0; font-size: 12px;">© ${year} Basho Byy Shivangi. All rights reserved.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    // Send email via Gmail SMTP
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailAppPassword) {
      console.error("Gmail credentials not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD." }),
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
        from: `Basho By Shivangi <${gmailUser}>`,
        to: typedOrder.email,
        subject,
        html: emailHtml,
      });

      console.log("Custom order email sent successfully to:", typedOrder.email);
    } catch (smtpError) {
      console.error("SMTP error:", smtpError);
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${smtpError instanceof Error ? smtpError.message : "Unknown error"}` }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } finally {
      try {
        await client.close();
      } catch (closeError) {
        console.error("SMTP close error:", closeError);
      }
    }

    // Update the order status based on email type and track email sent
    let newStatus = typedOrder.status;
    switch (emailType) {
      case "payment_request":
        newStatus = "payment_pending";
        break;
      case "payment_confirmed":
        newStatus = "in_progress";
        break;
      case "in_delivery":
        newStatus = "in_delivery";
        break;
      case "delivered":
        newStatus = "delivered";
        break;
    }

    // Add email to the sent emails array
    const emailsSent = typedOrder.emails_sent || [];
    emailsSent.push({
      type: emailType,
      sent_at: new Date().toISOString(),
    });

    const { error: updateError } = await supabase
      .from("custom_order_requests")
      .update({ 
        status: newStatus,
        emails_sent: emailsSent,
      })
      .eq("id", customOrderId);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      // Email was sent successfully, so we don't fail the request
    } else {
      console.log("Order status updated to:", newStatus);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in send-custom-order-email function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
