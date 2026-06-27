"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "var(--accent)" }}
          >
            R³
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              RPM³
            </p>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              Outcome Operating System
            </p>
          </div>
        </div>

        {sent ? (
          /* Success state */
          <div
            className="p-6 rounded-2xl border text-center"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-400" />
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
              Check your email
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-4 text-xs"
              style={{ color: "var(--text-dim)" }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* Login form */
          <div>
            <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--text)" }}>
              Sign in
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Enter your email — we&apos;ll send a magic link. No password needed.
            </p>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-dim)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoFocus
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {loading ? "Sending…" : (
                  <>
                    Send magic link
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-2 mt-8 p-3 rounded-xl" style={{ background: "var(--surface)" }}>
              <Sparkles size={13} style={{ color: "var(--accent)" }} />
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                Your data syncs across all your devices automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
