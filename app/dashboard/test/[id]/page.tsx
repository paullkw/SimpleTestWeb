import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import TestForm from "./test-form";

type Question = {
  text: string;
  options: string[];
  correctIndex?: number;
  correctIndexes?: number[];
};

type TestDocument = {
  _id: ObjectId;
  title: string;
  description?: string;
  questions?: Question[];
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

  const questions = test.questions ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#86efac_0%,transparent_30%),linear-gradient(160deg,#f0fdf4_0%,#ecfeff_55%,#ffffff_100%)] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-emerald-200/80 bg-white/85 p-6 shadow-[0_26px_90px_rgba(5,150,105,0.12)] backdrop-blur-sm sm:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-emerald-950">{test.title}</h1>
          <p className="mt-1 text-sm text-emerald-900/80">
            {test.description?.trim() || "Answer all questions and submit your test."}
          </p>
        </header>

        <TestForm
          title={test.title}
          questions={questions.map((question) => ({
            text: question.text,
            options: question.options,
            correctIndexes:
              question.correctIndexes && question.correctIndexes.length > 0
                ? question.correctIndexes
                : typeof question.correctIndex === "number"
                  ? [question.correctIndex]
                  : [0],
          }))}
        />
      </div>
    </main>
  );
}
