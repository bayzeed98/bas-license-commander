import { NextResponse } from "next/server";
import { getAdminCredentials, updateAdminCredentials } from "@/lib/db";

function isAuthorized(req) {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("admin_token")?.value;
  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  if (!token) return false;
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return decoded.role === "admin";
  } catch {
    return false;
  }
}

// GET: Fetch current admin username
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const creds = await getAdminCredentials();
  return NextResponse.json({
    status: "success",
    username: creds.username,
  });
}

// PUT: Change admin username and/or password
export async function PUT(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const currentPassword = (body.currentPassword || "").trim();
    const newUsername = (body.newUsername || "").trim();
    const newPassword = (body.newPassword || "").trim();

    if (!currentPassword) {
      return NextResponse.json(
        { status: "error", message: "Current password is required to make security changes." },
        { status: 400 }
      );
    }

    if (!newUsername || !newPassword) {
      return NextResponse.json(
        { status: "error", message: "New username and new password are required." },
        { status: 400 }
      );
    }

    const creds = await getAdminCredentials();

    if (currentPassword !== creds.password) {
      return NextResponse.json(
        { status: "error", message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    await updateAdminCredentials(newUsername, newPassword);

    // Issue updated token
    const token = Buffer.from(
      JSON.stringify({
        role: "admin",
        username: newUsername,
        authenticatedAt: Date.now(),
      })
    ).toString("base64");

    const response = NextResponse.json({
      status: "success",
      message: "Admin credentials updated successfully and saved to Google Cloud!",
      username: newUsername,
      token,
    });

    response.cookies.set("admin_token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
