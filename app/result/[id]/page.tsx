"use client";
import { use } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ResultView } from "@/components/result/ResultView";

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AppShell>
      <ResultView resultId={id} />
    </AppShell>
  );
}
