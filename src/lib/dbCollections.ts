import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from './db';

/* ══════════════════════════════════════════════════════════
   DATABASE DOCUMENT SCHEMAS (Phase 5 Foundation)
   ══════════════════════════════════════════════════════════ */

export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferencesDocument {
  _id: ObjectId;
  userId: ObjectId;
  language: 'en' | 'hi' | 'gu';
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDocument {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageDocument {
  _id: ObjectId;
  conversationId: ObjectId;
  sender: 'user' | 'assistant';
  text: string;
  sourceName?: string;
  sourceUrl?: string;
  retrievalMethod?: string;
  isSupported?: boolean;
  serviceId?: string;
  createdAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION CONSTANTS
   ══════════════════════════════════════════════════════════ */

export const DB_COLLECTIONS = {
  USERS: 'users',
  USER_PREFERENCES: 'user_preferences',
  CONVERSATIONS: 'conversations',
  CHAT_MESSAGES: 'chat_messages',
} as const;

/* ══════════════════════════════════════════════════════════
   TYPE-SAFE COLLECTION ACCESSORS
   ══════════════════════════════════════════════════════════ */

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDatabase();
  return db.collection<UserDocument>(DB_COLLECTIONS.USERS);
}

export async function getUserPreferencesCollection(): Promise<Collection<UserPreferencesDocument>> {
  const db = await getDatabase();
  return db.collection<UserPreferencesDocument>(DB_COLLECTIONS.USER_PREFERENCES);
}

export async function getConversationsCollection(): Promise<Collection<ConversationDocument>> {
  const db = await getDatabase();
  return db.collection<ConversationDocument>(DB_COLLECTIONS.CONVERSATIONS);
}

export async function getChatMessagesCollection(): Promise<Collection<ChatMessageDocument>> {
  const db = await getDatabase();
  return db.collection<ChatMessageDocument>(DB_COLLECTIONS.CHAT_MESSAGES);
}
