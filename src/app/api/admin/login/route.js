import { NextResponse } from "next/server";
import { getAdminCredentials } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const username = (body.username || "").trim();
    const password = (body.password || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { status: "error", message: "Username and password are required." },
        { status: 400 }
      );
    }

    const creds = await getAdminCredentials();

    if (username !== creds.username || password !== creds.password) {
      return NextResponse.json(
        { status: "error", message: "Invalid administrator username or password." },
        { status: 401 }
      );
    }

    // Generate secure token for dashboard session
    const token = Buffer.from(
      JSON.stringify({
        role: "admin",
        username: creds.username,
        authenticatedAt: Date.now(),
      })
    ).toString("base64");

    const response = NextResponse.json({
      status: "success",
      message: "Admin authentication successful",
      token,
      username: creds.username,
    });

    response.cookies.set("admin_token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: "Invalid request payload" },
      { status: 400 }
    );
  }
}
