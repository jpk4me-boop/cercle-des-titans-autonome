import { supabase } from "@/integrations/supabase/client";

export interface TontineCategory {
  name: string;
  amount: number;
  color: string;
  icon: string;
}

export const TONTINE_CATEGORIES: TontineCategory[] = [
  { name: "Bronze", amount: 5000, color: "#CD7F32", icon: "🥉" },
  { name: "Silver", amount: 10000, color: "#C0C0C0", icon: "🥈" },
  { name: "Gold", amount: 25000, color: "#FFD700", icon: "🥇" },
  { name: "Diamond", amount: 50000, color: "#B9F2FF", icon: "💎" },
  { name: "Platinum", amount: 100000, color: "#E5E4E2", icon: "👑" },
  { name: "Prestige", amount: 200000, color: "#D4AF37", icon: "🏆" },
];

export type PaymentMethod = "MTN MoMo" | "Orange Money";

export interface PaymentInfo {
  method: PaymentMethod;
  beneficiaryNumber: string;
  beneficiaryName: string;
}

export const PAYMENT_METHODS: Record<PaymentMethod, PaymentInfo> = {
  "MTN MoMo": {
    method: "MTN MoMo",
    beneficiaryNumber: "+237 672 482 763",
    beneficiaryName: "Cercle des Titans",
  },
  "Orange Money": {
    method: "Orange Money",
    beneficiaryNumber: "+237 691 849 494",
    beneficiaryName: "Cercle des Titans",
  },
};

export interface TransactionData {
  fullName: string;
  phone: string;
  email?: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface TransactionResult {
  id: string;
  reference: string;
  status: "pending" | "confirmed";
  transactionId?: string;
}

// Generate unique reference: CT-YYYYMMDD-XXXXXX
const generateReference = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CT-${year}${month}${day}-${random}`;
};

// Simulate payment processing (sandbox mode)
const simulatePayment = async (data: TransactionData): Promise<{ success: boolean; transactionId?: string }> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  // In sandbox mode, always return success with a simulated transaction ID
  const transactionId = `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  return {
    success: true,
    transactionId,
  };
};

export const initiatePayment = async (data: TransactionData): Promise<TransactionResult> => {
  const reference = generateReference();
  
  // Create transaction record using secure RPC function with rate limiting
  const { data: transactionId, error: insertError } = await supabase.rpc(
    "create_transaction",
    {
      _reference: reference,
      _full_name: data.fullName,
      _phone: data.phone,
      _email: data.email || null,
      _category: data.category,
      _amount: data.amount,
      _payment_method: data.paymentMethod,
    }
  );

  if (insertError) {
    console.error("Error creating transaction:", insertError);
    // Handle rate limit error specifically
    if (insertError.message?.includes("Rate limit")) {
      throw new Error("Trop de tentatives. Veuillez réessayer plus tard.");
    }
    throw new Error("Erreur lors de la création de la transaction");
  }

  const transaction = { id: transactionId };

  // Simulate payment processing
  const paymentResult = await simulatePayment(data);

  if (paymentResult.success) {
    // Transaction status is managed server-side. Client roles have no UPDATE
    // privilege on public.transactions under RLS, so no direct update is attempted
    // here (it would be denied). Persistence is handled by the secure backend
    // (create_transaction RPC / generate-receipt Edge Function).
    return {
      id: transaction.id,
      reference,
      status: "confirmed",
      transactionId: paymentResult.transactionId,
    };
  }

  return {
    id: transaction.id,
    reference,
    status: "pending",
  };
};

export const generateReceipt = async (transactionId: string): Promise<{ receiptUrl: string; reference: string }> => {
  const { data, error } = await supabase.functions.invoke("generate-receipt", {
    body: { transactionId },
  });

  if (error) {
    console.error("Error generating receipt:", error);
    throw new Error("Erreur lors de la génération du reçu");
  }

  return {
    receiptUrl: data.receiptUrl,
    reference: data.reference,
  };
};

export const getTransactionByReference = async (reference: string) => {
  // Use the secure RPC function instead of direct table query
  const { data, error } = await supabase.rpc("verify_transaction_by_reference", {
    _reference: reference,
  });

  if (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }

  // RPC returns an array, get the first item
  return data && data.length > 0 ? data[0] : null;
};

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};
