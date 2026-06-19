// Member account status service (sanctions).
// File: src/services/memberStatusService.ts
//
// Reads public.member_account_status and writes through the SECURITY DEFINER RPC
// admin_set_member_status. These objects are not yet in the generated Supabase
// types, hence the `as any` casts (same pattern as tontineService).

import { supabase } from "@/integrations/supabase/client";

export type MemberStatusValue = "active" | "paused" | "suspended" | "banned";

export interface MemberAccountStatus {
  user_id: string;
  status: MemberStatusValue;
  reason: string | null;
  paused_until: string | null;
  suspended_at: string | null;
  banned_at: string | null;
  updated_by: string | null;
  updated_at: string;
}

// The calling member's own status. Defaults to 'active' when no row exists
// (mirrors the SQL helper current_member_status()). RLS lets a member read only
// their own row.
export const fetchMyMemberStatus = async (userId: string): Promise<MemberStatusValue> => {
  const { data, error } = await (supabase as any)
    .from("member_account_status")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return ((data?.status as MemberStatusValue) ?? "active");
};

// Admin/super_admin only (RLS). Returns every status row (members without a row
// are implicitly 'active' and simply absent here).
export const fetchAllMemberStatuses = async (): Promise<MemberAccountStatus[]> => {
  const { data, error } = await (supabase as any)
    .from("member_account_status")
    .select("*");

  if (error) throw error;
  return (data as MemberAccountStatus[]) ?? [];
};

// Admin/super_admin only. The RPC enforces authorization server-side and uses
// auth.uid() as updated_by — the caller never passes a validator.
export const adminSetMemberStatus = async (
  userId: string,
  status: MemberStatusValue,
  reason?: string | null
): Promise<void> => {
  const { error } = await (supabase.rpc as any)("admin_set_member_status", {
    p_user_id: userId,
    p_status: status,
    p_reason: reason ?? null,
  });

  if (error) throw error;
};
