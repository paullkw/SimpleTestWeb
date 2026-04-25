import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = "simpletest";

if (!uri) {
  throw new Error("Please define MONGODB_URI in your environment variables.");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);

const clientPromise =
  process.env.NODE_ENV === "development"
    ? (global._mongoClientPromise ??= client.connect())
    : client.connect();

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
