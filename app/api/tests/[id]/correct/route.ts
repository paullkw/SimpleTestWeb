import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type CorrectBody = {
  questionId?: string;
};

type TestDocument = {
  consecutiveCorrectToInactivateQuestion?: number;
};

type QuestionDocument = {
  _id: ObjectId;
  testId: ObjectId;
  active?: boolean;
  consecutiveCorrectCount?: number;
};

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/tests/[id]/correct">
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await ctx.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid test ID." }, { status: 400 });
  }

  const body = (await request.json()) as CorrectBody;
  const { questionId } = body;

  if (!questionId || !ObjectId.isValid(questionId)) {
    return NextResponse.json({ error: "Invalid questionId." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const testObjectId = new ObjectId(id);
    const questionObjectId = new ObjectId(questionId);

    const test = await db
      .collection<TestDocument>("tests")
      .findOne({ _id: testObjectId }, { projection: { consecutiveCorrectToInactivateQuestion: 1 } });

    if (!test) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    const thresholdRaw = Number(test.consecutiveCorrectToInactivateQuestion ?? 0);
    const threshold = Number.isFinite(thresholdRaw) ? Math.max(0, Math.floor(thresholdRaw)) : 0;

    const updatedQuestion = await db.collection<QuestionDocument>("questions").findOneAndUpdate(
      { _id: questionObjectId, testId: testObjectId, active: { $ne: false } },
      { $inc: { consecutiveCorrectCount: 1 } },
      { returnDocument: "after" }
    );

    if (!updatedQuestion) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const consecutiveCorrectCount = updatedQuestion.consecutiveCorrectCount ?? 0;
    let deactivated = false;

    if (threshold > 0 && consecutiveCorrectCount >= threshold) {
      const deactivateResult = await db.collection("questions").updateOne(
        { _id: questionObjectId, testId: testObjectId, active: { $ne: false } },
        { $set: { active: false, consecutiveCorrectCount: 0 } }
      );
      deactivated = deactivateResult.modifiedCount > 0;
    }

    return NextResponse.json({ ok: true, deactivated });
  } catch {
    return NextResponse.json({ error: "Failed to update correct count." }, { status: 500 });
  }
}
