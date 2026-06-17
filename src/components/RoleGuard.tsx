import { ReactNode, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "user" | "admin" | "super_admin";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const location = useLocation();
  const [status, setStatus] = useState<
    "loading" | "allowed" | "denied" | "unauthenticated"
  >("loading");

  const allowedRoleKey = useMemo(() => allowedRoles.join(","), [allowedRoles]);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          if (mounted) setStatus("unauthenticated");
          return;
        }

        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id);

        if (!mounted) return;

        if (roleError) {
          console.error("RoleGuard role error:", roleError);
          setStatus("denied");
          return;
        }

        const hasAllowedRole = (roles || []).some((item) =>
          allowedRoles.includes(item.role as AppRole)
        );

        setStatus(hasAllowedRole ? "allowed" : "denied");
      } catch (error) {
        console.error("RoleGuard unexpected error:", error);
        if (mounted) setStatus("denied");
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [allowedRoleKey]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Vérification des autorisations...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (status === "denied") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}