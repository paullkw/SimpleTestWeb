import { redirect } from "next/navigation";
import AuthForm from "./auth-form";
import { getSessionFromCookies } from "@/lib/auth";

export default async function Home() {
  const session = await getSessionFromCookies();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#fed7aa_0%,transparent_30%),radial-gradient(circle_at_80%_10%,#fde68a_0%,transparent_32%),linear-gradient(160deg,#f9fafb_0%,#fff7ed_50%,#fffbeb_100%)] px-4 py-12 text-zinc-900">
      <main className="w-full max-w-md rounded-2xl border border-orange-200/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(120,53,15,0.18)] backdrop-blur-sm">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-orange-950">
          SimpleTest Login
        </h1>
        <AuthForm />
      </main>
    </div>
  );
}
