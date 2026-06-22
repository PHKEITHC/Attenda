import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import StudentClassCard from "@/components/student/StudentClassCard";

export default function StudentClasses() {
  const [me, setMe] = useState(null);
  const [classes, setClasses] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    setMe(user);

    // Find student account by email to get student_uid
    const [acct] = await base44.entities.StudentAccount.filter({ email: user.email });
    if (!acct) {
      setLoading(false);
      return;
    }
    setStudentId(acct.student_uid);

    // Auto-link user_id_cache if not set
    if (!acct.user_id_cache) {
      await base44.entities.StudentAccount.update(acct.id, { user_id_cache: user.id });
    }

    // Find ALL roster entries for this student (across multiple classes)
    const roster = await base44.entities.Student.filter({ student_id: acct.student_uid });
    if (roster.length === 0) {
      setLoading(false);
      return;
    }

    // Auto-link user_id on roster entries
    for (const r of roster) {
      if (!r.user_id) {
        await base44.entities.Student.update(r.id, { user_id: user.id, email: user.email });
      }
    }

    // Fetch all classes the student is enrolled in
    const classIds = [...new Set(roster.map((r) => r.class_id))];
    const classData = await Promise.all(
      classIds.map((cid) => base44.entities.Class.filter({ id: cid }))
    );
    setClasses(classData.map((c) => c[0]).filter(Boolean));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground font-heading">My Classes</h1>
        <p className="text-muted-foreground text-sm mt-1">{me?.full_name || me?.email}</p>
      </div>

      {classes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold font-heading mb-1">Not enrolled in any class</h3>
          <p className="text-muted-foreground text-sm">Your classes will appear here once a teacher adds you to the roster.</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {classes.map((cls, i) => (
            <StudentClassCard key={cls.id} cls={cls} studentId={studentId} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}