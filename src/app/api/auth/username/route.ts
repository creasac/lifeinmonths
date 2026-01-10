import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const normalizedUsername = username.toLowerCase().trim();

    // Validate username
    if (normalizedUsername.length < 1 || normalizedUsername.length > 30) {
      return NextResponse.json(
        { error: "Username must be between 1 and 30 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    // Check if username is taken (by someone else)
    if (normalizedUsername !== user.username) {
      const existing = await db.query.users.findFirst({
        where: eq(users.username, normalizedUsername),
      });

      if (existing) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }

    // Update username
    const [updatedUser] = await db
      .update(users)
      .set({ username: normalizedUsername })
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
      },
    });
  } catch (error) {
    console.error("Username update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
