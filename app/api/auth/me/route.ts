import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

type UserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
};

export async function GET() {
  try {
    const session = await getSessionFromCookies();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const db = await getDb();
    const usersCollection = db.collection<UserDocument>("users");

    const user = await usersCollection.findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { name: 1, email: 1 } }
    );

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
