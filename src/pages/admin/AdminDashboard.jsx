import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Upload, Trash2, Plus, LogOut, ShieldCheck, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const ROLE_COLORS = {
  teacher: "bg-blue-100 text-blue-700",
  student: "bg-green-100 text-green-700",
  parent: "bg-purple-100 text-purple-700",
};

export default function AdminDashboard() {
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvStatus, setCsvStatus] = useState("");
  const [importing, setImporting] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await base44.entities.AllowedUser.list("-created_date");
    setAllowedUsers(data);
    setLoading(false);
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setCsvStatus("Parsing CSV...");
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

      const emailIdx = headers.indexOf("email");
      const roleIdx = headers.indexOf("role");
      const nameIdx = headers.indexOf("full_name");
      const studentIdIdx = headers.indexOf("student_id");
      const linkedEmailIdx = headers.indexOf("linked_student_email");

      if (emailIdx === -1 || roleIdx === -1) {
        setCsvStatus("❌ CSV must have 'email' and 'role' columns.");
        setImporting(false);
        return;
      }

      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
        const email = cols[emailIdx];
        const role = cols[roleIdx]?.toLowerCase();
        if (!email || !["teacher", "student", "parent"].includes(role)) continue;
        records.push({
          email,
          role,
          full_name: nameIdx !== -1 ? cols[nameIdx] : "",
          student_id: studentIdIdx !== -1 ? cols[studentIdIdx] : "",
          linked_student_email: linkedEmailIdx !== -1 ? cols[linkedEmailIdx] : "",
          is_active: true,
        });
      }

      if (records.length === 0) {
        setCsvStatus("❌ No valid records found.");
        setImporting(false);
        return;
      }

      await base44.entities.AllowedUser.bulkCreate(records);
      setCsvStatus(`✅ ${records.length} accounts created.`);
      loadUsers();
    } catch (err) {
      setCsvStatus("❌ Failed to import CSV.");
      console.error(err);
    }
    setImporting(false);
    e.target.value = "";
  };

  const toggleActive = async (user) => {
    await base44.entities.AllowedUser.update(user.id, { is_active: !user.is_active });
    setAllowedUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
  };

  const deleteUser = async (id) => {
    await base44.entities.AllowedUser.delete(id);
    setAllowedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleLogout = () => base44.auth.logout("/login");

  const filtered = filter === "all" ? allowedUsers : allowedUsers.filter((u) => u.role === filter);
  const counts = { teacher: 0, student: 0, parent: 0 };
  allowedUsers.forEach((u) => { if (counts[u.role] !== undefined) counts[u.role]++; });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-bold text-lg font-heading">AttendEase Admin</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Teachers", count: counts.teacher, color: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Students", count: counts.student, color: "bg-green-50 border-green-200 text-green-700" },
            { label: "Parents", count: counts.parent, color: "bg-purple-50 border-purple-200 text-purple-700" },
          ].map(({ label, count, color }) => (
            <div key={label} className={`rounded-2xl border p-5 text-center ${color}`}>
              <p className="text-3xl font-bold font-heading">{count}</p>
              <p className="text-sm font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Import CSV */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="font-semibold font-heading text-lg mb-1 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> Import Accounts via CSV
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            CSV columns: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">email</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">role</code> (teacher/student/parent), <code className="bg-muted px-1.5 py-0.5 rounded text-xs">full_name</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">student_id</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs">linked_student_email</code> (for parents)
          </p>
          <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition-all ${importing ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
            {importing ? <><span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Upload CSV</>}
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={importing} />
          </label>
          {csvStatus && <p className="mt-3 text-sm font-medium">{csvStatus}</p>}
        </div>

        {/* User List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Allowed Accounts ({allowedUsers.length})
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={loadUsers} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="teacher">Teachers</option>
                <option value="student">Students</option>
                <option value="parent">Parents</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No accounts yet. Import a CSV to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-4 px-6 py-4 ${!u.is_active ? "opacity-50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{u.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {u.student_id && <p className="text-xs text-muted-foreground">ID: {u.student_id}</p>}
                    {u.linked_student_email && <p className="text-xs text-muted-foreground">Child: {u.linked_student_email}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                  <button
                    onClick={() => toggleActive(u)}
                    className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${u.is_active ? "border-border text-muted-foreground hover:bg-muted" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                  >
                    {u.is_active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => deleteUser(u.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}