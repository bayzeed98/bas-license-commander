import { NextResponse } from "next/server";
import { getUserByUsername, updateUser, logVerification } from "@/lib/db";

function calculateDaysLeft(expiresAt) {
  if (!expiresAt) return null;
  const now = new Date();
  const exp = new Date(expiresAt + "T23:59:59Z");
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

async function handleVerification(req, data) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const username = data.username?.trim();
  const password = data.password?.trim();
  const hwid = data.hwid?.trim();

  if (!username || !password || !hwid) {
    return NextResponse.json(
      {
        status: "error",
        code: "MISSING_PARAMETERS",
        message: "Username, password and HWID parameters are required.",
      },
      { status: 400 }
    );
  }

  const appName = data.app?.trim() || "";
  const user = await getUserByUsername(username, appName);

  // Check username and password
  if (!user || user.password !== password) {
    await logVerification({
      username,
      hwid,
      appName,
      ip,
      status: "REJECTED",
      message: "Invalid username or password",
    });

    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_CREDENTIALS",
        message: "Invalid username or password. Please verify your credentials.",
      },
      { status: 401 }
    );
  }

  // Check if account is suspended/disabled
  if (!user.isActive) {
    await logVerification({
      username,
      hwid,
      appName,
      ip,
      status: "BLOCKED",
      message: "License suspended by administrator",
    });

    return NextResponse.json(
      {
        status: "error",
        code: "ACCOUNT_SUSPENDED",
        message: "Your license has been suspended or deactivated by Administrator.",
      },
      { status: 403 }
    );
  }

  // Check Expiry Date
  if (user.expiresAt) {
    const today = new Date().toISOString().split("T")[0];
    if (today > user.expiresAt) {
      await logVerification({
        username,
        hwid,
        appName,
        ip,
        status: "EXPIRED",
        message: "Subscription expired on " + user.expiresAt,
      });

      return NextResponse.json(
        {
          status: "error",
          code: "LICENSE_EXPIRED",
          message: `Subscription expired on ${user.expiresAt}. Please contact Admin to renew your license.`,
          expiresAt: user.expiresAt,
        },
        { status: 403 }
      );
    }
  }

  // Check Hardware ID (HWID Lock)
  if (!user.allowMultiDevice) {
    if (!user.hwid) {
      // First time activation on this machine! Auto-bind HWID
      await updateUser(user.id, {
        hwid,
        lastUsedAt: new Date().toISOString(),
      });
    } else if (user.hwid !== hwid) {
      // HWID mismatch
      await logVerification({
        username,
        hwid,
        appName,
        ip,
        status: "HWID_MISMATCH",
        message: `Attempted login from unauthorized HWID. Bound: ${user.hwid.slice(0, 10)}...`,
      });

      return NextResponse.json(
        {
          status: "error",
          code: "HWID_LOCKED",
          message:
            "Hardware ID Mismatch. This license is bound to another PC. Contact Administrator if you changed your device.",
          boundHwid: user.hwid.slice(0, 8) + "...",
        },
        { status: 403 }
      );
    } else {
      // Match! Update last activity
      await updateUser(user.id, {
        lastUsedAt: new Date().toISOString(),
      });
    }
  } else {
    // Multi device allowed
    await updateUser(user.id, {
      lastUsedAt: new Date().toISOString(),
    });
  }

  const daysRemaining = calculateDaysLeft(user.expiresAt);

  // Success log
  await logVerification({
    username,
    hwid,
    appName,
    ip,
    status: "SUCCESS",
    message: "Authorized login",
  });

  return NextResponse.json({
    status: "success",
    message: "License verified successfully.",
    user: user.username,
    clientName: user.clientName,
    app: user.appName || appName || "",
    expiresAt: user.expiresAt || "Lifetime",
    daysRemaining: daysRemaining ?? "Lifetime",
    timestamp: new Date().toISOString(),
  });
}

// GET handler: /api/verify?username=...&password=...&hwid=...
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const data = {
    username: searchParams.get("username"),
    password: searchParams.get("password"),
    hwid: searchParams.get("hwid"),
    app: searchParams.get("app"),
  };
  return handleVerification(req, data);
}

// POST handler: /api/verify
export async function POST(req) {
  try {
    const body = await req.json();
    return handleVerification(req, body);
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON request body" },
      { status: 400 }
    );
  }
}
