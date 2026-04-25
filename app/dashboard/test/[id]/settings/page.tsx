import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import SettingsForm from "./settings-form";

type TestDocument = {
  _id: ObjectId;
  title: string;
  consecutiveCorrectToInactivateQuestion?: number;
};

export default async function TestSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/");
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    notFound();
  }

  const db = await getDb();
  const test = await db
    .collection<TestDocument>("tests")
    .findOne({ _id: new ObjectId(id) }, { projection: { title: 1, consecutiveCorrectToInactivateQuestion: 1 } });

  if (!test) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#7dd3fc_0%,transparent_35%),linear-gradient(160deg,#f0f9ff_0%,#f8fafc_60%,#ffffff_100%)] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-sky-200/80 bg-white/85 p-6 shadow-[0_26px_90px_rgba(14,116,144,0.12)] backdrop-blur-sm sm:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-sky-950">Test Settings</h1>
          <p className="mt-1 text-sm text-sky-900/80">{test.title}</p>
        </header>

        <SettingsForm
          testId={id}
          initialConsecutiveCorrectToInactivateQuestion={
            test.consecutiveCorrectToInactivateQuestion ?? 0
          }
        />
      </div>
    </main>
  );
}
