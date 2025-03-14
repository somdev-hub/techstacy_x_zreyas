import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jose-auth";

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = parseInt((await params).id);
    
    // Get the access token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify token and check if the user is a SUPERADMIN
    try {
      const decoded = await verifyAccessToken(token);
      
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return NextResponse.json(
          { error: "Invalid token payload" },
          { status: 401 }
        );
      }
      
      if (decoded.role !== "SUPERADMIN") {
        return NextResponse.json(
          { error: "Only SUPERADMIN users can delete users" },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find the user to check if they exist
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Don't allow deleting the last SUPERADMIN user
    if (userToDelete.role === "SUPERADMIN") {
      // Check if this is the only SUPERADMIN
      const superAdminCount = await prisma.user.count({
        where: { role: "SUPERADMIN" }
      });
      
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last SUPERADMIN user" },
          { status: 403 }
        );
      }
    }

    // Use a transaction to properly clean up all related data
    await prisma.$transaction(async (tx) => {
      // Delete user-related data to avoid foreign key constraints

      // 1. Delete event participation records
      await tx.eventParticipant.deleteMany({
        where: { 
          OR: [
            { userId },
            { mainParticipant: { userId } }
          ]
        },
      });

      // 2. Delete event head assignments
      await tx.eventHead.deleteMany({
        where: { userId },
      });

      // 3. Delete notifications
      await tx.notification.deleteMany({
        where: { userId },
      });

      // 4. Delete refresh tokens
      await tx.refreshToken.deleteMany({
        where: { userId },
      });
      
      // 5. Delete event results
      await tx.eventResult.deleteMany({
        where: { userId },
      });

      // 6. Finally delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return NextResponse.json({ 
      success: true,
      message: "User deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}