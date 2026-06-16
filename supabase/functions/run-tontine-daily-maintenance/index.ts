// Tontine daily maintenance Edge Function (PREPARATION ONLY — NOT DEPLOYED / NOT SCHEDULED)
//
// WHAT THIS DOES
//   Thin, safe orchestrator for the new tontine_contributions module. It calls
//   the SECURITY DEFINER runner public.run_daily_tontine_maintenance(...) using
//   the service role, which:
//     1. generates the target day's contributions (idempotent), then
//     2. marks strictly-past unpaid/partial contributions as overdue.
//
// SAFETY
//   * Single source of truth: only touches tontine_contributions via the RPC.
//     It NEVER references the legacy `contributions` table.
//   * Defaults to dryRun = TRUE: nothing is written unless the caller explicitly
//     sends { "dryRun": false }.
//   * Sends NO emails. Reminder dispatch is intentionally NOT implemented here
//     yet (see REMINDERS note below).
//   * Auth: a service caller may present EITHER the legacy service role JWT
//     (Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>) OR a new Supabase
//     secret API key (apikey: <one of SUPABASE_SECRET_KEYS>). A normal user JWT
//     is accepted only if the user has the admin role. Publishable keys are
//     NEVER accepted as service callers. Secrets are never logged or returned.
//   * No scheduling: this file does not register any cron. A schedule must be
//     added manually later, disabled by default.
//
// RETURNS (JSON)
//   { generated_count, closed_overdue_count, target_generate_date,
//     target_close_date, dry_run, errors }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

// Legacy service role key (JWT). May be empty if the project only uses the new
// secret API key system.
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// New Supabase secret API keys. SUPABASE_SECRET_KEYS is typically a JSON object
// like {"default":"sb_secret_..."}; we also tolerate a JSON array or a bare
// string. Malformed JSON is ignored safely. The raw value is never logged.
const parseSecretKeys = (): Set<string> => {
  const out = new Set<string>();
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return out;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const v of parsed) if (typeof v === "string" && v.length > 0) out.add(v);
    } else if (parsed && typeof parsed === "object") {
      for (const v of Object.values(parsed)) {
        if (typeof v === "string" && v.length > 0) out.add(v);
      }
    } else if (typeof parsed === "string" && parsed.length > 0) {
      out.add(parsed);
    }
  } catch (_e) {
    // Malformed JSON: ignore safely. Never surface or log the raw value.
  }
  return out;
};

const secretKeys = parseSecretKeys();

// Credential used to build the internal (elevated) service client. Prefer the
// legacy service role key; otherwise fall back to the first available secret
// key. Empty when neither is configured.
const serviceCredential = serviceRoleKey || (secretKeys.size > 0 ? [...secretKeys][0] : "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Add a number of days to a YYYY-MM-DD date string (UTC, no time component).
const addDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
};

const todayUtc = (): string => new Date().toISOString().split("T")[0];

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Authentication -------------------------------------------------------
  // Accept service callers two safe ways, then fall back to admin-user JWT.
  const apiKeyHeader = req.headers.get("apikey") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";

  let authorizedAsService = false;

  // 1. New Supabase secret API key via the apikey header. Publishable keys are
  //    never in secretKeys, so they can never authorize here.
  if (apiKeyHeader && secretKeys.has(apiKeyHeader)) {
    authorizedAsService = true;
    console.log("Authorized: secret API key (apikey header)");
  }

  // 2. Legacy service role JWT via Authorization: Bearer.
  if (!authorizedAsService && bearer && serviceRoleKey && bearer === serviceRoleKey) {
    authorizedAsService = true;
    console.log("Authorized: legacy service role key (Bearer)");
  }

  // 3. Otherwise treat the Bearer token as a normal user JWT and require admin.
  if (!authorizedAsService) {
    if (!bearer) {
      return jsonResponse({ error: "Unauthorized - Missing credentials" }, 401);
    }
    if (!serviceCredential) {
      // No server-side credential to verify the role with.
      return jsonResponse({ error: "Server configuration error" }, 500);
    }
    // Validate the user JWT with a client built from a real PROJECT apikey
    // (anon/publishable). Passing the user token as the client key — as a
    // previous version did — makes auth.getUser() send an invalid apikey and
    // fail with 401. Here we pass the token explicitly to getUser(token).
    const authApiKey = Deno.env.get("SUPABASE_ANON_KEY") || apiKeyHeader;
    if (!authApiKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }
    const authClient = createClient(supabaseUrl, authApiKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(bearer);
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized - Invalid token" }, 401);
    }

    // Confirm the role against the database with the service client (bypasses
    // RLS). Accept admin OR super_admin; never trust a decoded JWT role.
    const adminClient = createClient(supabaseUrl, serviceCredential);
    const { data: roles, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .limit(1);
    if (roleError) {
      console.error("Role lookup failed");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }
    if (!roles || roles.length === 0) {
      return jsonResponse({ error: "Forbidden - Admin or super_admin required" }, 403);
    }
    console.log("Authorized: admin/super_admin user JWT:", user.id);
  }

  // A server-side service credential is required to run maintenance.
  if (!serviceCredential) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  // --- Parse options (default to a safe dry run) ----------------------------
  let dryRun = true;
  let generateDate = todayUtc();
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.dryRun === "boolean") dryRun = body.dryRun;
      if (typeof body?.targetDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.targetDate)) {
        generateDate = body.targetDate;
      }
    }
  } catch (_e) {
    // Ignore malformed body; keep safe defaults.
  }

  // Close strictly-past dates only: close date = day before the generate date.
  const closeDate = addDays(generateDate, -1);

  // --- Run the maintenance via the SECURITY DEFINER runner ------------------
  try {
    const supabase = createClient(supabaseUrl, serviceCredential);
    const { data, error } = await supabase.rpc("run_daily_tontine_maintenance", {
      p_generate_date: generateDate,
      p_close_date: closeDate,
      p_dry_run: dryRun,
    });

    if (error) {
      console.error("run_daily_tontine_maintenance failed:", error);
      return jsonResponse(
        {
          generated_count: 0,
          closed_overdue_count: 0,
          target_generate_date: generateDate,
          target_close_date: closeDate,
          dry_run: dryRun,
          errors: [error.message],
        },
        500,
      );
    }

    // REMINDERS: intentionally NOT sent here yet. When implemented, reminder
    // dispatch MUST default to dry-run and MUST read tontine_contributions
    // (never the legacy `contributions` table).
    console.log("Tontine daily maintenance completed:", data);
    return jsonResponse(data, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in run-tontine-daily-maintenance:", message);
    return jsonResponse(
      {
        generated_count: 0,
        closed_overdue_count: 0,
        target_generate_date: generateDate,
        target_close_date: closeDate,
        dry_run: dryRun,
        errors: [message],
      },
      500,
    );
  }
};

serve(handler);
