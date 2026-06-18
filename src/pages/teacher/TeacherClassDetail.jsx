import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Upload, Users, ClipboardList, BarChart2, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AttendanceSessionTab from "@/components/teacher/AttendanceSessionTab";
import SessionHistoryTab from "@/components/teacher/SessionHistoryTab";
import StudentSummaryTab from "@/components/teacher/StudentSummaryTab";

export default function TeacherClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("attendance");
  const [copiedCode, setCopiedCode] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    const [classData, studentData] = await Promise.all([
      base44.entities.Class.filter({ id: classId }),
      base44.entities.Student.filter({ class_id: classId }),
    ]);
    setCls(classData[0] || null);
    setStudents(studentData);
    setLoading(false);
  };

  const copyCode = () => {
    if (!cls) return;
    navigator.clipboard.writeText(cls.class_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const nameIdx = headers.findIndex((h) => h.includes("name"));
      const idIdx = headers.findIndex((h) => h.includes("id") || h.includes("student"));

      if (nameIdx === -1 || idIdx === -1) {
        setUploadError("CSV must have columns: name, student_id (or id)");
        setUploading(false);
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const name = cols[nameIdx];
        const sid = cols[idIdx];
        if (!name || !sid) continue;
        rows.push({ name, sid });
      }

      // Validate each student_id exists in StudentAccount
      const notFound = [];
      const records = [];
      for (const { name, sid } of rows) {
        const alreadyInClass = students.find((s) => s.student_id === sid);
        if (alreadyInClass) continue;
        const acct = await base44.entities.StudentAccount.filter({ student_uid: sid });
        if (acct.length === 0) {
          notFound.push(sid);
        } else {
          records.push({ class_id: classId, student_id: sid, full_name: acct[0].full_name || name, email: acct[0].email || "" });
        }
      }

      if (notFound.length > 0) {
        setUploadError(`❌ Student IDs not found in database: ${notFound.join(", ")}`);
        setUploading(false);
        return;
      }

      if (records.length > 0) {
        const created = await base44.entities.Student.bulkCreate(records);
        setStudents((prev) => [...prev, ...created]);
      }
      setShowUpload(false);
    } catch (err) {
      setUploadError("Failed to parse CSV. Please check the format.");
    }
    setUploading(false);
  };

  const tabs = [
    { id: "attendance", label: "Take Attendance", icon: ClipboardList },
    { id: "history", label: "Session History", icon: BarChart2 },
    { id: "summary", label: "Student Summary", icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!cls) {
    return <div className="text-center py-20 text-muted-foreground">Class not found.</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => navigate("/teacher/classes")}
          className="mt-1 p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold font-heading text-foreground">{cls.name}</h1>
          {cls.subject && <p className="text-muted-foreground text-sm">{cls.subject}</p>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-1.5">
              <span className="text-xs text-muted-foreground">Class Code:</span>
              <span className="font-mono font-bold text-primary text-sm tracking-widest">{cls.class_code}</span>
              <button onClick={copyCode} className="ml-1 text-muted-foreground hover:text-primary transition-colors">
                {copiedCode ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{students.length} students</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex-shrink-0"
        >
          <Upload className="w-4 h-4" /> Upload CSV
        </button>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
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
                <h2 className="text-lg font-bold font-heading">Upload Roster CSV</h2>
                <button onClick={() => { setShowUpload(false); setUploadError(""); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-muted rounded-xl p-4 mb-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Expected CSV format:</p>
                <code className="block text-xs bg-background rounded-lg p-2 mt-1 font-mono">
                  name,student_id<br />
                  John Smith,S001<br />
                  Jane Doe,S002
                </code>
                <p className="mt-2 text-xs">⚠️ Student IDs must exist in the student database. Unrecognized IDs will be rejected.</p>
              </div>
              {uploadError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5 mb-4">{uploadError}</p>
              )}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 transition-colors">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Click to select CSV file</span>
                    <span className="text-xs text-muted-foreground mt-1">or drag and drop</span>
                  </>
                )}
                <input type="file" accept=".csv" className="hidden" onChange={handleCSV} disabled={uploading} />
              </label>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "attendance" && (
        <AttendanceSessionTab classId={classId} students={students} />
      )}
      {activeTab === "history" && (
        <SessionHistoryTab classId={classId} />
      )}
      {activeTab === "summary" && (
        <StudentSummaryTab classId={classId} students={students} />
      )}
    </div>
  );
}