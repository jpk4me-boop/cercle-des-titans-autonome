import { Crown } from "lucide-react";

interface SuperAdminBadgeProps {
  /** Affiche le badge uniquement si true (rôle super_admin confirmé). */
  show: boolean;
  className?: string;
}

/**
 * Étiquette premium "SUPER ADMIN" — design dark luxury (noir/or, glassmorphism).
 * Ne s'affiche que pour le rôle super_admin. Aucune logique Supabase ici :
 * la décision d'affichage est passée par la prop `show`.
 */
const SuperAdminBadge = ({ show, className = "" }: SuperAdminBadgeProps) => {
  if (!show) return null;

  return (
    <span
      title="Compte Super Admin"
      className={`inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.18)] backdrop-blur-md transition-all duration-300 hover:border-amber-300/60 hover:text-amber-200 hover:shadow-[0_0_32px_rgba(245,158,11,0.35)] ${className}`}
    >
      <Crown className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-nowrap">Super Admin</span>
    </span>
  );
};

export default SuperAdminBadge;
