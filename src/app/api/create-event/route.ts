import { NextRequest, NextResponse } from "next/server";

// Redirect to the standardized /api/events endpoint
export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL('/api/events', req.url), 308); // 308 Permanent Redirect
}
