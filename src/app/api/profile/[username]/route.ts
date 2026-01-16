import { db } from "@/lib/db";
import { users, userLifeData } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const normalizedUsername = username.toLowerCase().trim();

    // Find user by username
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        dateOfBirth: users.dateOfBirth,
      })
      .from(users)
      .where(eq(users.username, normalizedUsername));

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's life data
    const [lifeData] = await db
      .select()
      .from(userLifeData)
      .where(eq(userLifeData.userId, user.id));

    return NextResponse.json({
      username: user.username,
      dateOfBirth: user.dateOfBirth,
      cellData: lifeData?.cellData ? JSON.parse(lifeData.cellData) : {},
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
