import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | setup
  const [form, setForm] = useState({ email: "", password: "" });
  const [setupForm, setSetupForm] = useState({ email: "", password: "", confirm: "" });
  const [setupStep, setSetupStep] = useState("form"); // form | otp
  const [otp, setOtp] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(form.email, form.password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    }
    setLoading(false);
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (setupForm.password !== setupForm.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (setupForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: setupForm.email, password: setupForm.password });
      setSetupStep("otp");
      setInfo(`A verification code was sent to ${setupForm.email}`);
    } catch (err) {
      setError(err.message || "Setup failed. Your email may not be registered.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await base44.auth.verifyOtp({ email: setupForm.email, otpCode: otp });
      base44.auth.setToken(access_token);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    }
    setLoading(false);
  };

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setInfo("");
    setSetupStep("form");
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-heading">AttendEase</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" ? "Sign in to your account" : "First-time setup — create your password"}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchMode("setup")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "setup" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            First-time Setup
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5">{error}</p>}
                <div className="text-right">
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              </motion.form>
            ) : setupStep === "form" ? (
              <motion.form
                key="setup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSetupSubmit}
                className="space-y-4"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 mb-2">
                  Use this if your account was created by an admin and you haven't set a password yet.
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Your Email</label>
                  <input
                    type="email"
                    value={setupForm.email}
                    onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Create Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={setupForm.password}
                      onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                      placeholder="Min. 6 characters"
                      required
                      className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={setupForm.confirm}
                    onChange={(e) => setSetupForm({ ...setupForm, confirm: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {loading ? "Setting up…" : "Set Up Account"}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                {info && <p className="text-sm text-muted-foreground text-center bg-muted rounded-xl px-4 py-3">{info}</p>}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Verification Code</label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter code from email"
                    required
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-center tracking-widest text-lg"
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  {loading ? "Verifying…" : "Verify & Continue"}
                </button>
                <button type="button" onClick={() => base44.auth.resendOtp(setupForm.email)} className="w-full text-sm text-muted-foreground hover:text-foreground">
                  Resend code
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Access is by invitation only. Contact your administrator for an account.
        </p>
      </motion.div>
    </div>
  );
}