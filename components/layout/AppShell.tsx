"use client";
import { useRPMStore } from "@/lib/store";
import { Sidebar } from "./Sidebar";
import { AISidebar } from "../ai/AISidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useRPMStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      {sidebarOpen && <AISidebar />}
    </div>
  );
}
