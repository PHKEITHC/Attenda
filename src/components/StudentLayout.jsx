import { Link, useLocation, Outlet } from "react-router-dom";
import { BookOpen, Bell, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

export default function StudentLayout() {
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    loadUnread();
  }, []);

  const loadUnread = async () => {
    try {
      const me = await base44.auth.me();
      const notifs = await base44.entities.Notification.filter({ user_id: me.id, is_read: false });
      setUnread(notifs.length);
    } catch (e) {}
  };

  const navItems = [
    { path: "/student/classes", label: "My Classes", icon: BookOpen },
    { path: "/student/notifications", label: "Notifications", icon: Bell, badge: unread },
  ];

  const handleLogout = () => base44.auth.logout("/login");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground font-heading text-lg tracking-tight">AttendEase</span>
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">Student</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon, badge }) => (
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith(path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}