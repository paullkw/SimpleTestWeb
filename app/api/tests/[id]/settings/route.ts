import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type UpdateSettingsBody = {
  consecutiveCorrectToInactivateQuestion?: number;
};

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/tests/[id]/settings">
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
    const body = (await request.json()) as UpdateSettingsBody;
    const value = Number(body.consecutiveCorrectToInactivateQuestion);

    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      return NextResponse.json(
        { error: "Consecutive Correct To Inactivate Question must be a non-negative integer." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("tests").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          consecutiveCorrectToInactivateQuestion: value,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
