import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type QuestionInput = {
  questionId?: string;
  text?: string;
  options?: string[];
  correctIndexes?: number[];
  active?: boolean;
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

    const questionsInput = body.questions ?? [];
    const existingQuestionIds = new Set(
      (
        await db
          .collection<{ _id: ObjectId }>("questions")
          .find({ testId: testObjectId }, { projection: { _id: 1 } })
          .toArray()
      ).map((q) => q._id.toString())
    );

    const usedExistingQuestionIds = new Set<string>();
    const questionIds: ObjectId[] = [];
    const updateOperations: Array<{
      updateOne: {
        filter: { _id: ObjectId; testId: ObjectId };
        update: {
          $set: {
            text: string;
            options: string[];
            correctIndexes: number[];
            active: boolean;
            order: number;
          };
        };
      };
    }> = [];
    const insertDocs: Array<{
      _id: ObjectId;
      testId: ObjectId;
      text: string;
      options: string[];
      correctIndexes: number[];
      active: boolean;
      incorrectCount: number;
      order: number;
    }> = [];

    for (let order = 0; order < questionsInput.length; order++) {
      const q = questionsInput[order];
      const incomingQuestionId = q.questionId;

      if (incomingQuestionId && ObjectId.isValid(incomingQuestionId)) {
        const questionObjectId = new ObjectId(incomingQuestionId);
        const questionIdString = questionObjectId.toString();

        if (
          existingQuestionIds.has(questionIdString) &&
          !usedExistingQuestionIds.has(questionIdString)
        ) {
          usedExistingQuestionIds.add(questionIdString);
          questionIds.push(questionObjectId);
          updateOperations.push({
            updateOne: {
              filter: { _id: questionObjectId, testId: testObjectId },
              update: {
                $set: {
                  text: q.text ?? "",
                  options: q.options ?? [],
                  correctIndexes: q.correctIndexes ?? [],
                  active: q.active ?? true,
                  order,
                },
              },
            },
          });
          continue;
        }
      }

      const newQuestionId = new ObjectId();
      questionIds.push(newQuestionId);
      insertDocs.push({
        _id: newQuestionId,
        testId: testObjectId,
        text: q.text ?? "",
        options: q.options ?? [],
        correctIndexes: q.correctIndexes ?? [],
        active: q.active ?? true,
        incorrectCount: 0,
        order,
      });
    }

    if (updateOperations.length > 0) {
      await db.collection("questions").bulkWrite(updateOperations);
    }

    if (insertDocs.length > 0) {
      await db.collection("questions").insertMany(insertDocs);
    }

    if (questionIds.length > 0) {
      await db.collection("questions").deleteMany({
        testId: testObjectId,
        _id: { $nin: questionIds },
      });
    } else {
      await db.collection("questions").deleteMany({ testId: testObjectId });
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
