import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentClasses() {
  const [me, setMe] = useState(null);
  const [myClass, setMyClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [myRecords, setMyRecords] = useState([]);
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    setMe(user);

    // Get student info from AllowedUser
    const [allowed] = await base44.entities.AllowedUser.filter({ email: user.email });
    if (!allowed?.student_id) {
      setLoading(false);
      return;
    }
    setStudentId(allowed.student_id);

    // Find student roster entry
    const studentRecs = await base44.entities.Student.filter({ student_id: allowed.student_id });
    if (studentRecs.length === 0) {
      setLoading(false);
      return;
    }
    const student = studentRecs[0];

    // Auto-link user_id if not set
    if (!student.user_id) {
      await base44.entities.Student.update(student.id, { user_id: user.id, email: user.email });
    }

    const classData = await base44.entities.Class.filter({ id: student.class_id });
    setMyClass(classData[0] || null);

    if (classData[0]) {
      const [sess, recs] = await Promise.all([
        base44.entities.AttendanceSession.filter({ class_id: classData[0].id }, "-session_date"),
        base44.entities.AttendanceRecord.filter({ class_id: classData[0].id, student_id: allowed.student_id }),
      ]);
      setSessions(sess);
      setMyRecords(recs);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const present = myRecords.filter((r) => r.status === "present").length;
  const absent = myRecords.filter((r) => r.status === "absent").length;
  const rate = myRecords.length > 0 ? Math.round((present / myRecords.length) * 100) : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground font-heading">My Class</h1>
        <p className="text-muted-foreground text-sm mt-1">{me?.full_name || me?.email}</p>
      </div>

      {!myClass ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold font-heading mb-1">Not enrolled in any class</h3>
          <p className="text-muted-foreground text-sm">Your class will appear here once your teacher adds you to the roster.</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Class Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold font-heading text-foreground">{myClass.name}</h2>
                {myClass.subject && <p className="text-muted-foreground text-sm">{myClass.subject}</p>}
                {myClass.description && <p className="text-muted-foreground text-sm mt-1">{myClass.description}</p>}
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Sessions", value: sessions.length, delay: 0.1 },
              { label: "Present", value: present, delay: 0.15, color: "text-green-700" },
              { label: "Attendance", value: rate !== null ? `${rate}%` : "—", delay: 0.2, color: rate !== null && rate < 75 ? "text-red-600" : undefined },
            ].map(({ label, value, delay, color }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay }}
                className="bg-card border border-border rounded-2xl p-5 text-center"
              >
                <p className={`text-2xl font-bold font-heading ${color || ""}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Attendance History */}
          {myRecords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-bold font-heading text-foreground">My Attendance History</h3>
              </div>
              <div className="divide-y divide-border">
                {sessions.map((session) => {
                  const record = myRecords.find((r) => r.session_id === session.id);
                  if (!record) return null;
                  return (
                    <div key={session.id} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(session.session_date + "T00:00:00").toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.session_date}</p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${record.status === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {record.status === "present" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {record.status === "present" ? "Present" : "Absent"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}