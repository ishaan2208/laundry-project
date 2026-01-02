import BottomNav from "@/components/mobile/BottomNav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      {/* Floating theme switcher (thumb reachable + doesn't fight BottomNav) */}
      <div className="pointer-events-none fixed right-3 top-3 z-50">
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>

      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
