import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSessionUser } from '@/lib/auth';
import { getConversationsCollection, getChatMessagesCollection } from '@/lib/dbCollections';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/conversations/[id]
 * Retrieves conversation metadata and full message history chronologically.
 * Strictly verifies ownership against authenticated session user.
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    const convObjectId = new ObjectId(id);
    const userObjectId = new ObjectId(sessionUser.id);

    const conversationsCollection = await getConversationsCollection();
    const conversation = await conversationsCollection.findOne({
      _id: convObjectId,
      userId: userObjectId,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const chatMessagesCollection = await getChatMessagesCollection();
    const rawMessages = await chatMessagesCollection
      .find({ conversationId: convObjectId })
      .sort({ createdAt: 1 })
      .toArray();

    const safeMessages = rawMessages.map((msg) => ({
      id: msg._id.toHexString(),
      conversationId: msg.conversationId.toHexString(),
      sender: msg.sender,
      text: msg.text,
      sourceName: msg.sourceName,
      sourceUrl: msg.sourceUrl,
      retrievalMethod: msg.retrievalMethod,
      isSupported: msg.isSupported,
      serviceId: msg.serviceId,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({
      conversation: {
        id: conversation._id.toHexString(),
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: safeMessages,
    });
  } catch (error) {
    console.error('Error fetching conversation thread:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[id]
 * Deletes a conversation and cascades to all child chat messages.
 * Strictly verifies ownership against authenticated session user.
 */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    const convObjectId = new ObjectId(id);
    const userObjectId = new ObjectId(sessionUser.id);

    const conversationsCollection = await getConversationsCollection();
    const conversation = await conversationsCollection.findOne({
      _id: convObjectId,
      userId: userObjectId,
    });

    if (!conversation) {
      // Return 404 to avoid leaking existence of another user's conversation
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 1. Delete all child messages
    const chatMessagesCollection = await getChatMessagesCollection();
    await chatMessagesCollection.deleteMany({ conversationId: convObjectId });

    // 2. Delete the conversation document itself
    await conversationsCollection.deleteOne({ _id: convObjectId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation thread:', (error as Error).message);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
