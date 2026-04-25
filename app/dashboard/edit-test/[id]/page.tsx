import { redirect, notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import EditTestForm from "./edit-test-form";

type QuestionDocument = {
  _id: ObjectId;
  text: string;
  options: string[];
  correctIndexes: number[];
  order: number;
};

type TestDocument = {
  _id: ObjectId;
  title: string;
  description?: string;
  questionIds?: ObjectId[];
};

export default async function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/");

  const { id } = await params;

  if (!ObjectId.isValid(id)) notFound();

  const db = await getDb();
  const test = await db.collection<TestDocument>("tests").findOne({ _id: new ObjectId(id) });

  if (!test) notFound();

  const questionIds = test.questionIds ?? [];
  let questionDocs: QuestionDocument[] = [];

  if (questionIds.length > 0) {
    questionDocs = await db
      .collection<QuestionDocument>("questions")
      .find({ _id: { $in: questionIds } })
      .toArray();
    questionDocs.sort((a, b) => a.order - b.order);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#fdba74_0%,transparent_35%),linear-gradient(160deg,#fff7ed_0%,#fffbeb_55%,#ffffff_100%)] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-orange-200/80 bg-white/85 p-6 shadow-[0_26px_90px_rgba(120,53,15,0.14)] backdrop-blur-sm sm:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-orange-950">Edit Test</h1>
          <p className="mt-1 text-sm text-orange-900/80">Update the details and questions below.</p>
        </header>

        <EditTestForm
          testId={id}
          initialTitle={test.title}
          initialDescription={test.description ?? ""}
          initialQuestions={questionDocs.map((q, i) => ({
            id: i,
            text: q.text,
            options: q.options,
            correctIndexes: q.correctIndexes,
          }))}
        />
      </div>
    </main>
  );
}
