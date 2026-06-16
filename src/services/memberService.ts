// Admin-only member directory service (Phase 1 enriched filters)
// File: src/services/memberService.ts

import { supabase } from "@/integrations/supabase/client";

// One enriched member row as returned by the admin_list_members_enriched RPC.
// NOTE: financing_* fields are linked by email only (financing_requests has no
// user_id), so they are approximate. See the migration for details.
export interface AdminMemberEnriched {
  id: string | null;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  city: string | null;
  profession: string | null;
  email: string | null;
  recommended_category: string | null;
  role: string | null;
  tontine_category_names: string[];
  has_active_tontine: boolean;
  has_contributions: boolean;
  has_declared_payment: boolean;
  has_validated_payment: boolean;
  has_overdue_contribution: boolean;
  has_financing_request: boolean;
  financing_statuses: string[];
}

// Admin/super_admin only. The RPC enforces authorization server-side and
// raises an exception for non-admins, which surfaces here as a thrown error.
export const fetchAdminMembersEnriched = async (): Promise<AdminMemberEnriched[]> => {
  // Typed RPC: admin_list_members_enriched is present in the generated Database
  // types (migration applied), so no cast is needed.
  const { data, error } = await supabase.rpc("admin_list_members_enriched");

  if (error) throw error;
  return data ?? [];
};
