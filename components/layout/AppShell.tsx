"use client";
import { useState } from "react";
import Link from "next/link";
import { useRPMStore } from "@/lib/store";
import { Sidebar } from "./Sidebar";
import { AISidebar } from "../ai/AISidebar";
import { Menu, Zap } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useRPMStore((s) => s.sidebarOpen);
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Desktop sidebar (hidden on mobile) ─────────────────────────── */}
      <div className="hidden md:flex md:flex-col md:w-56 md:shrink-0">
        <Sidebar onClose={() => {}} />
      </div>

      {/* ── Mobile nav drawer + backdrop ───────────────────────────────── */}
      {navOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setNavOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col md:hidden transition-transform duration-200 ease-in-out ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <Sidebar onClose={() => setNavOpen(false)} />
      </div>

      {/* ── Main content area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header
          className="flex md:hidden items-center gap-3 px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg)" }}
        >
          <button
            onClick={() => setNavOpen(true)}
            className="p-2 rounded-lg -ml-1"
            style={{ color: "var(--text-muted)" }}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--accent)" }}
            >
              R³
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              RPM³
            </span>
          </Link>

          <div className="flex-1" />

          {/* Quick Focus 3 link */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <Zap size={12} style={{ color: "var(--A)" }} />
            Focus 3
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {sidebarOpen && <AISidebar />}
    </div>
  );
}
