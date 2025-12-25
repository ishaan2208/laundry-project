import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <SignOutButton redirectUrl="/sign-in">
      <Button variant="ghost" className={className}>
        <LogOut className="h-4 w-4 mr-2" />
        <span className="text-sm">Sign out</span>
      </Button>
    </SignOutButton>
  );
}
