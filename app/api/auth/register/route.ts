import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
};

type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection<UserDocument>("users");

    await usersCollection.createIndex({ email: 1 }, { unique: true });

    const passwordHash = await bcrypt.hash(password, 12);
    const insertResult = await usersCollection.insertOne({
      name,
      email,
      passwordHash,
      createdAt: new Date(),
    });

    const token = createSessionToken({
      userId: insertResult.insertedId.toString(),
      email,
    });

    await setSessionCookie(token);

    return NextResponse.json(
      {
        user: {
          id: insertResult.insertedId.toString(),
          name,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const maybeMongoError = error as { code?: number };

    if (maybeMongoError?.code === 11000) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}
