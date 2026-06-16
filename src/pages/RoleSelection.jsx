import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function RoleSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const me = await base44.auth.me();
      const existing = await base44.entities.UserProfile.filter({ user_id: me.id });
      if (existing.length === 0) {
        await base44.entities.UserProfile.create({
          user_id: me.id,
          role: selected,
          full_name: me.full_name || "",
        });
      }
      navigate(selected === "teacher" ? "/teacher/classes" : "/student/classes");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-heading">Welcome to AttendEase</h1>
          <p className="text-muted-foreground mt-2 text-sm">Choose your account type to continue</p>
        </div>

        <div className="space-y-4 mb-8">
          {[
            {
              role: "teacher",
              icon: BookOpen,
              title: "I'm a Teacher",
              desc: "Create classes, upload rosters, and take attendance",
            },
            {
              role: "student",
              icon: GraduationCap,
              title: "I'm a Student",
              desc: "Join a class and track your attendance record",
            },
          ].map(({ role, icon: Icon, title, desc }) => (
            <button
              key={role}
              onClick={() => setSelected(role)}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                selected === role
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
              }`}
            >
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                  selected === role ? "bg-primary" : "bg-muted"
                }`}
              >
                <Icon className={`w-6 h-6 ${selected === role ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground font-heading">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
              {selected === role && (
                <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Continue <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}