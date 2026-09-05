import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please fill in all fields (Name, Email, Password).' },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this Email already exists. Please Sign In.' },
        { status: 400 }
      );
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    const userImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`;

    // Create user document in MongoDB Atlas
    const newUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      image: userImage,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully in MongoDB Atlas!',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in MongoDB signup API route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create account in database.' },
      { status: 500 }
    );
  }
}
