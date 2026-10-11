import { NextResponse } from "next/server";
import { getAllApps, createApp, deleteApp } from "@/lib/db";

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

const unauthorized = () =>
  NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });

// GET: list registered apps
export async function GET(req) {
  if (!isAuthorized(req)) return unauthorized();
  const apps = await getAllApps();
  return NextResponse.json({ status: "success", apps });
}

// POST: register a new app
export async function POST(req) {
  if (!isAuthorized(req)) return unauthorized();

  try {
    const { name, description } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json(
        { status: "error", message: "App name is required" },
        { status: 400 }
      );
    }

    const result = await createApp({ name, description });
    if (result.duplicate) {
      return NextResponse.json(
        { status: "error", message: "An app with this name already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json({ status: "success", message: "App created", app: result.app });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to create app" },
      { status: 500 }
    );
  }
}

// DELETE: remove a registered app (?id=...)
export async function DELETE(req) {
  if (!isAuthorized(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ status: "error", message: "Missing id parameter" }, { status: 400 });
  }

  const ok = await deleteApp(id);
  if (!ok) {
    return NextResponse.json({ status: "error", message: "App not found" }, { status: 404 });
  }
  return NextResponse.json({ status: "success", message: "App deleted" });
}
