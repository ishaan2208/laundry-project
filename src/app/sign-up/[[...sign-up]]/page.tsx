// src/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-svh flex items-center justify-center  bg-white p-6">
      <SignUp
        appearance={{
          elements: {
            card: "shadow-none border border-border bg-background",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton:
              "border-border bg-background hover:bg-accent",
            formButtonPrimary:
              "bg-primary text-primary-foreground hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/90",
          },
        }}
      />
    </div>
  );
}
