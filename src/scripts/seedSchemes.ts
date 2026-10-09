import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { GovernmentScheme } from '../types/scheme';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'sugamgov';

export async function seedGovernmentSchemes() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not set in .env.local');
    return;
  }
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const collection = db.collection<GovernmentScheme>('government_schemes');
    await collection.createIndex(
      {
        schemeName: 'text',
        schemeShortTitle: 'text',
        schemeCategory: 'text',
        benefits: 'text',
        eligibilityCriteria: 'text',
        nodalMinistry: 'text'
      },
      { name: 'idx_government_schemes_text' }
    );
  } finally {
    await client.close();
  }
}
