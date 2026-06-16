import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronRight, ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SessionHistoryTab({ classId }) {
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [classId]);

  const loadSessions = async () => {
    setLoading(true);
    const data = await base44.entities.AttendanceSession.filter({ class_id: classId }, "-session_date");
    setSessions(data);
    setLoading(false);
  };

  const loadRecords = async (sessionId) => {
    if (records[sessionId]) return;
    const data = await base44.entities.AttendanceRecord.filter({ session_id: sessionId });
    setRecords((prev) => ({ ...prev, [sessionId]: data }));
  };

  const toggle = async (sessionId) => {
    if (expanded === sessionId) {
      setExpanded(null);
    } else {
      setExpanded(sessionId);
      await loadRecords(sessionId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <ClipboardList className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold font-heading mb-1">No sessions yet</h3>
        <p className="text-muted-foreground text-sm">Take attendance first to see session history</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, i) => {
        const isOpen = expanded === session.id;
        const recs = records[session.id] || [];
        const presentCount = recs.filter((r) => r.status === "present").length;
        const absentCount = recs.filter((r) => r.status === "absent").length;

        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => toggle(session.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground font-heading">
                  {new Date(session.session_date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted {new Date(session.submitted_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {recs.length > 0 && (
                <div className="flex gap-2 flex-shrink-0">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-medium">{presentCount}P</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-medium">{absentCount}A</span>
                </div>
              )}
              {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-border">
                    {recs.length === 0 ? (
                      <div className="py-6 text-center text-muted-foreground text-sm">
                        <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" />
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recs.map((r) => (
                          <div
                            key={r.id}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                              r.status === "present" ? "bg-green-50" : "bg-red-50"
                            }`}
                          >
                            {r.status === "present" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium flex-1">{r.student_name}</span>
                            <span className="text-xs text-muted-foreground">{r.student_id}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}