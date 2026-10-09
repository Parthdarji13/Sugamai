import { MongoClient, Db } from 'mongodb';
import dns from 'dns';

// Resolve MongoDB SRV records reliably across Windows and various ISP/hotspot networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Fallback if setServers is restricted
}

const DEFAULT_DB_NAME = 'sugamgov';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

/**
 * Safely resolves or initializes the MongoClient promise singleton.
 * Uses global cache in development to withstand Next.js Hot Module Replacement (HMR).
 * Automatically resets and retries if a cached connection attempt failed.
 */
async function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    throw new Error(
      'Invalid/Missing environment variable: "MONGODB_URI". Please set MONGODB_URI in your environment or .env.local'
    );
  }

  const cleanUri = uri.trim();

  if (process.env.NODE_ENV === 'development') {
    if (global._mongoClientPromise) {
      try {
        return await global._mongoClientPromise;
      } catch {
        // Cached promise was rejected (e.g. previous network error); clear and re-establish
        global._mongoClientPromise = undefined;
      }
    }

    const client = new MongoClient(cleanUri);
    const promise = client.connect().catch((err) => {
      global._mongoClientPromise = undefined;
      throw err;
    });
    global._mongoClientPromise = promise;
    return promise;
  }

  if (clientPromise) {
    try {
      return await clientPromise;
    } catch {
      clientPromise = null;
    }
  }

  const client = new MongoClient(cleanUri);
  const promise = client.connect().catch((err) => {
    clientPromise = null;
    throw err;
  });
  clientPromise = promise;
  return promise;
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
