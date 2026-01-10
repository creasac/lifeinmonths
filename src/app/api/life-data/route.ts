import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userLifeData } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const [lifeData] = await db
      .select()
      .from(userLifeData)
      .where(eq(userLifeData.userId, user.id));

    return NextResponse.json({
      dateOfBirth: user.dateOfBirth,
      messages: user.messages ? JSON.parse(user.messages) : [],
      cellData: lifeData?.cellData ? JSON.parse(lifeData.cellData) : {},
    });
  } catch (error) {
    console.error("Get life data error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { dateOfBirth, messages, cellData } = await request.json();

    // Update user profile
    const updateData: Record<string, unknown> = {
      dateOfBirth: dateOfBirth ?? user.dateOfBirth,
    };
    
    if (messages !== undefined) {
      updateData.messages = JSON.stringify(messages);
    }
    
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id));

    // Update or insert life data
    if (cellData !== undefined) {
      const [existingData] = await db
        .select()
        .from(userLifeData)
        .where(eq(userLifeData.userId, user.id));

      if (existingData) {
        await db
          .update(userLifeData)
          .set({
            cellData: JSON.stringify(cellData),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userLifeData.userId, user.id));
      } else {
        await db.insert(userLifeData).values({
          userId: user.id,
          cellData: JSON.stringify(cellData),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update life data error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
