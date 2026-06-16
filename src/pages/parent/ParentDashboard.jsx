import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { GraduationCap, Bell, CheckCircle2, XCircle, LogOut, TrendingUp, TrendingDown, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function ParentDashboard() {
  const [me, setMe] = useState(null);
  const [allowedUser, setAllowedUser] = useState(null);
  const [linkedStudent, setLinkedStudent] = useState(null);
  const [studentRecord, setStudentRecord] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      setMe(user);

      const [allowed] = await base44.entities.AllowedUser.filter({ email: user.email });
      setAllowedUser(allowed);

      // Cache user_id on AllowedUser so teachers can find it for notifications
      if (allowed && !allowed.user_id_cached) {
        await base44.entities.AllowedUser.update(allowed.id, { user_id_cache: user.id });
      }

      if (allowed?.linked_student_email) {
        // Find the linked student's AllowedUser record
        const [linkedAllowed] = await base44.entities.AllowedUser.filter({ email: allowed.linked_student_email });
        setLinkedStudent(linkedAllowed);

        // Find the student entity record by student_id
        if (linkedAllowed?.student_id) {
          const studentRecs = await base44.entities.Student.filter({ student_id: linkedAllowed.student_id });
          if (studentRecs.length > 0) {
            setStudentRecord(studentRecs[0]);
            const [recs, sess] = await Promise.all([
              base44.entities.AttendanceRecord.filter({ student_id: linkedAllowed.student_id }),
              base44.entities.AttendanceSession.filter({ class_id: studentRecs[0].class_id }),
            ]);
            setAttendanceRecords(recs);
            setSessions(sess);
          }
        }
      }

      // Load notifications for this parent's user_id
      const notifs = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date");
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (n) => {
    if (n.is_read) return;
    await base44.entities.Notification.update(n.id, { is_read: true });
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
  };

  const present = attendanceRecords.filter((r) => r.status === "present").length;
  const absent = attendanceRecords.filter((r) => r.status === "absent").length;
  const total = present + absent;
  const rate = total > 0 ? Math.round((present / total) * 100) : null;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold text-lg font-heading">AttendEase</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Parent</span>
          </div>
          <button onClick={() => base44.auth.logout("/login")} className="flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Child info */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Child</p>
              <p className="font-bold font-heading text-lg">{linkedStudent?.full_name || "Not linked"}</p>
              {linkedStudent?.student_id && <p className="text-sm text-muted-foreground">Student ID: {linkedStudent.student_id}</p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "overview", label: "Attendance" },
            { id: "notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div>
            {studentRecord ? (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-card border border-border rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold font-heading">{sessions.length}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{present}</p>
                    <p className="text-xs text-green-600">Present</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-700">{absent}</p>
                    <p className="text-xs text-red-600">Absent</p>
                  </div>
                </div>
                {rate !== null && (
                  <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold">Attendance Rate</p>
                      <p className={`text-lg font-bold font-heading ${rate >= 80 ? "text-green-700" : rate >= 60 ? "text-yellow-700" : "text-red-700"}`}>{rate}%</p>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 60 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                )}
                {/* Recent records */}
                <h3 className="font-semibold font-heading mb-3">Recent Sessions</h3>
                <div className="space-y-2">
                  {attendanceRecords.slice(0, 20).map((r) => (
                    <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl ${r.status === "present" ? "bg-green-50" : "bg-red-50"}`}>
                      {r.status === "present" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className={`text-sm font-medium ${r.status === "present" ? "text-green-800" : "text-red-800"}`}>{r.status === "present" ? "Present" : "Absent"}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">No linked student found. Contact your admin.</p>
              </div>
            )}
          </div>
        )}

        {tab === "notifications" && (
          <div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button onClick={markAllRead} className="mb-4 text-sm text-primary font-medium hover:underline">
                Mark all as read
              </button>
            )}
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${n.is_read ? "bg-card border-border opacity-70" : "bg-card border-primary/30 shadow-sm"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.status === "present" ? "bg-green-100" : "bg-red-100"}`}>
                        {n.status === "present" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_date).toLocaleDateString()}</p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}