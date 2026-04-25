import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type QuestionInput = {
  text?: string;
  options?: string[];
  correctIndexes?: number[];
};

type UpdateTestBody = {
  title?: string;
  description?: string;
  questions?: QuestionInput[];
};

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/tests/[id]">
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await ctx.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid test ID." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as UpdateTestBody;
    const title = body.title?.trim() ?? "";

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const db = await getDb();
    const testObjectId = new ObjectId(id);

    // Replace all questions for this test
    await db.collection("questions").deleteMany({ testId: testObjectId });

    const questionsInput = body.questions ?? [];
    let questionIds: ObjectId[] = [];

    if (questionsInput.length > 0) {
      const questionDocs = questionsInput.map((q, order) => ({
        testId: testObjectId,
        text: q.text ?? "",
        options: q.options ?? [],
        correctIndexes: q.correctIndexes ?? [],
        incorrectCount: 0,
        order,
      }));

      const insertResult = await db.collection("questions").insertMany(questionDocs);
      questionIds = Object.values(insertResult.insertedIds) as ObjectId[];
    }

    const result = await db.collection("tests").updateOne(
      { _id: testObjectId },
      {
        $set: {
          title,
          description: body.description?.trim() ?? "",
          questionIds,
          updatedAt: new Date(),
        },
        $unset: {
          questions: "",
          questionsCount: "",
          durationMinutes: "",
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update test." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/tests/[id]">
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await ctx.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid test ID." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const testObjectId = new ObjectId(id);

    await db.collection("questions").deleteMany({ testId: testObjectId });
    const result = await db.collection("tests").deleteOne({ _id: testObjectId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete test." }, { status: 500 });
  }
}
