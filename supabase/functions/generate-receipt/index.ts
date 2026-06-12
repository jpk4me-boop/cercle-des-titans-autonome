import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS configuration. Set ALLOWED_ORIGINS="https://votredomaine.com,http://localhost:8080" in Supabase secrets.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://cercledstitans.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

const getAllowedOrigins = () => {
  const configured = Deno.env.get("ALLOWED_ORIGINS");
  return configured
    ? configured.split(",").map((origin) => origin.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS;
};

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

interface ReceiptRequest {
  transactionId: string;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Douala'
  });
};

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

const generatePDFContent = async (transaction: any, qrCodeDataUrl: string): Promise<Uint8Array> => {
  const ref = transaction.reference;
  const fullName = transaction.full_name;
  const phone = transaction.phone;
  const category = transaction.category;
  const amount = formatAmount(transaction.amount);
  const paymentMethod = transaction.payment_method;
  const date = formatDate(new Date(transaction.created_at));
  const status = transaction.status === 'confirmed' ? 'Confirmé' : 'En attente';
  const statusNote = transaction.status !== 'confirmed' ? ' (Reçu provisoire)' : '';
  const beneficiary = paymentMethod === 'MTN MoMo' ? '+237 672 482 763' : '+237 691 849 494';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; background: #fff; color: #1a1a2e; }
    .header { text-align: center; border-bottom: 3px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #d4af37; margin-bottom: 10px; }
    .title { font-size: 18px; color: #1a1a2e; text-transform: uppercase; letter-spacing: 2px; }
    .reference { background: #f8f9fa; padding: 10px 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .reference span { font-weight: bold; color: #d4af37; font-size: 16px; }
    .section { margin: 25px 0; }
    .section-title { font-size: 14px; color: #666; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #eee; }
    .label { color: #666; }
    .value { font-weight: 600; color: #1a1a2e; }
    .amount { font-size: 24px; color: #d4af37; font-weight: bold; text-align: center; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%); color: #d4af37; border-radius: 10px; margin: 20px 0; }
    .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status.confirmed { background: #d4edda; color: #155724; }
    .status.pending { background: #fff3cd; color: #856404; }
    .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; }
    .qr-code { width: 120px; height: 120px; margin: 10px auto; }
    .qr-text { font-size: 11px; color: #666; margin-top: 10px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; }
    .legal { font-size: 10px; color: #999; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🏛️ Cercle des Titans</div>
    <div class="title">Reçu de Cotisation – Tontine</div>
  </div>
  
  <div class="reference">
    Référence: <span>${ref}</span>
  </div>
  
  <div class="section">
    <div class="section-title">Informations du Membre</div>
    <div class="row">
      <span class="label">Nom complet</span>
      <span class="value">${fullName}</span>
    </div>
    <div class="row">
      <span class="label">Téléphone</span>
      <span class="value">${phone}</span>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Détails de la Transaction</div>
    <div class="row">
      <span class="label">Catégorie</span>
      <span class="value">${category}</span>
    </div>
    <div class="row">
      <span class="label">Moyen de paiement</span>
      <span class="value">${paymentMethod}</span>
    </div>
    <div class="row">
      <span class="label">Compte bénéficiaire</span>
      <span class="value">${beneficiary}</span>
    </div>
    <div class="row">
      <span class="label">Date & Heure</span>
      <span class="value">${date}</span>
    </div>
    <div class="row">
      <span class="label">Statut</span>
      <span class="value"><span class="status ${transaction.status}">${status}${statusNote}</span></span>
    </div>
    ${transaction.transaction_id ? `
    <div class="row">
      <span class="label">ID Transaction</span>
      <span class="value">${transaction.transaction_id}</span>
    </div>
    ` : ''}
  </div>
  
  <div class="amount">
    ${amount}
  </div>
  
  <div class="qr-section">
    <img src="${qrCodeDataUrl}" class="qr-code" alt="QR Code de vérification" />
    <div class="qr-text">Scannez pour vérifier l'authenticité de ce reçu</div>
  </div>
  
  <div class="footer">
    <div class="legal">Ce reçu atteste une cotisation à la tontine Cercle des Titans. Conservez-le précieusement.</div>
  </div>
</body>
</html>
  `;

  return new TextEncoder().encode(htmlContent);
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { transactionId }: ReceiptRequest = await req.json();

    // Input validation
    if (!transactionId || typeof transactionId !== "string" || transactionId.length < 10) {
      console.error("Invalid transaction ID provided");
      return new Response(
        JSON.stringify({ error: "ID de transaction invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating receipt for transaction:", transactionId);

    // Fetch transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      console.error("Transaction not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Transaction non trouvée" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security check: Only allow receipt generation for transactions created within last 10 minutes
    // This prevents abuse while allowing legitimate receipt generation after payment
    const transactionAge = Date.now() - new Date(transaction.created_at).getTime();
    const TEN_MINUTES = 10 * 60 * 1000;
    
    // If transaction already has a receipt, allow regeneration only if recent
    if (transaction.receipt_url && transactionAge > TEN_MINUTES) {
      console.log("Receipt already exists for older transaction, returning existing URL");
      return new Response(
        JSON.stringify({ 
          success: true, 
          receiptUrl: transaction.receipt_url,
          reference: transaction.reference 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For new receipts, only allow for recent transactions
    if (!transaction.receipt_url && transactionAge > TEN_MINUTES) {
      console.error("Attempted receipt generation for old transaction without existing receipt");
      return new Response(
        JSON.stringify({ error: "Génération de reçu non autorisée pour cette transaction" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate QR code URL (verification link)
    const siteUrl = (Deno.env.get("SITE_URL") || "https://cercledstitans.com").replace(/\/$/, "");
    const verificationUrl = `${siteUrl}/verify-receipt?ref=${transaction.reference}`;
    
    // Simple QR code using a public API
    const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verificationUrl)}`;

    // Generate PDF content as HTML
    const pdfContent = await generatePDFContent(transaction, qrCodeDataUrl);

    // Use UUID for filename to prevent enumeration (security improvement)
    const fileName = `${crypto.randomUUID()}.html`;
    
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, pdfContent, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du reçu" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);

    const receiptUrl = publicUrlData.publicUrl;

    // Update transaction with receipt URL and storage path
    await supabase
      .from("transactions")
      .update({ 
        receipt_url: receiptUrl,
        receipt_storage_path: fileName 
      })
      .eq("id", transactionId);

    console.log("Receipt generated successfully:", receiptUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        receiptUrl,
        reference: transaction.reference 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating receipt:", error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);