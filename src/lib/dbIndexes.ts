import {
  getUsersCollection,
  getUserPreferencesCollection,
  getConversationsCollection,
  getChatMessagesCollection,
} from './dbCollections';

export interface IndexInitReport {
  collection: string;
  indexName: string;
  status: 'verified' | 'failed';
  error?: string;
}

/**
 * Safely and idempotently creates or verifies all required MongoDB indexes.
 *
 * Rules:
 * - Completely non-destructive (no drops, no deletions, no data modifications).
 * - Safe to run repeatedly without creating duplicates or throwing duplicate key errors.
 */
export async function initializeDatabaseIndexes(): Promise<IndexInitReport[]> {
  const report: IndexInitReport[] = [];

  // 1. users: { email: 1 } unique
  try {
    const users = await getUsersCollection();
    const indexName = await users.createIndex(
      { email: 1 },
      { unique: true, name: 'idx_users_email_unique' }
    );
    report.push({ collection: 'users', indexName, status: 'verified' });
  } catch (err) {
    report.push({
      collection: 'users',
      indexName: 'idx_users_email_unique',
      status: 'failed',
      error: (err as Error).message,
    });
  }

  // 2. user_preferences: { userId: 1 } unique
  try {
    const prefs = await getUserPreferencesCollection();
    const indexName = await prefs.createIndex(
      { userId: 1 },
      { unique: true, name: 'idx_user_preferences_userId_unique' }
    );
    report.push({ collection: 'user_preferences', indexName, status: 'verified' });
  } catch (err) {
    report.push({
      collection: 'user_preferences',
      indexName: 'idx_user_preferences_userId_unique',
      status: 'failed',
      error: (err as Error).message,
    });
  }

  // 3. conversations: { userId: 1, updatedAt: -1 }
  try {
    const conversations = await getConversationsCollection();
    const indexName = await conversations.createIndex(
      { userId: 1, updatedAt: -1 },
      { name: 'idx_conversations_userId_updatedAt' }
    );
    report.push({ collection: 'conversations', indexName, status: 'verified' });
  } catch (err) {
    report.push({
      collection: 'conversations',
      indexName: 'idx_conversations_userId_updatedAt',
      status: 'failed',
      error: (err as Error).message,
    });
  }

  // 4. chat_messages: { conversationId: 1, createdAt: 1 }
  try {
    const chatMessages = await getChatMessagesCollection();
    const indexName = await chatMessages.createIndex(
      { conversationId: 1, createdAt: 1 },
      { name: 'idx_chat_messages_conversationId_createdAt' }
    );
    report.push({ collection: 'chat_messages', indexName, status: 'verified' });
  } catch (err) {
    report.push({
      collection: 'chat_messages',
      indexName: 'idx_chat_messages_conversationId_createdAt',
      status: 'failed',
      error: (err as Error).message,
    });
  }

  return report;
}
