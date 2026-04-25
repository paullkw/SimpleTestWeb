import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type QuestionInput = {
  text?: string;
  options?: string[];
  correctIndex?: number;
};

type UpdateTestBody = {
  title?: string;
  description?: string;
  questionsCount?: number;
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
    const result = await db.collection("tests").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          description: body.description?.trim() ?? "",
          questionsCount: body.questionsCount ?? 0,
          questions: body.questions ?? [],
          updatedAt: new Date(),
        },
        $unset: {
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
