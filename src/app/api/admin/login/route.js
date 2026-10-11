import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { password } = await req.json();
    const correctPassword = process.env.ADMIN_PASSWORD || "admin1234";

    if (!password || password !== correctPassword) {
      return NextResponse.json(
        { status: "error", message: "Incorrect Administrator password." },
        { status: 401 }
      );
    }

    // Generate a simple secure token for dashboard session
    const token = Buffer.from(
      JSON.stringify({
        role: "admin",
        authenticatedAt: Date.now(),
      })
    ).toString("base64");

    const response = NextResponse.json({
      status: "success",
      message: "Admin authentication successful",
      token,
    });

    response.cookies.set("admin_token", token, {
      httpOnly: false, // Accessible to client for easy state sync
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
