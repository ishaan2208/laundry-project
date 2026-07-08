import { cookies } from "next/headers";
import BottomNav from "@/components/mobile/BottomNav";
import { PropertyProvider } from "@/components/PropertyProvider";
import { Toaster } from "sonner";
import { requireUser, isAdmin } from "@/lib/auth";
import { PROPERTY_COOKIE } from "@/lib/propertyPref";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const jar = await cookies();
  const rememberedPropertyId = jar.get(PROPERTY_COOKIE)?.value;

  return (
    <div className="min-h-dvh bg-background">
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: { borderRadius: "16px" },
        }}
      />
      <PropertyProvider initialPropertyId={rememberedPropertyId}>
        <main>{children}</main>
        <BottomNav isAdmin={isAdmin(user)} />
      </PropertyProvider>
    </div>
  );
}
