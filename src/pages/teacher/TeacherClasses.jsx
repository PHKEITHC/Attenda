import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, BookOpen, Users, Copy, Check, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function TeacherClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [me, setMe] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const user = await base44.auth.me();
    setMe(user);
    const data = await base44.entities.Class.filter({ teacher_id: user.id });
    setClasses(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    const cls = await base44.entities.Class.create({
      name: form.name.trim(),
      subject: form.subject.trim(),
      description: form.description.trim(),
      class_code: generateCode(),
      teacher_id: me.id,
    });
    setClasses((prev) => [cls, ...prev]);
    setForm({ name: "", subject: "", description: "" });
    setShowCreate(false);
    setCreating(false);
  };

  const copyCode = (cls) => {
    navigator.clipboard.writeText(cls.class_code);
    setCopiedId(cls.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this class? This cannot be undone.")) return;
    await base44.entities.Class.delete(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">My Classes</h1>
          <p className="text-muted-foreground text-sm mt-1">{classes.length} class{classes.length !== 1 ? "es" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Class
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
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
                <h2 className="text-lg font-bold font-heading">Create New Class</h2>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Class Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Mathematics 101"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Subject</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.name.trim() || creating}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40"
                >
                  {creating ? "Creating…" : "Create Class"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold font-heading mb-1">No classes yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Create your first class to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Create Class
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `hsl(${(i * 47) % 360}, 60%, 90%)` }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: `hsl(${(i * 47) % 360}, 60%, 35%)` }} />
                </div>
                <button
                  onClick={() => handleDelete(cls.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-foreground font-heading text-base mb-0.5">{cls.name}</h3>
              {cls.subject && <p className="text-xs text-muted-foreground mb-3">{cls.subject}</p>}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Class Code</p>
                  <p className="font-mono font-bold text-primary tracking-widest text-sm">{cls.class_code}</p>
                </div>
                <button
                  onClick={() => copyCode(cls)}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-muted hover:bg-accent transition-colors"
                >
                  {copiedId === cls.id ? (
                    <><Check className="w-3.5 h-3.5 text-green-600" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </button>
              </div>

              <button
                onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                className="w-full mt-3 py-2 rounded-xl bg-primary/8 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
              >
                Open Class
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}