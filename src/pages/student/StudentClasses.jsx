import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { BookOpen, Plus, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentClasses() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myClass, setMyClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [joinForm, setJoinForm] = useState({ classCode: "", studentId: "" });
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [sessions, setSessions] = useState([]);
  const [myRecords, setMyRecords] = useState([]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    setMe(user);
    const profiles = await base44.entities.UserProfile.filter({ user_id: user.id });
    const p = profiles[0];
    setProfile(p);

    if (p?.class_id) {
      const classData = await base44.entities.Class.filter({ id: p.class_id });
      setMyClass(classData[0] || null);
      if (classData[0]) {
        const [sess, recs] = await Promise.all([
          base44.entities.AttendanceSession.filter({ class_id: classData[0].id }, "-session_date"),
          base44.entities.AttendanceRecord.filter({ class_id: classData[0].id, student_id: p.student_id }),
        ]);
        setSessions(sess);
        setMyRecords(recs);
      }
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    setJoinError("");
    if (!joinForm.classCode.trim() || !joinForm.studentId.trim()) {
      setJoinError("Please fill in both fields");
      return;
    }
    setJoining(true);
    try {
      const classes = await base44.entities.Class.filter({ class_code: joinForm.classCode.trim().toUpperCase() });
      if (classes.length === 0) {
        setJoinError("Class code not found. Please check and try again.");
        setJoining(false);
        return;
      }
      const cls = classes[0];

      // Find matching student in roster
      const roster = await base44.entities.Student.filter({ class_id: cls.id, student_id: joinForm.studentId.trim() });
      if (roster.length === 0) {
        setJoinError("Student ID not found in this class roster. Contact your teacher.");
        setJoining(false);
        return;
      }

      const student = roster[0];

      // Link user to student record
      await base44.entities.Student.update(student.id, { user_id: me.id, email: me.email });

      // Update profile
      await base44.entities.UserProfile.update(profile.id, {
        class_id: cls.id,
        student_id: joinForm.studentId.trim(),
        full_name: student.full_name,
      });

      setShowJoin(false);
      init();
    } catch (e) {
      setJoinError("Something went wrong. Please try again.");
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Stats
  const present = myRecords.filter((r) => r.status === "present").length;
  const absent = myRecords.filter((r) => r.status === "absent").length;
  const rate = myRecords.length > 0 ? Math.round((present / myRecords.length) * 100) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">My Class</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {me?.full_name || "Welcome back"}
          </p>
        </div>
        {!myClass && (
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Join Class
          </button>
        )}
      </div>

      {/* Join Modal */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold font-heading">Join a Class</h2>
                <button onClick={() => { setShowJoin(false); setJoinError(""); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Class Code</label>
                  <input
                    value={joinForm.classCode}
                    onChange={(e) => setJoinForm({ ...joinForm, classCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. AB12CD"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono tracking-widest"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Your Student ID</label>
                  <input
                    value={joinForm.studentId}
                    onChange={(e) => setJoinForm({ ...joinForm, studentId: e.target.value })}
                    placeholder="e.g. S001"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {joinError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5">{joinError}</p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowJoin(false); setJoinError(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                >
                  {joining ? "Joining…" : "Join Class"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <p className="text-muted-foreground text-sm mb-6">Enter your class code and student ID to join</p>
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Join Class
          </button>
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
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-5 text-center"
            >
              <p className="text-2xl font-bold font-heading">{sessions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Sessions</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-2xl p-5 text-center"
            >
              <p className="text-2xl font-bold font-heading text-green-700">{present}</p>
              <p className="text-xs text-muted-foreground mt-1">Present</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-5 text-center"
            >
              <p className={`text-2xl font-bold font-heading ${rate !== null && rate < 75 ? "text-red-600" : "text-foreground"}`}>
                {rate !== null ? `${rate}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Attendance</p>
            </motion.div>
          </div>

          {/* Recent Sessions */}
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
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.session_date}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                          record.status === "present"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {record.status === "present" ? "✓ Present" : "✗ Absent"}
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