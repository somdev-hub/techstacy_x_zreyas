import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    console.log("Testing basic JWT functionality");

    // Test with multiple secrets to find what works
    const secrets = [
      { name: "JWT_ACCESS_SECRET", value: process.env.JWT_ACCESS_SECRET },
      { name: "JWT_REFRESH_SECRET", value: process.env.JWT_REFRESH_SECRET },
      { name: "Hardcoded string", value: "test_secret" }
    ];

    const payload = { test: "data" };
    const results = [];

    for (const secret of secrets) {
      try {
        if (!secret.value) {
          results.push({
            name: secret.name,
            success: false,
            error: "Secret not available"
          });
          continue;
        }

        const token = jwt.sign(payload, secret.value);
        const decoded = jwt.verify(token, secret.value);

        results.push({
          name: secret.name,
          success: true,
          token: token.substring(0, 10) + "...", // Just show beginning
          decoded
        });
      } catch (error) {
        results.push({
          name: secret.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      message: "JWT Test Results",
      results,
      nodeVersion: process.version,
      jwtVersion: require("jsonwebtoken/package.json").version
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Test failed",
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
