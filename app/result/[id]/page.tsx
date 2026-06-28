"use client";
import { use, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ResultView } from "@/components/result/ResultView";

function ResultPageInner({ id }: { id: string }) {
  return (
    <AppShell>
      <ResultView resultId={id} />
    </AppShell>
  );
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <ResultPageInner id={id} />
    </Suspense>
  );
}
