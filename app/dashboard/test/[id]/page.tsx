import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import TestForm from "./test-form";

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
  description?: string;
  questionIds?: ObjectId[];
};

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/");
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    notFound();
  }

  const db = await getDb();
  const test = await db.collection<TestDocument>("tests").findOne({ _id: new ObjectId(id) });

  if (!test) {
    notFound();
  }

  const questionIds = test.questionIds ?? [];
  let questions: QuestionDocument[] = [];

  if (questionIds.length > 0) {
    questions = await db
      .collection<QuestionDocument>("questions")
      .find({ _id: { $in: questionIds } })
      .toArray();
    // Sort by original order
    questions.sort((a, b) => a.order - b.order);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#86efac_0%,transparent_30%),linear-gradient(160deg,#f0fdf4_0%,#ecfeff_55%,#ffffff_100%)] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-emerald-200/80 bg-white/85 p-6 shadow-[0_26px_90px_rgba(5,150,105,0.12)] backdrop-blur-sm sm:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-emerald-950">{test.title}</h1>
          {test.description?.trim() ? (
            <p className="mt-1 text-sm text-emerald-900/80">{test.description.trim()}</p>
          ) : null}
        </header>

        <TestForm
          testId={id}
          title={test.title}
          questions={questions.map((q) => ({
            questionId: q._id.toString(),
            text: q.text,
            options: q.options,
            incorrectCount: q.incorrectCount ?? 0,
            correctIndexes: q.correctIndexes,
          }))}
        />
      </div>
    </main>
  );
}
