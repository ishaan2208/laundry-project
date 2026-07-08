import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import ZenLanding from "@/components/landing/ZenLanding";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/app");
  }

  return <ZenLanding />;
}
