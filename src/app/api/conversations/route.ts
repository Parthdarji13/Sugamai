import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSessionUser } from '@/lib/auth';
import { getConversationsCollection, ConversationDocument } from '@/lib/dbCollections';

/**
 * GET /api/conversations
 * Returns the authenticated user's conversation list sorted by updatedAt descending.
 * Does not return full message bodies.
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const conversationsCollection = await getConversationsCollection();
    const userObjectId = new ObjectId(sessionUser.id);

    const conversations = await conversationsCollection
      .find({ userId: userObjectId })
      .sort({ updatedAt: -1 })
      .project({ _id: 1, title: 1, createdAt: 1, updatedAt: 1 })
      .toArray();

    const safeList = conversations.map((conv) => ({
      id: conv._id.toHexString(),
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return NextResponse.json(safeList);
  } catch (error) {
    console.error('Error fetching conversations:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * Creates a new conversation owned by the authenticated user.
 */
export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Optional body; fallback to empty object
    }

    const { title } = (body as { title?: string }) || {};
    const trimmedTitle = typeof title === 'string' && title.trim() !== ''
      ? title.trim().slice(0, 100)
      : 'New conversation';

    const now = new Date();
    const conversationsCollection = await getConversationsCollection();
    const userObjectId = new ObjectId(sessionUser.id);

    const newConversation: Omit<ConversationDocument, '_id'> = {
      userId: userObjectId,
      title: trimmedTitle,
      createdAt: now,
      updatedAt: now,
    };

    const result = await conversationsCollection.insertOne(newConversation as ConversationDocument);

    return NextResponse.json(
      {
        conversation: {
          id: result.insertedId.toHexString(),
          title: trimmedTitle,
          createdAt: now,
          updatedAt: now,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating conversation:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
