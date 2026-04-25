import { redirect } from "next/navigation";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import LogoutButton from "./logout-button";

type TestDocument = {
  _id: ObjectId;
  title: string;
  description?: string;
  questionsCount?: number;
};

export default async function DashboardPage() {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/");
  }

  const db = await getDb();
  const testsCollection = db.collection<TestDocument>("tests");

  const tests = await testsCollection
    .find({}, { projection: { title: 1, description: 1, questionsCount: 1 } })
    .sort({ title: 1 })
    .toArray();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#fdba74_0%,transparent_35%),linear-gradient(160deg,#fff7ed_0%,#fffbeb_55%,#ffffff_100%)] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-orange-200/80 bg-white/85 p-6 shadow-[0_26px_90px_rgba(120,53,15,0.14)] backdrop-blur-sm sm:p-8">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-orange-950">Dashboard</h1>
            <p className="text-sm text-orange-900/80">
              Signed in as <span className="font-medium">{session.email}</span>
            </p>
          </div>
          <LogoutButton />
        </header>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">All Available Tests</h2>
            <Link
              href="/dashboard/create-test"
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
            >
              + Create Test
            </Link>
          </div>

          {tests.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No tests available yet. Add documents to the &quot;tests&quot; collection in MongoDB database &quot;simpletest&quot;.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {tests.map((test) => (
                <li
                  key={test._id.toString()}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-zinc-900">{test.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    {test.description?.trim() || "No description provided."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-700">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1">
                      Questions: {test.questionsCount ?? "N/A"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/test/${test._id.toString()}`}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                    >
                      Test
                    </Link>
                    <Link
                      href={`/dashboard/edit-test/${test._id.toString()}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
