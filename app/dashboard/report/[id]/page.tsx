import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type QuestionDocument = {
  _id: ObjectId;
  text: string;
  options: string[];
  correctIndexes: number[];
  incorrectCount?: number;
  order: number;
};

type TestDocument = {
  _id: ObjectId;
  title: string;
  questionIds?: ObjectId[];
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/");

  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  const db = await getDb();
  const test = await db.collection<TestDocument>("tests").findOne({ _id: new ObjectId(id) });
  if (!test) notFound();

  const questionIds = test.questionIds ?? [];
  let questions: QuestionDocument[] = [];

  if (questionIds.length > 0) {
    questions = await db
      .collection<QuestionDocument>("questions")
      .find({ _id: { $in: questionIds } })
      .toArray();
    // Sort by incorrectCount descending, then original order as tiebreaker
    questions.sort((a, b) => {
      const diff = (b.incorrectCount ?? 0) - (a.incorrectCount ?? 0);
      return diff !== 0 ? diff : a.order - b.order;
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#fca5a5_0%,transparent_30%),linear-gradient(160deg,#fff1f2_0%,#fff7ed_55%,#ffffff_100%)] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-red-200/80 bg-white/85 p-6 shadow-[0_26px_90px_rgba(185,28,28,0.10)] backdrop-blur-sm sm:p-8">
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-red-700 transition hover:text-red-900"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-red-950">{test.title}</h1>
          <p className="mt-1 text-sm text-red-900/70">Incorrect Answer Report</p>
        </header>

        {questions.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This test has no questions yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {questions.map((question, rank) => {
              const count = question.incorrectCount ?? 0;
              return (
                <li
                  key={question._id.toString()}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <div className="shrink-0 text-sm font-semibold text-zinc-900">
                        #{rank + 1}.
                      </div>
                      <div className="whitespace-pre-line break-words text-sm font-semibold text-zinc-900">
                        {question.text}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        count > 0
                          ? "bg-red-200 text-red-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {count > 0 ? `${count} incorrect` : "No mistakes"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
