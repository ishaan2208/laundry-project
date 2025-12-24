"use client";

import * as React from "react";
import { getBootstrap } from "@/actions/ui/getBootstrap";

export function useBootstrap() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Awaited<
    ReturnType<typeof getBootstrap>
  > | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getBootstrap();
        if (!alive) return;
        setData(res);
        setError(null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load masters.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { loading, error, data };
}
