import { NextResponse } from "next/server";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserByUsername,
} from "@/lib/db";

// Helper to verify admin auth header or cookie
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

// GET: List all licenses
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const users = await getAllUsers();
  const today = new Date().toISOString().split("T")[0];

  const enriched = users.map((u) => {
    let statusText = "Active";
    if (!u.isActive) statusText = "Disabled";
    else if (u.expiresAt && today > u.expiresAt) statusText = "Expired";

    return {
      ...u,
      status: statusText,
      isExpired: Boolean(u.expiresAt && today > u.expiresAt),
      hasHwidBound: Boolean(u.hwid && u.hwid.trim() !== ""),
    };
  });

  return NextResponse.json({ status: "success", users: enriched });
}

// POST: Create a new license
export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { username, password, clientName, expiresAt, allowMultiDevice } = body;

    if (!username || !password) {
      return NextResponse.json(
        { status: "error", message: "Username and password are required" },
        { status: 400 }
      );
    }

    const existing = await getUserByUsername(username);
    if (existing) {
      return NextResponse.json(
        { status: "error", message: "A license with this username already exists." },
        { status: 409 }
      );
    }

    const created = await createUser({
      username,
      password,
      clientName: clientName || username,
      expiresAt: expiresAt || "",
      allowMultiDevice: Boolean(allowMultiDevice),
      isActive: true,
    });

    return NextResponse.json({
      status: "success",
      message: "License created successfully",
      user: created,
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

// PUT: Update license (toggle active, reset HWID, change expiry, etc.)
export async function PUT(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, resetHwid, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { status: "error", message: "User ID is required" },
        { status: 400 }
      );
    }

    if (resetHwid) {
      updates.hwid = ""; // Unbind device
    }

    const ok = await updateUser(id, updates);
    if (!ok) {
      return NextResponse.json(
        { status: "error", message: "User not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: resetHwid
        ? "HWID reset successfully! The next device will bind automatically."
        : "License updated successfully.",
    });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a license
export async function DELETE(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ status: "error", message: "Missing id parameter" }, { status: 400 });
  }

  const ok = await deleteUser(id);
  if (!ok) {
    return NextResponse.json({ status: "error", message: "License not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: "success",
    message: "License deleted successfully",
  });
}
