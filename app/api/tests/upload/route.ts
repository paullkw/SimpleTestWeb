import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import * as XLSX from "xlsx";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type ParsedQuestion = {
  text: string;
  options: string[];
  correctIndexes: number[];
};

function parseYesNoFlag(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "y" || normalized === "yes" || normalized === "true" || normalized === "1";
}

function fileNameWithoutExtension(fileName: string) {
  const trimmed = fileName.trim();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0) {
    return trimmed;
  }
  return trimmed.slice(0, lastDot).trim();
}

function parseQuestionsFromWorksheet(sheet: XLSX.WorkSheet): ParsedQuestion[] {
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
  });

  if (rows.length <= 1) {
    return [];
  }

  const questions: ParsedQuestion[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex] ?? [];
    const questionText = String(row[0] ?? "").trim();

    if (!questionText) {
      continue;
    }

    const options: string[] = [];
    const correctIndexes: number[] = [];

    for (let col = 1; col < row.length; col += 2) {
      const optionText = String(row[col] ?? "").trim();
      const answerFlag = row[col + 1];

      if (!optionText) {
        continue;
      }

      const optionIndex = options.length;
      options.push(optionText);

      if (parseYesNoFlag(answerFlag)) {
        correctIndexes.push(optionIndex);
      }
    }

    if (options.length === 0 || correctIndexes.length === 0) {
      continue;
    }

    questions.push({
      text: questionText,
      options,
      correctIndexes,
    });
  }

  return questions;
}

export async function POST(request: Request) {
  const session = await getSessionFromCookies();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const title = fileNameWithoutExtension(file.name);
    if (!title) {
      return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(fileBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json({ error: "Template has no worksheet." }, { status: 400 });
    }

    const firstSheet = workbook.Sheets[firstSheetName];
    const parsedQuestions = parseQuestionsFromWorksheet(firstSheet);

    if (parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions found in template. Ensure each row has question text, options, and at least one Y answer." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const testId = new ObjectId();

    const questionDocs = parsedQuestions.map((question, order) => ({
      testId,
      text: question.text,
      options: question.options,
      correctIndexes: question.correctIndexes,
      active: true,
      incorrectCount: 0,
      consecutiveCorrectCount: 0,
      order,
    }));

    const insertResult = await db.collection("questions").insertMany(questionDocs);
    const questionIds = Object.values(insertResult.insertedIds) as ObjectId[];

    await db.collection("tests").insertOne({
      _id: testId,
      title,
      description: "",
      consecutiveCorrectToInactivateQuestion: 3,
      questionIds,
      createdBy: session.userId,
      createdAt: new Date(),
    });

    return NextResponse.json({ testId: testId.toString() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to upload test." }, { status: 500 });
  }
}
