import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Upload, Trash2, LogOut, ShieldCheck, RefreshCw, GraduationCap, BookOpen, Heart } from "lucide-react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";


const TABS = [
  { id: "teacher", label: "Teachers", icon: BookOpen, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  { id: "student", label: "Students", icon: GraduationCap, color: "text-green-700", bg: "bg-green-50 border-green-200" },
  { id: "parent", label: "Parents", icon: Heart, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
];

const ENTITY_MAP = {
  teacher: { entity: "TeacherAccount", uidField: "teacher_uid", required: ["teacher_uid"] },
  student: { entity: "StudentAccount", uidField: "student_uid", required: ["student_uid"] },
  parent: { entity: "ParentAccount", uidField: "parent_uid", required: ["parent_uid"] },
};

const FIELD_LABELS = {
  teacher: ["teacher_uid (ID)", "email (optional)", "full_name (optional)"],
  student: ["student_uid (ID)", "email (optional)", "full_name (optional)"],
  parent: ["parent_uid (ID)", "linked_student_email (optional)", "email (optional)", "full_name (optional)"],
};

function parseRows(data, role) {
  const { uidField, required } = ENTITY_MAP[role];
  const records = [];
  const errors = [];

  data.forEach((row, i) => {
    // normalize keys: lowercase, trim whitespace, collapse spaces to underscore, remove parentheses and special chars
    const normalized = {};
    Object.keys(row).forEach((k) => {
      const normKey = k.trim().toLowerCase().replace(/\(.*?\)/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "");
      normalized[normKey] = String(row[k] ?? "").trim();
    });

    // map uid field — handle "teacher_uid_id" → "teacher_uid", "student_uid_id" → "student_uid", "parent_uid_id" → "parent_uid"
    const uidNorm = uidField; // e.g. "teacher_uid"
    const uid = normalized[uidNorm] || normalized[uidNorm + "_id"] || normalized["id"] || normalized["uid"] || "";
    const email = normalized["email"] || normalized["email_optional"] || "";
    const full_name = normalized["full_name"] || normalized["full_name_optional"] || normalized["name"] || "";
    const linked_student_email = normalized["linked_student_email"] || normalized["student_email"] || "";

    const record = { [uidField]: uid, email, full_name, linked_student_email, is_active: true };

    // validate required
    const missing = required.filter((f) => !record[f]);
    if (missing.length > 0) {
      errors.push(`Row ${i + 2}: missing ${missing.join(", ")}`);
      return;
    }
    records.push(record);
  });

  return { records, errors };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("teacher");
  const [accounts, setAccounts] = useState({ teacher: [], student: [], parent: [] });
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [teachers, students, parents] = await Promise.all([
      base44.entities.TeacherAccount.list("-created_date"),
      base44.entities.StudentAccount.list("-created_date"),
      base44.entities.ParentAccount.list("-created_date"),
    ]);
    setAccounts({ teacher: teachers, student: students, parent: parents });
    setLoading(false);
  };

  const parseFile = async (file) => {
    // CSV parsing
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.trim().split("\n").filter((l) => l.trim());
          const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, "").toLowerCase());
          const rows = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
            const row = {};
            headers.forEach((h, idx) => { row[h] = cols[idx] || ""; });
            rows.push(row);
          }
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportStatus("Parsing file…");
    try {
      const data = await parseFile(file);
      if (data.length === 0) {
        setImportStatus("❌ File is empty or unreadable.");
        setImporting(false);
        return;
      }

      const { records, errors } = parseRows(data, activeTab);

      if (records.length === 0) {
        setImportStatus(`❌ No valid records found. ${errors[0] || ""}`);
        setImporting(false);
        return;
      }

      const entityName = ENTITY_MAP[activeTab].entity;
      await base44.entities[entityName].bulkCreate(records);

      const errMsg = errors.length > 0 ? ` (${errors.length} rows skipped)` : "";
      setImportStatus(`✅ ${records.length} ${activeTab} accounts imported.${errMsg}`);
      loadAll();
    } catch (err) {
      setImportStatus("❌ Failed to parse file.");
      console.error(err);
    }
    setImporting(false);
    e.target.value = "";
  };

  const toggleActive = async (role, acct) => {
    const entityName = ENTITY_MAP[role].entity;
    await base44.entities[entityName].update(acct.id, { is_active: !acct.is_active });
    setAccounts((prev) => ({
      ...prev,
      [role]: prev[role].map((u) => u.id === acct.id ? { ...u, is_active: !u.is_active } : u),
    }));
  };

  const deleteAccount = async (role, id) => {
    const entityName = ENTITY_MAP[role].entity;
    await base44.entities[entityName].delete(id);
    setAccounts((prev) => ({ ...prev, [role]: prev[role].filter((u) => u.id !== id) }));
  };

  const tab = TABS.find((t) => t.id === activeTab);
  const list = accounts[activeTab] || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-bold text-lg font-heading">AttendEase Admin</span>
          </div>
          <button onClick={() => base44.auth.logout("/login")} className="flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {TABS.map(({ id, label, bg, color }) => (
            <div key={id} className={`rounded-2xl border p-5 text-center ${bg}`}>
              <p className={`text-3xl font-bold font-heading ${color}`}>{accounts[id].length}</p>
              <p className={`text-sm font-medium mt-0.5 ${color}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Role Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setImportStatus(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Import Section */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold font-heading text-base mb-1 flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" /> Import {tab.label} via CSV
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Required columns: {FIELD_LABELS[activeTab].map((f) => (
              <code key={f} className="bg-muted px-1.5 py-0.5 rounded text-xs mx-0.5">{f}</code>
            ))}
          </p>
          <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition-all ${importing ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
            {importing
              ? <><span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> Importing…</>
              : <><Upload className="w-4 h-4" /> Upload File</>}
            <input type="file" accept=".csv" className="hidden" onChange={handleUpload} disabled={importing} />
          </label>
          {importStatus && <p className="mt-3 text-sm font-medium">{importStatus}</p>}
        </div>

        {/* Account List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> {tab.label} ({list.length})
            </h2>
            <button onClick={loadAll} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No {activeTab} accounts yet. Import a file to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {list.map((u, i) => {
                const uid = u.teacher_uid || u.student_uid || u.parent_uid || "—";
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex items-center gap-4 px-6 py-4 ${!u.is_active ? "opacity-50" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email || "—"}</p>
                      <p className="text-xs text-muted-foreground">ID: {uid}</p>
                      {u.linked_student_email && <p className="text-xs text-muted-foreground">Child: {u.linked_student_email}</p>}
                    </div>
                    <button
                      onClick={() => toggleActive(activeTab, u)}
                      className={`text-xs px-3 py-1 rounded-lg border font-medium transition-colors ${u.is_active ? "border-border text-muted-foreground hover:bg-muted" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                    >
                      {u.is_active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => deleteAccount(activeTab, u.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}