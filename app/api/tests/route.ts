import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type QuestionInput = {
  text?: string;
  options?: string[];
  correctIndex?: number;
};

type CreateTestBody = {
  title?: string;
  description?: string;
  questionsCount?: number;
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
    const result = await db.collection("tests").insertOne({
      title,
      description: body.description?.trim() ?? "",
      questionsCount: body.questionsCount ?? 0,
      questions: body.questions ?? [],
      createdBy: session.userId,
      createdAt: new Date(),
    });

    return NextResponse.json({ testId: result.insertedId.toString() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create test." }, { status: 500 });
  }
}
