// filepath: /c:/Users/ariel/OneDrive/Desktop/projects/techstacyXathlon/techstacy_x_zreyas/src/pages/api/getUserId.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  }

  return NextResponse.json({ userId });
}
