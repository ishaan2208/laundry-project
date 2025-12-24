"use client";

import * as React from "react";
import { toast } from "sonner";

type Ok = { ok: true; message?: string };
type Err = { ok: false; message: string };

export function newIdempotencyKey() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function useSubmitAction<TInput, TRes extends Ok | Err>(
  action: (input: TInput) => Promise<TRes>,
  opts?: {
    successTitle?: string;
    errorTitle?: string;
  }
) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const busyRef = React.useRef(false);

  const submit = React.useCallback(
    async (input: TInput) => {
      if (busyRef.current) return null;
      busyRef.current = true;
      setIsSubmitting(true);

      try {
        const res = await action(input);
        if (res?.ok)
          toast.success(opts?.successTitle ?? "Saved", {
            description: res.message,
          });
        else
          toast.error(opts?.errorTitle ?? "Failed", {
            description: (res as any)?.message,
          });
        return res as TRes;
      } catch (e: any) {
        toast.error(opts?.errorTitle ?? "Failed", {
          description: e?.message ?? "Something went wrong.",
        });
        return null;
      } finally {
        busyRef.current = false;
        setIsSubmitting(false);
      }
    },
    [action, opts?.errorTitle, opts?.successTitle]
  );

  return { isSubmitting, submit };
}
