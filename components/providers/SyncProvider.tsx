"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRPMStore } from "@/lib/store";

const DEBOUNCE_MS = 2000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const hydrateStore = useRPMStore((s) => s.hydrateStore);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialised = useRef(false);

  // ── Load from Supabase on mount ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_data")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[sync] load error:", error.message);
        return;
      }

      if (data?.data) {
        // Supabase has data — use it as source of truth
        hydrateStore(data.data);
      } else {
        // First login — upload current localStorage data to Supabase
        const state = useRPMStore.getState();
        await supabase.from("user_data").upsert({
          user_id: user.id,
          data: {
            results: state.results,
            focus3History: state.focus3History,
            purposeLibrary: state.purposeLibrary,
          },
          updated_at: new Date().toISOString(),
        });
      }

      initialised.current = true;
    };

    load();
  }, [hydrateStore]);

  // ── Save to Supabase on every store change (debounced) ───────────────────
  useEffect(() => {
    const unsub = useRPMStore.subscribe((state, prev) => {
      // Only save after initial load to avoid overwriting Supabase with stale localStorage
      if (!initialised.current) return;

      const changed =
        state.results !== prev.results ||
        state.focus3History !== prev.focus3History ||
        state.purposeLibrary !== prev.purposeLibrary;

      if (!changed) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("user_data").upsert({
          user_id: user.id,
          data: {
            results: state.results,
            focus3History: state.focus3History,
            purposeLibrary: state.purposeLibrary,
          },
          updated_at: new Date().toISOString(),
        });
      }, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return <>{children}</>;
}
