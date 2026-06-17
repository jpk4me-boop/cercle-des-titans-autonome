// TypeScript definitions for Tontine & Contributions module (Phase 1)
// File: src/types/tontine.ts

export interface TontineCategory {
  id: string;
  name: string;
  description: string | null;
  daily_amount: number;
  // Canonical weekly tier amount (added by the harmonize migration). Optional so the
  // app keeps working before the migration is deployed; falls back to daily_amount.
  weekly_amount?: number | null;
  // Contribution cadence (added by the harmonize migration). Official tiers are 'weekly'.
  // Optional so the app keeps working before the migration is deployed.
  frequency?: 'daily' | 'weekly';
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberTontineCategory {
  id: string;
  user_id: string;
  category_id: string;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface TontineCycle {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: 'planned' | 'draft' | 'active' | 'closed';
  contribution_amount?: number; // legacy/compatibility
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'mobile_money' | 'bank_transfer' | 'card' | 'other';
  provider: string | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TontineContributionStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface TontineContribution {
  id: string;
  user_id: string;
  category_id: string;
  cycle_id: string | null;
  due_date: string;
  expected_amount: number;
  paid_amount: number;
  status: TontineContributionStatus;
  created_at: string;
  updated_at: string;
}

export type ContributionPaymentStatus = 'pending' | 'partial' | 'paid' | 'rejected';

export interface ContributionPayment {
  id: string;
  contribution_id: string;
  user_id: string;
  category_id: string;
  cycle_id: string | null;
  payment_method_id: string | null;
  amount: number;
  payment_reference: string | null;
  payment_date: string;
  status: ContributionPaymentStatus;
  proof_url: string | null;
  admin_note: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContributionReminder {
  id: string;
  user_id: string;
  contribution_id: string | null;
  reminder_date: string;
  scheduled_at: string;
  sent_at: string | null;
  status: 'scheduled' | 'sent' | 'failed' | 'skipped';
  message: string;
  created_at: string;
}
