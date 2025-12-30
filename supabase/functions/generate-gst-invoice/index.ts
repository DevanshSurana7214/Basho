import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to format currency without special characters
const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    
    if (!order_id) {
      throw new Error('Order ID is required');
    }

    console.log('Generating PDF invoice for order:', order_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Check if invoice already exists
    if (order.invoice_url && order.invoice_number) {
      console.log('Invoice already exists:', order.invoice_url);
      return new Response(
        JSON.stringify({ success: true, invoice_url: order.invoice_url, invoice_number: order.invoice_number }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasGstin = !!order.buyer_gstin;

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order_id);

    if (itemsError) {
      throw new Error('Failed to fetch order items');
    }

    // Fetch business settings
    const { data: businessSettings, error: settingsError } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError || !businessSettings) {
      throw new Error('Business settings not configured');
    }

    // Generate invoice number if not exists
    let invoiceNumber = order.invoice_number;
    if (!invoiceNumber) {
      const year = new Date().getFullYear();
      const count = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .not('invoice_number', 'is', null);
      
      invoiceNumber = `INV-${year}-${String((count.count || 0) + 1).padStart(4, '0')}`;
    }

    // Fetch logo from storage - try PNG first, then JPG
    let logoBytes: Uint8Array | null = null;
    let logoFormat: 'png' | 'jpg' | null = null;
    
    // Try PNG first
    try {
      const { data: logoData } = await supabase.storage
        .from('email-assets')
        .download('logo.png');
      
      if (logoData) {
        logoBytes = new Uint8Array(await logoData.arrayBuffer());
        logoFormat = 'png';
        console.log('PNG Logo loaded successfully');
      }
    } catch (pngError) {
      console.log('PNG logo not found, trying JPG...');
    }

    // Try JPG if PNG not found
    if (!logoBytes) {
      try {
        const { data: logoData } = await supabase.storage
          .from('email-assets')
          .download('logo.jpg');
        
        if (logoData) {
          logoBytes = new Uint8Array(await logoData.arrayBuffer());
          logoFormat = 'jpg';
          console.log('JPG Logo loaded successfully');
        }
      } catch (jpgError) {
        console.log('JPG logo not found either, continuing without logo');
      }
    }

    // Also try jpeg extension
    if (!logoBytes) {
      try {
        const { data: logoData } = await supabase.storage
          .from('email-assets')
          .download('logo.jpeg');
        
        if (logoData) {
          logoBytes = new Uint8Array(await logoData.arrayBuffer());
          logoFormat = 'jpg';
          console.log('JPEG Logo loaded successfully');
        }
      } catch (jpegError) {
        console.log('No logo found, continuing without logo');
      }
    }

    // Generate PDF invoice
    const pdfBytes = await generateInvoicePdf(order, orderItems || [], businessSettings, invoiceNumber, logoBytes, logoFormat, hasGstin);

    // Store invoice PDF
    const fileName = `${invoiceNumber}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload invoice');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    const invoiceUrl = urlData.publicUrl;

    // Update order with invoice details
    await supabase
      .from('orders')
      .update({
        invoice_number: invoiceNumber,
        invoice_url: invoiceUrl,
        invoice_generated_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    console.log('PDF Invoice generated successfully:', invoiceUrl);

    return new Response(
      JSON.stringify({ success: true, invoice_url: invoiceUrl, invoice_number: invoiceNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Invoice generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateInvoicePdf(
  order: any, 
  items: any[], 
  business: any, 
  invoiceNumber: string,
  logoBytes: Uint8Array | null,
  logoFormat: 'png' | 'jpg' | null,
  hasGstin: boolean
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  // Load fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primaryColor = rgb(0.545, 0.451, 0.333); // #8B7355
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const bgLight = rgb(0.98, 0.97, 0.96);

  let yPos = height - 50;

  // Draw logo if available
  if (logoBytes && logoFormat) {
    try {
      let logoImage;
      if (logoFormat === 'png') {
        logoImage = await pdfDoc.embedPng(logoBytes);
      } else {
        logoImage = await pdfDoc.embedJpg(logoBytes);
      }
      const logoDims = logoImage.scale(0.5);
      const logoWidth = Math.min(logoDims.width, 120);
      const logoHeight = (logoWidth / logoDims.width) * logoDims.height;
      page.drawImage(logoImage, {
        x: 50,
        y: yPos - logoHeight + 20,
        width: logoWidth,
        height: logoHeight,
      });
    } catch (e) {
      console.log('Could not embed logo:', e);
    }
  }

  // Header - Company Name
  page.drawText(business.trade_name || business.legal_name, {
    x: logoBytes ? 180 : 50,
    y: yPos,
    size: 20,
    font: helveticaBold,
    color: primaryColor,
  });

  yPos -= 18;

  // Company Address
  const companyAddress = `${business.address_line1}${business.address_line2 ? ', ' + business.address_line2 : ''}`;
  page.drawText(companyAddress, {
    x: logoBytes ? 180 : 50,
    y: yPos,
    size: 9,
    font: helvetica,
    color: lightGray,
  });

  yPos -= 12;
  page.drawText(`${business.city}, ${business.state} - ${business.pincode}`, {
    x: logoBytes ? 180 : 50,
    y: yPos,
    size: 9,
    font: helvetica,
    color: lightGray,
  });

  if (business.gstin) {
    yPos -= 12;
    page.drawText(`GSTIN: ${business.gstin}`, {
      x: logoBytes ? 180 : 50,
      y: yPos,
      size: 9,
      font: helveticaBold,
      color: textColor,
    });
  }

  // Invoice Title (right side) - TAX INVOICE only if has GSTIN
  const invoiceTitle = hasGstin ? 'TAX INVOICE' : 'INVOICE';
  page.drawText(invoiceTitle, {
    x: width - 150,
    y: height - 50,
    size: 18,
    font: helveticaBold,
    color: primaryColor,
  });

  page.drawText(`Invoice #: ${invoiceNumber}`, {
    x: width - 150,
    y: height - 70,
    size: 9,
    font: helvetica,
    color: textColor,
  });

  page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, {
    x: width - 150,
    y: height - 82,
    size: 9,
    font: helvetica,
    color: textColor,
  });

  page.drawText(`Order #: ${order.order_number}`, {
    x: width - 150,
    y: height - 94,
    size: 9,
    font: helvetica,
    color: textColor,
  });

  // Divider line
  yPos = height - 120;
  page.drawLine({
    start: { x: 50, y: yPos },
    end: { x: width - 50, y: yPos },
    thickness: 2,
    color: primaryColor,
  });

  yPos -= 30;

  // Bill To Section
  page.drawRectangle({
    x: 50,
    y: yPos - 80,
    width: 240,
    height: 90,
    color: bgLight,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });

  page.drawText('BILL TO', {
    x: 60,
    y: yPos,
    size: 8,
    font: helvetica,
    color: lightGray,
  });

  yPos -= 15;
  page.drawText(order.customer_name, {
    x: 60,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: textColor,
  });

  yPos -= 12;
  const addressLines = (order.shipping_address || 'Address not provided').split('\n');
  for (const line of addressLines.slice(0, 3)) {
    page.drawText(line.substring(0, 40), {
      x: 60,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textColor,
    });
    yPos -= 11;
  }

  page.drawText(order.customer_email || '', {
    x: 60,
    y: yPos,
    size: 9,
    font: helvetica,
    color: textColor,
  });

  yPos -= 11;
  if (order.buyer_gstin) {
    page.drawText(`GSTIN: ${order.buyer_gstin}`, {
      x: 60,
      y: yPos,
      size: 9,
      font: helveticaBold,
      color: textColor,
    });
  }

  // Place of Supply Section (only for GST invoices)
  const supplyBoxY = height - 150 - 30;
  
  if (hasGstin && order.buyer_state) {
    page.drawRectangle({
      x: 305,
      y: supplyBoxY - 80,
      width: 240,
      height: 90,
      color: bgLight,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });

    page.drawText('PLACE OF SUPPLY', {
      x: 315,
      y: supplyBoxY,
      size: 8,
      font: helvetica,
      color: lightGray,
    });

    page.drawText(`${order.buyer_state} (${order.buyer_state_code || ''})`, {
      x: 315,
      y: supplyBoxY - 15,
      size: 10,
      font: helveticaBold,
      color: textColor,
    });

    const taxType = (order.cgst_amount || 0) > 0 ? 'intra' : 'inter';
    page.drawText(taxType === 'intra' ? 'Intra-State Supply' : 'Inter-State Supply', {
      x: 315,
      y: supplyBoxY - 30,
      size: 9,
      font: helvetica,
      color: lightGray,
    });
  }

  // Items Table
  yPos = height - 280;

  // Table Header
  page.drawRectangle({
    x: 50,
    y: yPos - 5,
    width: width - 100,
    height: 22,
    color: primaryColor,
  });

  const tableHeaders = hasGstin ? ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'] : ['#', 'Description', 'Qty', 'Rate', 'Amount'];
  const colWidths = hasGstin ? [30, 200, 50, 40, 80, 80] : [30, 250, 40, 80, 80];
  let xPos = 55;

  for (let i = 0; i < tableHeaders.length; i++) {
    page.drawText(tableHeaders[i], {
      x: xPos,
      y: yPos,
      size: 9,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
    xPos += colWidths[i];
  }

  yPos -= 25;

  // Table Rows
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    xPos = 55;

    if (i % 2 === 1) {
      page.drawRectangle({
        x: 50,
        y: yPos - 5,
        width: width - 100,
        height: 20,
        color: bgLight,
      });
    }

    // Row number
    page.drawText(String(i + 1), { x: xPos, y: yPos, size: 9, font: helvetica, color: textColor });
    xPos += colWidths[0];

    // Item name (truncate if too long)
    const maxNameLength = hasGstin ? 35 : 45;
    const itemName = item.item_name.length > maxNameLength ? item.item_name.substring(0, maxNameLength) + '...' : item.item_name;
    page.drawText(itemName, { x: xPos, y: yPos, size: 9, font: helvetica, color: textColor });
    xPos += colWidths[1];

    // HSN (only for GST invoices)
    if (hasGstin) {
      page.drawText(item.item_type === 'product' ? '6912' : '9983', { x: xPos, y: yPos, size: 9, font: helvetica, color: textColor });
      xPos += colWidths[2];
    }

    // Quantity
    page.drawText(String(item.quantity), { x: xPos, y: yPos, size: 9, font: helvetica, color: textColor });
    xPos += hasGstin ? colWidths[3] : colWidths[2];

    // Unit Price
    page.drawText(formatCurrency(item.unit_price), { x: xPos, y: yPos, size: 9, font: helvetica, color: textColor });
    xPos += hasGstin ? colWidths[4] : colWidths[3];

    // Total Price
    page.drawText(formatCurrency(item.total_price), { x: xPos, y: yPos, size: 9, font: helveticaBold, color: textColor });

    yPos -= 20;

    // Add new page if needed
    if (yPos < 200) {
      break; // For simplicity, limit items to one page
    }
  }

  // Table bottom line
  page.drawLine({
    start: { x: 50, y: yPos + 5 },
    end: { x: width - 50, y: yPos + 5 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Summary Section (right aligned)
  yPos -= 20;
  const summaryX = width - 200;

  const drawSummaryRow = (label: string, value: string, bold = false) => {
    page.drawText(label, {
      x: summaryX,
      y: yPos,
      size: 9,
      font: bold ? helveticaBold : helvetica,
      color: textColor,
    });
    page.drawText(value, {
      x: width - 100,
      y: yPos,
      size: 9,
      font: bold ? helveticaBold : helvetica,
      color: textColor,
    });
    yPos -= 18;
  };

  // Show subtotal
  drawSummaryRow('Subtotal', formatCurrency(order.subtotal));

  // Show GST breakdown only if has GSTIN
  if (hasGstin) {
    drawSummaryRow('Taxable Amount', formatCurrency(order.taxable_amount || order.subtotal));
    
    const taxType = (order.cgst_amount || 0) > 0 ? 'intra' : 'inter';
    if (taxType === 'intra') {
      drawSummaryRow('CGST @ 9%', formatCurrency(order.cgst_amount || 0));
      drawSummaryRow('SGST @ 9%', formatCurrency(order.sgst_amount || 0));
    } else {
      drawSummaryRow('IGST @ 18%', formatCurrency(order.igst_amount || 0));
    }
  }

  if ((order.shipping_cost || 0) > 0) {
    drawSummaryRow('Shipping', formatCurrency(order.shipping_cost || 0));
  }

  // Total line
  page.drawLine({
    start: { x: summaryX - 10, y: yPos + 10 },
    end: { x: width - 50, y: yPos + 10 },
    thickness: 2,
    color: primaryColor,
  });

  yPos -= 5;
  page.drawText('TOTAL', {
    x: summaryX,
    y: yPos,
    size: 12,
    font: helveticaBold,
    color: primaryColor,
  });
  page.drawText(formatCurrency(order.total_amount), {
    x: width - 100,
    y: yPos,
    size: 12,
    font: helveticaBold,
    color: primaryColor,
  });

  yPos -= 40;

  // Bank Details (if configured)
  if (business.bank_name && business.bank_account_number) {
    page.drawRectangle({
      x: 50,
      y: yPos - 60,
      width: 250,
      height: 75,
      color: bgLight,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });

    page.drawText('BANK DETAILS', {
      x: 60,
      y: yPos,
      size: 8,
      font: helvetica,
      color: lightGray,
    });

    yPos -= 15;
    page.drawText(`Bank: ${business.bank_name}`, {
      x: 60,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textColor,
    });

    yPos -= 12;
    page.drawText(`Account: ${business.bank_account_number}`, {
      x: 60,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textColor,
    });

    yPos -= 12;
    page.drawText(`IFSC: ${business.bank_ifsc || 'N/A'}`, {
      x: 60,
      y: yPos,
      size: 9,
      font: helvetica,
      color: textColor,
    });

    if (business.bank_branch) {
      yPos -= 12;
      page.drawText(`Branch: ${business.bank_branch}`, {
        x: 60,
        y: yPos,
        size: 9,
        font: helvetica,
        color: textColor,
      });
    }
  }

  // Footer
  page.drawText('This is a computer generated invoice and does not require a signature.', {
    x: 50,
    y: 50,
    size: 8,
    font: helvetica,
    color: lightGray,
  });

  if (business.email || business.phone) {
    page.drawText(`Contact: ${business.email || ''} ${business.phone ? '| ' + business.phone : ''}`, {
      x: 50,
      y: 38,
      size: 8,
      font: helvetica,
      color: lightGray,
    });
  }

  return await pdfDoc.save();
}
