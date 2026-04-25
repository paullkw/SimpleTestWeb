import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import CloneTestForm from "./clone-test-form";

type TestDocument = {
  _id: ObjectId;
  title: string;
  description?: string;
  questionIds?: ObjectId[];
};

type QuestionDocument = {
  _id: ObjectId;
  text: string;
  options: string[];
  correctIndexes: number[];
  active?: boolean;
  incorrectCount?: number;
  order: number;
};

function formatCloneTitle(title: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${title} ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default async function CloneTestPage({ params }: { params: Promise<{ id: string }> }) {
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

    questions.sort((a, b) => {
      const diff = (b.incorrectCount ?? 0) - (a.incorrectCount ?? 0);
      return diff !== 0 ? diff : a.order - b.order;
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#c4b5fd_0%,transparent_35%),linear-gradient(160deg,#faf5ff_0%,#fdf4ff_55%,#ffffff_100%)] px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-violet-200/80 bg-white/85 p-6 shadow-[0_26px_90px_rgba(109,40,217,0.12)] backdrop-blur-sm sm:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-violet-950">Clone Test</h1>
          <p className="mt-1 text-sm text-violet-900/80">
            Choose which questions to copy into a new test.
          </p>
        </header>

        <CloneTestForm
          initialTitle={formatCloneTitle(test.title)}
          initialDescription={test.description ?? ""}
          initialQuestions={questions.map((question) => ({
            id: question._id.toString(),
            text: question.text,
            options: question.options,
            correctIndexes: question.correctIndexes,
            active: question.active ?? true,
            incorrectCount: question.incorrectCount ?? 0,
            selected: true,
          }))}
        />
      </div>
    </main>
  );
}
