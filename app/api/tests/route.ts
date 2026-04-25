import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type QuestionInput = {
  text?: string;
  options?: string[];
  correctIndexes?: number[];
  active?: boolean;
};

type CreateTestBody = {
  title?: string;
  description?: string;
  questions?: QuestionInput[];
};

export async function POST(request: Request) {
  const session = await getSessionFromCookies();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateTestBody;
    const title = body.title?.trim() ?? "";

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const db = await getDb();
    const testId = new ObjectId();

    const questionsInput = body.questions ?? [];
    let questionIds: ObjectId[] = [];

    if (questionsInput.length > 0) {
      const questionDocs = questionsInput.map((q, order) => ({
        testId,
        text: q.text ?? "",
        options: q.options ?? [],
        correctIndexes: q.correctIndexes ?? [],
        active: q.active ?? true,
        incorrectCount: 0,
        order,
      }));

      const insertResult = await db.collection("questions").insertMany(questionDocs);
      questionIds = Object.values(insertResult.insertedIds) as ObjectId[];
    }

    await db.collection("tests").insertOne({
      _id: testId,
      title,
      description: body.description?.trim() ?? "",
      questionIds,
      createdBy: session.userId,
      createdAt: new Date(),
    });

    return NextResponse.json({ testId: testId.toString() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create test." }, { status: 500 });
  }
}
