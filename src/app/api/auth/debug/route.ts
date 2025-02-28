import { NextResponse } from "next/server";
import { checkEnvironmentVariables } from "@/lib/debug-env";

export async function GET() {
  try {
    const envStatus = checkEnvironmentVariables();

    // Test JWT directly
    const jwt = require("jsonwebtoken");
    const testPayload = { test: "payload" };

    let jwtTest = { success: false, error: null };

    try {
      // Try to sign with access secret
      if (process.env.JWT_ACCESS_SECRET) {
        const token = jwt.sign(testPayload, process.env.JWT_ACCESS_SECRET);
        jwtTest.success = true;
      } else {
        jwtTest.error = "JWT_ACCESS_SECRET not available";
      }
    } catch (error) {
      jwtTest.error = error instanceof Error ? error.message : String(error);
    }

    return NextResponse.json({
      message: "Debug information",
      envChecks: {
        JWT_ACCESS_SECRET: !!process.env.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: !!process.env.JWT_REFRESH_SECRET
      },
      jwtTest,
      nodeVersion: process.version
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Debug error",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
