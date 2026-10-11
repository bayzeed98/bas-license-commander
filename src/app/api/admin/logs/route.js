import { NextResponse } from "next/server";
import { getRecentLogs } from "@/lib/db";

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

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const logs = await getRecentLogs(50);
  return NextResponse.json({ status: "success", logs });
}
