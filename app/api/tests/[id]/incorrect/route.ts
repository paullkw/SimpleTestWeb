import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type IncorrectBody = {
  questionId?: string;
};

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/tests/[id]/incorrect">
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await ctx.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid test ID." }, { status: 400 });
  }

  const body = (await request.json()) as IncorrectBody;
  const { questionId } = body;

  if (!questionId || !ObjectId.isValid(questionId)) {
    return NextResponse.json({ error: "Invalid questionId." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const result = await db.collection("questions").updateOne(
      { _id: new ObjectId(questionId), testId: new ObjectId(id) },
      {
        $inc: { incorrectCount: 1 },
        $set: { consecutiveCorrectCount: 0 },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update incorrect count." }, { status: 500 });
  }
}
