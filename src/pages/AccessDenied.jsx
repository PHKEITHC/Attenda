import { ShieldOff, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold font-heading mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          Your account has not been granted access to this application. Please contact your administrator.
        </p>
        <button
          onClick={() => base44.auth.logout("/login")}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}