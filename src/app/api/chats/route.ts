import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import ChatSessionModel from '@/models/ChatSession';
import { encryptText, decryptText } from '@/lib/encryption';

// Helper to check user authentication
async function getAuthenticatedUserEmail() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return null;
  }
  return session.user.email.toLowerCase().trim();
}

// 1. GET /api/chats -> Fetch all user chats from MongoDB Atlas and decrypt payload
export async function GET() {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) {
      return NextResponse.json({ chats: [] });
    }

    await connectToDatabase();

    const dbSessions = await ChatSessionModel.find({ userEmail })
      .sort({ updatedAt: -1 })
      .lean();

    const chats = dbSessions.map((s: any) => ({
      id: s.sessionId,
      title: decryptText(s.title || 'New Conversation'),
      messages: (s.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: decryptText(m.content),
        createdAt: m.createdAt,
      })),
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ chats });
  } catch (error: any) {
    console.error('Error fetching chats from MongoDB:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch chats.' }, { status: 500 });
  }
}

// 2. POST /api/chats -> Encrypt and save / update a user chat session in MongoDB Atlas
export async function POST(req: Request) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, messages } = body;

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    await connectToDatabase();

    const encryptedTitle = encryptText(title || 'New Conversation');
    const encryptedMessages = (messages || []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: encryptText(m.content),
      createdAt: m.createdAt,
    }));

    const updatedSession = await ChatSessionModel.findOneAndUpdate(
      { sessionId: id, userEmail },
      {
        userEmail,
        sessionId: id,
        title: encryptedTitle,
        messages: encryptedMessages,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const decryptedMessages = (updatedSession.messages || []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: decryptText(m.content),
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      success: true,
      chat: {
        id: updatedSession.sessionId,
        title: decryptText(updatedSession.title),
        messages: decryptedMessages,
        createdAt: updatedSession.createdAt.toISOString(),
        updatedAt: updatedSession.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error saving chat session to MongoDB:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save chat.' }, { status: 500 });
  }
}

// 3. DELETE /api/chats?id=XYZ -> Delete a chat session from MongoDB Atlas
export async function DELETE(req: Request) {
  try {
    const userEmail = await getAuthenticatedUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    await connectToDatabase();

    await ChatSessionModel.deleteOne({ sessionId: id, userEmail });

    return NextResponse.json({ success: true, message: 'Chat deleted from MongoDB.' });
  } catch (error: any) {
    console.error('Error deleting chat from MongoDB:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete chat.' }, { status: 500 });
  }
}
