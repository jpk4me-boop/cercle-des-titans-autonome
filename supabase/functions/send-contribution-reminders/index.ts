import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  due_date: string;
  notes: string | null;
}

const formatAmount = (amount: number): string => {
  return amount.toLocaleString('fr-FR') + ' FCFA';
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const sendEmail = async (to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Cercle des Titans <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || "Failed to send email" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

const generateUpcomingEmail = (
  firstName: string,
  amount: number,
  dueDate: string,
  daysUntil: number
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .amount { font-size: 28px; font-weight: bold; color: #1a365d; }
        .date { color: #64748b; font-size: 14px; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔔 Rappel de Cotisation</h1>
      </div>
      <div class="content">
        <p>Bonjour <strong>${firstName}</strong>,</p>
        <p>Ceci est un rappel amical concernant votre prochaine cotisation au <strong>Cercle des Titans</strong>.</p>
        
        <div class="highlight">
          <p class="date">📅 Échéance : <strong>${formatDate(dueDate)}</strong></p>
          <p>Montant à payer :</p>
          <p class="amount">${formatAmount(amount)}</p>
          <p style="color: #f59e0b; font-weight: 500;">⏰ Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}</p>
        </div>
        
        <p>Pensez à effectuer votre paiement avant la date d'échéance pour rester à jour dans vos cotisations.</p>
        
        <p>Pour toute question, n'hésitez pas à nous contacter.</p>
        
        <p>Cordialement,<br><strong>L'équipe du Cercle des Titans</strong></p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Cercle des Titans. Tous droits réservés.</p>
      </div>
    </body>
    </html>
  `;
};

const generateOverdueEmail = (
  firstName: string,
  amount: number,
  dueDate: string,
  daysOverdue: number
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .amount { font-size: 28px; font-weight: bold; color: #991b1b; }
        .date { color: #64748b; font-size: 14px; }
        .urgent { color: #dc2626; font-weight: bold; font-size: 16px; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠️ Cotisation en Retard</h1>
      </div>
      <div class="content">
        <p>Bonjour <strong>${firstName}</strong>,</p>
        <p>Nous vous informons que votre cotisation au <strong>Cercle des Titans</strong> est en retard de paiement.</p>
        
        <div class="highlight">
          <p class="date">📅 Date d'échéance dépassée : <strong>${formatDate(dueDate)}</strong></p>
          <p>Montant dû :</p>
          <p class="amount">${formatAmount(amount)}</p>
          <p class="urgent">🚨 En retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}</p>
        </div>
        
        <p>Nous vous prions de régulariser votre situation dans les plus brefs délais afin d'éviter toute pénalité.</p>
        
        <p>Si vous avez déjà effectué ce paiement, veuillez ignorer ce message. En cas de difficulté, contactez-nous pour trouver une solution ensemble.</p>
        
        <p>Cordialement,<br><strong>L'équipe du Cercle des Titans</strong></p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Cercle des Titans. Tous droits réservés.</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Security: Verify service role key authentication
  // This function should only be called by cron jobs or admins with the service key
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    console.error("No authorization header provided");
    return new Response(
      JSON.stringify({ error: "Unauthorized - Missing authorization header" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Extract token from Bearer header
  const token = authHeader.replace("Bearer ", "");
  
  // Check if the token matches the service role key (for cron job access)
  if (token !== supabaseServiceKey) {
    // If not service key, verify it's an admin user
    const supabaseWithUserToken = createClient(supabaseUrl, token);
    const { data: { user }, error: authError } = await supabaseWithUserToken.auth.getUser();
    
    if (authError || !user) {
      console.error("Invalid authentication token:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin role using service client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin user authenticated:", user.id);
  } else {
    console.log("Service role key authenticated (cron job)");
  }

  try {
    console.log("Starting contribution reminder check...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const oneDayFromNow = new Date(today);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    
    // Fetch pending contributions that are upcoming (3 days or 1 day)
    const { data: upcomingContributions, error: upcomingError } = await supabase
      .from('contributions')
      .select('*')
      .eq('status', 'pending')
      .or(`due_date.eq.${threeDaysFromNow.toISOString().split('T')[0]},due_date.eq.${oneDayFromNow.toISOString().split('T')[0]}`);
    
    if (upcomingError) {
      console.error("Error fetching upcoming contributions:", upcomingError);
      throw upcomingError;
    }
    
    // Fetch overdue contributions
    const { data: overdueContributions, error: overdueError } = await supabase
      .from('contributions')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today.toISOString().split('T')[0]);
    
    if (overdueError) {
      console.error("Error fetching overdue contributions:", overdueError);
      throw overdueError;
    }
    
    console.log(`Found ${upcomingContributions?.length || 0} upcoming contributions`);
    console.log(`Found ${overdueContributions?.length || 0} overdue contributions`);
    
    const emailsSent: string[] = [];
    const errors: string[] = [];
    
    // Process upcoming contributions
    for (const contribution of upcomingContributions || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('user_id', contribution.user_id)
        .single();
      
      if (!profile?.email) {
        console.log(`No email found for user ${contribution.user_id}`);
        continue;
      }
      
      const dueDate = new Date(contribution.due_date);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const result = await sendEmail(
        profile.email,
        `🔔 Rappel: Cotisation à venir dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`,
        generateUpcomingEmail(
          profile.first_name || 'Membre',
          contribution.amount,
          contribution.due_date,
          daysUntil
        )
      );
      
      if (result.success) {
        console.log(`Reminder sent to ${profile.email} for contribution due in ${daysUntil} days`);
        emailsSent.push(profile.email);
      } else {
        console.error(`Error sending email to ${profile.email}:`, result.error);
        errors.push(`Failed to send to ${profile.email}: ${result.error}`);
      }
    }
    
    // Process overdue contributions
    for (const contribution of overdueContributions || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('user_id', contribution.user_id)
        .single();
      
      if (!profile?.email) {
        console.log(`No email found for user ${contribution.user_id}`);
        continue;
      }
      
      const dueDate = new Date(contribution.due_date);
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Update contribution status to overdue
      await supabase
        .from('contributions')
        .update({ status: 'overdue' })
        .eq('id', contribution.id);
      
      const result = await sendEmail(
        profile.email,
        `⚠️ Cotisation en retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
        generateOverdueEmail(
          profile.first_name || 'Membre',
          contribution.amount,
          contribution.due_date,
          daysOverdue
        )
      );
      
      if (result.success) {
        console.log(`Overdue notice sent to ${profile.email} (${daysOverdue} days late)`);
        emailsSent.push(profile.email);
      } else {
        console.error(`Error sending overdue email to ${profile.email}:`, result.error);
        errors.push(`Failed to send overdue to ${profile.email}: ${result.error}`);
      }
    }
    
    const response = {
      success: true,
      upcomingCount: upcomingContributions?.length || 0,
      overdueCount: overdueContributions?.length || 0,
      emailsSent: emailsSent.length,
      emails: emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    };
    
    console.log("Reminder job completed:", response);
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-contribution-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);