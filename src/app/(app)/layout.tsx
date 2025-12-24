// src/app/(app)/layout.tsx
import BottomNav from "@/components/mobile/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <main className=" pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
