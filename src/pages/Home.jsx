import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    redirect();
  }, []);

  const redirect = async () => {
    try {
      const me = await base44.auth.me();

      // Base44 admins go directly to admin dashboard
      if (me.role === "admin") {
        navigate("/admin");
        return;
      }

      // For all others, check AllowedUser list
      const allowed = await base44.entities.AllowedUser.filter({ email: me.email });
      if (allowed.length === 0 || !allowed[0].is_active) {
        navigate("/access-denied");
        return;
      }

      const role = allowed[0].role;
      if (role === "teacher") {
        navigate("/teacher/classes");
      } else if (role === "parent") {
        navigate("/parent");
      } else {
        navigate("/student/classes");
      }
    } catch (e) {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}