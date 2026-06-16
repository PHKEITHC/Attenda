import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentSummaryTab({ classId, students }) {
  const [records, setRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    const [recs, sess] = await Promise.all([
      base44.entities.AttendanceRecord.filter({ class_id: classId }),
      base44.entities.AttendanceSession.filter({ class_id: classId }),
    ]);
    setRecords(recs);
    setSessions(sess);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold font-heading mb-1">No students yet</h3>
        <p className="text-muted-foreground text-sm">Upload a CSV roster to see summaries</p>
      </div>
    );
  }

  const totalSessions = sessions.length;

  const summaries = students.map((s) => {
    const studentRecords = records.filter((r) => r.student_id === s.student_id);
    const present = studentRecords.filter((r) => r.status === "present").length;
    const absent = studentRecords.filter((r) => r.status === "absent").length;
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : null;
    return { ...s, present, absent, total, rate };
  });

  summaries.sort((a, b) => (a.rate ?? -1) - (b.rate ?? -1));

  const getBarColor = (rate) => {
    if (rate === null) return "bg-muted";
    if (rate >= 80) return "bg-green-500";
    if (rate >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTextColor = (rate) => {
    if (rate === null) return "text-muted-foreground";
    if (rate >= 80) return "text-green-700";
    if (rate >= 60) return "text-yellow-700";
    return "text-red-700";
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 bg-muted rounded-xl p-4">
        <div className="text-center flex-1">
          <p className="text-2xl font-bold font-heading">{totalSessions}</p>
          <p className="text-xs text-muted-foreground">Total Sessions</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex-1">
          <p className="text-2xl font-bold font-heading">{students.length}</p>
          <p className="text-xs text-muted-foreground">Students</p>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="text-center flex-1">
          <p className="text-2xl font-bold font-heading text-green-700">
            {summaries.filter((s) => s.rate !== null && s.rate >= 80).length}
          </p>
          <p className="text-xs text-muted-foreground">≥80% Rate</p>
        </div>
      </div>

      <div className="space-y-3">
        {summaries.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold font-heading text-foreground">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">ID: {s.student_id}</p>
              </div>
              <span
                className={`text-lg font-bold font-heading ${getTextColor(s.rate)}`}
              >
                {s.rate !== null ? `${s.rate}%` : "—"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(s.rate)}`}
                style={{ width: s.rate !== null ? `${s.rate}%` : "0%" }}
              />
            </div>

            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-700 font-medium">{s.present} Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-600 font-medium">{s.absent} Absent</span>
              </div>
              <span className="text-muted-foreground">{s.total} / {totalSessions} sessions</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}