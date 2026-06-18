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

      // Check role-specific account databases in parallel
      const [teachers, students, parents] = await Promise.all([
        base44.entities.TeacherAccount.filter({ email: me.email }),
        base44.entities.StudentAccount.filter({ email: me.email }),
        base44.entities.ParentAccount.filter({ email: me.email }),
      ]);

      if (teachers.length > 0 && teachers[0].is_active !== false) {
        // Cache user_id on TeacherAccount for notifications
        if (!teachers[0].user_id_cache) {
          await base44.entities.TeacherAccount.update(teachers[0].id, { user_id_cache: me.id });
        }
        navigate("/teacher/classes");
        return;
      }

      if (students.length > 0 && students[0].is_active) {
        if (!students[0].user_id_cache) {
          await base44.entities.StudentAccount.update(students[0].id, { user_id_cache: me.id });
        }
        navigate("/student/classes");
        return;
      }

      if (parents.length > 0 && parents[0].is_active) {
        if (!parents[0].user_id_cache) {
          await base44.entities.ParentAccount.update(parents[0].id, { user_id_cache: me.id });
        }
        navigate("/parent");
        return;
      }

      navigate("/access-denied");
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