import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password, dateOfBirth } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be between 3 and 20 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username: username.toLowerCase(),
        passwordHash,
        dateOfBirth: dateOfBirth || null,
      })
      .returning();

    const sessionId = await createSession(newUser.id);

    const response = NextResponse.json({
      user: {
        id: newUser.id,
        username: newUser.username,
      },
    });

    response.cookies.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    // Handle duplicate username error (works with both SQLite and Turso/libsql)
    // Check both the error itself and any nested cause for constraint violations
    const errorString = String(error);
    const causeString = error && typeof error === 'object' && 'cause' in error ? String(error.cause) : '';
    const fullErrorText = errorString + causeString;
    
    if (
      fullErrorText.includes("UNIQUE constraint failed") ||
      fullErrorText.includes("SQLITE_CONSTRAINT") ||
      fullErrorText.includes("unique constraint") ||
      fullErrorText.includes("already exists")
    ) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
