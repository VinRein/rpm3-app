"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRPMStore } from "@/lib/store";
import clsx from "clsx";
import {
  LayoutDashboard,
  Zap,
  Bot,
  Archive,
  ChevronRight,
  X,
} from "lucide-react";

const NAV = [
  { href: "/plan", label: "Dashboard", icon: LayoutDashboard },
  { href: "/", label: "Today's Focus 3", icon: Zap },
];

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { results, activeResultId, setActiveResult, setSidebarOpen, sidebarOpen } =
    useRPMStore();

  const activeResults = results.filter((r) => !r.archived);

  const handleNav = () => onClose();

  return (
    <aside
      className="flex flex-col h-full w-full overflow-y-auto"
      style={{ background: "var(--surface)" }}
    >
      {/* Logo + mobile close button */}
      <div
        className="px-4 pt-5 pb-4 border-b flex items-start justify-between"
        style={{ borderColor: "var(--border)" }}
      >
        <Link href="/" onClick={handleNav} className="flex items-center gap-2 w-fit">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "var(--accent)" }}
          >
            R³
          </div>
          <div>
            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              RPM³
            </span>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              Outcome Operating System
            </p>
          </div>
        </Link>
        {/* Close button — only visible on mobile (md:hidden) */}
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded-lg -mt-1 -mr-1"
          style={{ color: "var(--text-dim)" }}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="px-2 pt-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNav}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                active
                  ? "bg-[var(--accent-glow)] text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Results list */}
      <div className="px-2 pt-4 flex-1">
        <div className="flex items-center justify-between px-2 mb-2">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-dim)" }}
          >
            Results
          </span>
          <Link
            href="/plan"
            onClick={handleNav}
            className="text-xs px-1.5 py-0.5 rounded hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: "var(--text-dim)" }}
          >
            + New
          </Link>
        </div>

        <div className="space-y-0.5">
          {activeResults.map((r) => (
            <Link
              key={r.id}
              href={`/result/${r.id}`}
              onClick={() => { setActiveResult(r.id); handleNav(); }}
              className={clsx(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm group transition-all duration-150 cursor-pointer",
                activeResultId === r.id
                  ? "bg-[var(--surface-2)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: r.color ?? "var(--accent)" }}
              />
              <span className="truncate flex-1 text-sm">{r.title}</span>
              <ChevronRight
                size={12}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          ))}

          {activeResults.length === 0 && (
            <p className="px-3 py-3 text-sm" style={{ color: "var(--text-dim)" }}>
              No results yet. Create your first outcome above.
            </p>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div
        className="px-2 pb-5 pt-2 space-y-0.5 border-t mt-2"
        style={{ borderColor: "var(--border)" }}
      >
        <Link
          href="/archive"
          onClick={handleNav}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all"
        >
          <Archive size={15} />
          Archive
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={clsx(
            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all",
            sidebarOpen
              ? "bg-[var(--accent-glow)] text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
          )}
        >
          <Bot size={15} />
          AI Assistant
        </button>
      </div>
    </aside>
  );
}
