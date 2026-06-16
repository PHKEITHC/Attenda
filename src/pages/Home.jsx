import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    redirect();
  }, []);

  const redirect = async () => {
    try {
      const me = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_id: me.id });
      if (profiles.length === 0) {
        navigate("/select-role");
        return;
      }
      const role = profiles[0].role;
      if (role === "teacher") {
        navigate("/teacher/classes");
      } else {
        navigate("/student/classes");
      }
    } catch (e) {
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}