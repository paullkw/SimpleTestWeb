import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import CreateTestForm from "./create-test-form";

export default async function CreateTestPage() {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#fdba74_0%,transparent_35%),linear-gradient(160deg,#fff7ed_0%,#fffbeb_55%,#ffffff_100%)] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-orange-200/80 bg-white/85 p-6 shadow-[0_26px_90px_rgba(120,53,15,0.14)] backdrop-blur-sm sm:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-orange-950">Create Test</h1>
          <p className="mt-1 text-sm text-orange-900/80">
            Fill in the details and add questions below.
          </p>
        </header>

        <CreateTestForm />
      </div>
    </main>
  );
}
