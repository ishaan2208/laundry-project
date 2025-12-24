"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader(props: {
  title: string;
  right?: React.ReactNode;
  className?: string;
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <div
      className={cn(
        "sticky top-0 z-20 border-b bg-background/80 backdrop-blur",
        props.className
      )}
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-2 px-3 py-3">
        {props.back !== false && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold">{props.title}</div>
        </div>
        {props.right}
      </div>
    </div>
  );
}
