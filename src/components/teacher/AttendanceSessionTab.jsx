import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, XCircle, Send, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function AttendanceSessionTab({ classId, students }) {
  const today = new Date().toISOString().split("T")[0];
  const [sessionDate, setSessionDate] = useState(today);
  const [absentIds, setAbsentIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleAbsent = (sid) => {
    setAbsentIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (students.length === 0) return;
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      const cls = await base44.entities.Class.filter({ id: classId });
      const className = cls[0]?.name || "Class";

      // Create the session
      const session = await base44.entities.AttendanceSession.create({
        class_id: classId,
        session_date: sessionDate,
        submitted_at: new Date().toISOString(),
        teacher_id: me.id,
      });

      // Create attendance records for all students
      const records = students.map((s) => ({
        session_id: session.id,
        class_id: classId,
        student_id: s.student_id,
        student_name: s.full_name,
        status: absentIds.has(s.id) ? "absent" : "present",
        user_id: s.user_id || "",
      }));

      await base44.entities.AttendanceRecord.bulkCreate(records);

      // Send notifications to students who have linked accounts
      const linkedStudents = students.filter((s) => s.user_id);
      for (const s of linkedStudents) {
        const status = absentIds.has(s.id) ? "absent" : "present";
        await base44.entities.Notification.create({
          user_id: s.user_id,
          title: `Attendance: ${className}`,
          message: `Your attendance for ${sessionDate} has been recorded. Status: ${status === "present" ? "✅ Present" : "❌ Absent"}`,
          status,
          session_id: session.id,
          class_id: classId,
          class_name: className,
          session_date: sessionDate,
          is_read: false,
        });

        // Also notify parent(s) linked to this student's email
        if (s.email) {
          const parentAllowed = await base44.entities.AllowedUser.filter({ linked_student_email: s.email, role: "parent" });
          for (const parent of parentAllowed) {
            if (parent.user_id_cache) {
              await base44.entities.Notification.create({
                user_id: parent.user_id_cache,
                title: `Child Attendance: ${className}`,
                message: `${s.full_name}'s attendance for ${sessionDate}: ${status === "present" ? "✅ Present" : "❌ Absent"}`,
                status,
                session_id: session.id,
                class_id: classId,
                class_name: className,
                session_date: sessionDate,
                is_read: false,
              });
            }
          }
        }
      }

      setSubmitted(true);
      setAbsentIds(new Set());
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = students.length - absentIds.size;
  const absentCount = absentIds.size;

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold font-heading mb-1">No students yet</h3>
        <p className="text-muted-foreground text-sm">Upload a CSV roster to add students to this class</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold font-heading mb-1">Attendance Submitted!</h3>
        <p className="text-muted-foreground text-sm mb-6">Students have been notified of their status</p>
        <div className="flex gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-center">
            <p className="text-2xl font-bold text-green-700">{presentCount}</p>
            <p className="text-xs text-green-600 font-medium">Present</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-center">
            <p className="text-2xl font-bold text-red-700">{absentCount}</p>
            <p className="text-xs text-red-600 font-medium">Absent</p>
          </div>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
        >
          Take Another Session
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Session Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Date:</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-700 bg-green-100 px-3 py-1.5 rounded-lg font-medium">{presentCount} Present</span>
          <span className="text-sm text-red-700 bg-red-100 px-3 py-1.5 rounded-lg font-medium">{absentCount} Absent</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or student ID…"
          className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700">
        All students are marked <strong>Present</strong> by default. Click a student to mark them <strong>Absent</strong>.
      </div>

      {/* Student List */}
      <div className="space-y-2 mb-6">
        {filtered.map((s, i) => {
          const isAbsent = absentIds.has(s.id);
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => toggleAbsent(s.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                isAbsent
                  ? "border-red-300 bg-red-50"
                  : "border-green-200 bg-green-50 hover:border-green-400"
              }`}
            >
              <div className={`flex-shrink-0 ${isAbsent ? "text-red-500" : "text-green-500"}`}>
                {isAbsent ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${isAbsent ? "text-red-800" : "text-green-800"}`}>{s.full_name}</p>
                <p className={`text-xs ${isAbsent ? "text-red-500" : "text-green-600"}`}>ID: {s.student_id}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isAbsent ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700"}`}>
                {isAbsent ? "Absent" : "Present"}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
      >
        {submitting ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <><Send className="w-4 h-4" /> Submit Attendance</>
        )}
      </button>
    </div>
  );
}