import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
  Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const quickActions = [
  { icon: Truck, label: "Send to laundry", hint: "Ready to use → At the laundry" },
  { icon: RotateCcw, label: "Receive from laundry", hint: "At the laundry → Ready to use" },
  { icon: Store, label: "New stock added", hint: "Add fresh linen to the book" },
  { icon: Ban, label: "Thrown away / lost", hint: "Damaged → Discarded" },
];

export default function ZenLanding() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-10 pt-8">
        {/* Brand */}
        <header className="flex items-center gap-3 animate-fade-in">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">Zenvana</div>
            <div className="text-sm text-muted-foreground">Laundry</div>
          </div>
        </header>

        {/* Hero */}
        <main className="mt-10 flex flex-1 flex-col gap-6">
          <div className="animate-fade-up space-y-3">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">
              Track linen like money.
            </h1>
            <p className="text-base text-muted-foreground">
              Every send, receive, wash, and discard is recorded. Know how
              much linen you have, and how much is with the laundry — right
              now.
            </p>
          </div>

          <div
            className="animate-fade-up flex flex-col gap-2.5"
            style={{ animationDelay: "60ms" }}
          >
            <Button asChild size="xl" className="w-full">
              <Link href="/sign-up">
                Get started
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>

          {/* What this app tracks */}
          <section
            className="animate-fade-up mt-2 space-y-2.5"
            style={{ animationDelay: "120ms" }}
            aria-label="What this app tracks"
          >
            {quickActions.map((a) => (
              <div
                key={a.label}
                className="surface flex items-center gap-3 rounded-2xl px-4 py-3"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <a.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">
                    {a.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {a.hint}
                  </span>
                </span>
              </div>
            ))}
          </section>

          <p
            className="animate-fade-up flex items-center gap-2 text-sm text-muted-foreground"
            style={{ animationDelay: "160ms" }}
          >
            <ShieldCheck className="size-4 shrink-0" />
            Nothing is ever overwritten — corrections are always on record.
          </p>
        </main>

        <footer className="pt-6 text-center text-xs text-muted-foreground">
          Zenvana Laundry
        </footer>
      </div>
    </div>
  );
}
