"use client";
import { AppShell } from "@/components/layout/AppShell";
import { CompletedView } from "@/components/completed/CompletedView";

export default function CompletedPage() {
  return (
    <AppShell>
      <CompletedView />
    </AppShell>
  );
}
