import { MongoClient, Db } from 'mongodb';

const DEFAULT_DB_NAME = 'sugamgov';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

/**
 * Safely resolves or initializes the MongoClient promise singleton.
 * Uses global cache in development to withstand Next.js Hot Module Replacement (HMR).
 */
function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    throw new Error(
      'Invalid/Missing environment variable: "MONGODB_URI". Please set MONGODB_URI in your environment or .env.local'
    );
  }

  const cleanUri = uri.trim();

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(cleanUri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    const client = new MongoClient(cleanUri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

/**
 * Returns the connected MongoClient singleton promise.
 */
export async function getMongoClient(): Promise<MongoClient> {
  return getClientPromise();
}

/**
 * Returns the connected MongoDB database instance.
 * Defaults to 'sugamgov' unless explicitly specified or configured via MONGODB_DB.
 */
export async function getDatabase(dbName?: string): Promise<Db> {
  const client = await getMongoClient();
  const targetDbName = dbName || process.env.MONGODB_DB || DEFAULT_DB_NAME;
  return client.db(targetDbName);
}

/**
 * Internal health check utility to verify MongoDB connectivity without exposing credentials.
 */
export async function checkDbConnection(): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    return { ok: true, message: 'Database connection verified successfully' };
  } catch (err) {
    const errorMsg = (err as Error).message || 'Unknown database connection error';
    return { ok: false, error: errorMsg };
  }
}
