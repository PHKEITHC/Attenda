import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentClassCard({ cls, studentId, index }) {
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    load();
  }, [cls.id]);

  const load = async () => {
    const [sess, recs] = await Promise.all([
      base44.entities.AttendanceSession.filter({ class_id: cls.id }, "-session_date"),
      base44.entities.AttendanceRecord.filter({ class_id: cls.id, student_id: studentId }),
    ]);
    setSessions(sess);
    setRecords(recs);
  };

  const present = records.filter((r) => r.status === "present").length;
  const rate = records.length > 0 ? Math.round((present / records.length) * 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold font-heading text-foreground">{cls.name}</h2>
          {cls.subject && <p className="text-muted-foreground text-sm">{cls.subject}</p>}
          {cls.description && <p className="text-muted-foreground text-sm mt-1">{cls.description}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Sessions", value: sessions.length },
          { label: "Present", value: present, color: "text-green-700" },
          { label: "Attendance", value: rate !== null ? `${rate}%` : "—", color: rate !== null && rate < 75 ? "text-red-600" : undefined },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold font-heading ${color || ""}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {records.length > 0 && (
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold font-heading text-foreground mb-3">Attendance History</h3>
          <div className="space-y-2">
            {sessions.map((session) => {
              const record = records.find((r) => r.session_id === session.id);
              if (!record) return null;
              return (
                <div key={session.id} className="flex items-center justify-between">
                  <p className="text-sm text-foreground">
                    {new Date(session.session_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${record.status === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {record.status === "present" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {record.status === "present" ? "Present" : "Absent"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}