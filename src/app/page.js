"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Key,
  Users,
  Cpu,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Copy,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  LogOut,
  Terminal,
  Eye,
  EyeOff,
  ExternalLink,
  Calendar,
  Check,
  Zap,
  Power,
  RotateCcw,
  Settings,
} from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [currentAdminUser, setCurrentAdminUser] = useState("admin");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Settings State
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState("");
  const [settingsNewUsername, setSettingsNewUsername] = useState("admin");
  const [settingsNewPassword, setSettingsNewPassword] = useState("");
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState("");
  const [showSettingsCurrentPass, setShowSettingsCurrentPass] = useState(false);
  const [showSettingsNewPass, setShowSettingsNewPass] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  // Dashboard Data State
  const [licenses, setLicenses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("licenses"); // licenses | logs | bas
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedCode, setCopiedCode] = useState(false);
  const [hostUrl, setHostUrl] = useState("");
  const [firebaseError, setFirebaseError] = useState(null);

  // Create License Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [allowMultiDevice, setAllowMultiDevice] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [appFilter, setAppFilter] = useState("ALL");
  const [apps, setApps] = useState([]);
  const [newAppFormName, setNewAppFormName] = useState("");
  const [newAppDesc, setNewAppDesc] = useState("");
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostUrl(window.location.origin);
      // Check existing token
      const token = localStorage.getItem("bas_admin_token");
      const savedUser = localStorage.getItem("bas_admin_username") || "admin";
      setCurrentAdminUser(savedUser);
      setSettingsNewUsername(savedUser);
      setAdminUsername(savedUser);
      if (token) {
        setIsAuthenticated(true);
        fetchLicenses(token);
        fetchLogs(token);
        fetchApps(token);
        fetchAdminProfile(token);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchAdminProfile = async (tokenOverride) => {
    const token = tokenOverride || localStorage.getItem("bas_admin_token");
    if (!token) return;
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.username) {
        setCurrentAdminUser(data.username);
        setSettingsNewUsername(data.username);
        setAdminUsername(data.username);
        localStorage.setItem("bas_admin_username", data.username);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setAuthError("Username and password are required.");
      return;
    }
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        localStorage.setItem("bas_admin_token", data.token);
        if (data.username) {
          localStorage.setItem("bas_admin_username", data.username);
          setCurrentAdminUser(data.username);
          setSettingsNewUsername(data.username);
        }
        setIsAuthenticated(true);
        fetchLicenses(data.token);
        fetchLogs(data.token);
        fetchApps(data.token);
        showToast(`Welcome back, @${data.username || "admin"}!`);
      } else {
        setAuthError(data.message || "Invalid administrator credentials");
      }
    } catch (err) {
      setAuthError("Failed to connect to authentication server");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("bas_admin_token");
    setIsAuthenticated(false);
    setAdminPassword("");
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsError("");

    if (!settingsCurrentPassword) {
      setSettingsError("Current password is required to make security changes.");
      return;
    }
    if (!settingsNewUsername.trim()) {
      setSettingsError("New admin username cannot be empty.");
      return;
    }
    if (!settingsNewPassword) {
      setSettingsError("New password cannot be empty.");
      return;
    }
    if (settingsNewPassword !== settingsConfirmPassword) {
      setSettingsError("New password and confirm password do not match.");
      return;
    }

    setIsSavingSettings(true);
    const token = localStorage.getItem("bas_admin_token");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: settingsCurrentPassword,
          newUsername: settingsNewUsername.trim(),
          newPassword: settingsNewPassword,
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        if (data.token) {
          localStorage.setItem("bas_admin_token", data.token);
        }
        if (data.username) {
          localStorage.setItem("bas_admin_username", data.username);
          setCurrentAdminUser(data.username);
          setAdminUsername(data.username);
        }
        setSettingsCurrentPassword("");
        setSettingsNewPassword("");
        setSettingsConfirmPassword("");
        showToast("Admin credentials updated and saved to Google Cloud!");
      } else {
        setSettingsError(data.message || "Failed to update settings");
      }
    } catch (err) {
      setSettingsError("Network error while updating settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchLicenses = async (tokenOverride) => {
    const token = tokenOverride || localStorage.getItem("bas_admin_token");
    if (!token) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.users) {
        setLicenses(data.users);
        setFirebaseError(data.firebaseError || null);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (tokenOverride) => {
    const token = tokenOverride || localStorage.getItem("bas_admin_token");
    if (!token) return;

    try {
      const res = await fetch("/api/admin/logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApps = async (tokenOverride) => {
    const token = tokenOverride || localStorage.getItem("bas_admin_token");
    if (!token) return;
    try {
      const res = await fetch("/api/admin/apps", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.apps) setApps(data.apps);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddApp = async (e) => {
    e.preventDefault();
    if (!newAppFormName.trim()) return;
    setIsAddingApp(true);
    const token = localStorage.getItem("bas_admin_token");
    try {
      const res = await fetch("/api/admin/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newAppFormName, description: newAppDesc }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`App "${newAppFormName.trim()}" added!`);
        setNewAppFormName("");
        setNewAppDesc("");
        fetchApps();
      } else {
        showToast(data.message || "Failed to add app", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setIsAddingApp(false);
    }
  };

  const handleDeleteApp = async (app) => {
    const used = licenses.filter((l) => l.appName === app.name).length;
    const warn = used > 0 ? ` ${used} license(s) still use this app name (they will NOT be deleted).` : "";
    if (!confirm(`Delete app "${app.name}"?${warn}`)) return;
    const token = localStorage.getItem("bas_admin_token");
    try {
      const res = await fetch(`/api/admin/apps?id=${app.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast(`App deleted: ${app.name}`);
        if (appFilter === app.name) setAppFilter("ALL");
        fetchApps();
      } else {
        showToast("Failed to delete app", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const openLicenseModalForApp = (appName) => {
    setNewAppName(appName || "");
    setModalError("");
    setIsModalOpen(true);
  };

  const togglePasswordVisibility = (id) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Actions
  const handleToggleStatus = async (user) => {
    const token = localStorage.getItem("bas_admin_token");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          user.isActive ? `License deactivated for ${user.username}` : `License activated for ${user.username}`
        );
        fetchLicenses();
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleResetHWID = async (user) => {
    if (!confirm(`Are you sure you want to reset the Hardware ID for ${user.username}? The user will be able to bind a new PC.`)) {
      return;
    }
    const token = localStorage.getItem("bas_admin_token");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: user.id,
          resetHwid: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`HWID successfully unlinked for ${user.username}`);
        fetchLicenses();
      } else {
        showToast(data.message || "Failed to reset HWID", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleExtendDays = async (user, days = 30) => {
    const token = localStorage.getItem("bas_admin_token");
    const currentExp = user.expiresAt ? new Date(user.expiresAt) : new Date();
    const newDate = new Date(Math.max(Date.now(), currentExp.getTime()) + days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: user.id,
          expiresAt: newDate,
          isActive: true, // auto-reactivate if extended
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Extended ${days} days for ${user.username} (New date: ${newDate})`);
        fetchLicenses();
      } else {
        showToast(data.message || "Failed to extend", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleDeleteLicense = async (user) => {
    if (!confirm(`Warning: Are you sure you want to delete ${user.username}? This action is irreversible.`)) {
      return;
    }
    const token = localStorage.getItem("bas_admin_token");
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`License deleted: ${user.username}`);
        fetchLicenses();
      } else {
        showToast(data.message || "Failed to delete", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const handleCreateLicense = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setModalError("Username and password are required.");
      return;
    }
    setIsSubmitting(true);
    setModalError("");

    const token = localStorage.getItem("bas_admin_token");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          clientName: newClientName || newUsername,
          appName: newAppName.trim(),
          expiresAt: newExpiry,
          allowMultiDevice,
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        showToast(`License created for ${newUsername}!`);
        setIsModalOpen(false);
        setNewUsername("");
        setNewPassword("");
        setNewClientName("");
        setNewExpiry("");
        setAllowMultiDevice(false);
        setNewAppName("");
        fetchLicenses();
      } else {
        setModalError(data.message || "Failed to create license");
      }
    } catch (err) {
      setModalError("Network communication error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Distinct app names: registered apps + any name already used by a license
  const appList = useMemo(() => {
    const set = new Set();
    apps.forEach((a) => {
      if (a.name && a.name.trim()) set.add(a.name.trim());
    });
    licenses.forEach((l) => {
      if (l.appName && l.appName.trim()) set.add(l.appName.trim());
    });
    return Array.from(set).sort();
  }, [apps, licenses]);

  // App name used in the generated BAS snippet
  const snippetApp = appFilter !== "ALL" ? appFilter : appList[0] || "MyApp";

  // Filtered Licenses
  const filteredLicenses = useMemo(() => {
    return licenses.filter((item) => {
      if (appFilter !== "ALL" && (item.appName || "") !== appFilter) return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.username.toLowerCase().includes(q) ||
        (item.clientName && item.clientName.toLowerCase().includes(q)) ||
        (item.appName && item.appName.toLowerCase().includes(q)) ||
        (item.hwid && item.hwid.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === "ACTIVE") return item.status === "Active";
      if (statusFilter === "EXPIRED") return item.status === "Expired";
      if (statusFilter === "DISABLED") return item.status === "Disabled";
      return true;
    });
  }, [licenses, searchQuery, statusFilter, appFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = licenses.length;
    const active = licenses.filter((l) => l.status === "Active").length;
    const locked = licenses.filter((l) => l.hwid && l.hwid.trim() !== "").length;
    const expired = licenses.filter((l) => l.status === "Expired").length;
    return { total, active, locked, expired };
  }, [licenses]);

  // Sub-tab for BAS integration guide ("bas" = BAS script, "nodejs" = Node.js script)
  const [basCodeTab, setBasCodeTab] = useState("bas");

  // BAS Code Snippet (uses BAS built-in functions)
  const buildSnippet = (appForSnippet) => {
    const targetUrl = hostUrl ? `${hostUrl}/api/verify` : "https://YOUR-APP.vercel.app/api/verify";
    return `// ==========================================
// BAS CYBER-AUTH LICENSE VERIFICATION CODE
// ==========================================
// 1. Get credentials from BAS resources:
var username = {{LicenseUser}};
var password = {{LicensePass}};

// App name (must match the 'App Name' you entered when creating the license):
var appName = "${appForSnippet}";

// 2. Extract unique PC Hardware ID (HWID):
var hwid = native("sysinfo", "baseboard_serial_number", "") + "_" + native("sysinfo", "cpu_name", "");
hwid = btoa(hwid.trim()); // Safe Base64 encoding

// 3. Request license authentication from your Server:
var verifyApi = "${targetUrl}?username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password) + "&hwid=" + encodeURIComponent(hwid) + "&app=" + encodeURIComponent(appName);

// 4. Send HTTP verification request:
var response = http_client_get2(verifyApi, { method: "GET" });
var result = JSON.parse(response.content);

// 5. Check validation response:
if (result.status !== "success") {
    fail("ACCESS DENIED: " + (result.message || "Invalid License Credentials"));
}

log(">>> LICENSE VALIDATED SUCCESSFULLY! Client: " + result.clientName + " (Days left: " + result.daysRemaining + ")");
`;
  };

  // Node.js Code Snippet (uses standard Node.js https module — for BAS "Execute code" with Node.js engine)
  const buildNodeSnippet = (appForSnippet) => {
    const targetUrl = hostUrl ? `${hostUrl}/api/verify` : "https://YOUR-APP.vercel.app/api/verify";
    return `// ============================================================
// BAS CYBER-AUTH LICENSE VERIFICATION — Node.js Version
// Use this inside a BAS "Execute code" block (Node.js engine)
// ============================================================

const https = require('https');
const { execSync } = require('child_process');

// 1. Provide your license credentials:
const username = '%LicenseUser%';   // <-- Replace with your BAS variable or fixed value
const password = '%LicensePass%';   // <-- Replace with your BAS variable or fixed value

// App name (must EXACTLY match the app name used when creating the license in the panel):
const appName = '${appForSnippet}';

// 2. Generate unique Hardware ID (HWID) from this PC:
function getHwid() {
  try {
    const out = execSync(
      'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
      { encoding: 'utf8', timeout: 3000 }
    );
    const match = out.match(/MachineGuid\s+REG_SZ\s+([a-zA-Z0-9-]+)/i);
    if (match) return Buffer.from(match[1].trim()).toString('base64');
  } catch (_) {}
  // Fallback
  const os = require('os');
  return Buffer.from(os.hostname()).toString('base64');
}
const hwid = getHwid();

// 3. Build the verification URL:
const verifyUrl = '${targetUrl}'
  + '?username=' + encodeURIComponent(username)
  + '&password=' + encodeURIComponent(password)
  + '&hwid='     + encodeURIComponent(hwid)
  + '&app='      + encodeURIComponent(appName);

// 4. Send HTTPS GET request to the license server:
function checkLicense(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Invalid server response')); }
      });
    }).on('error', reject);
  });
}

// 5. Run verification (top-level await supported in Node 18+, else wrap in async IIFE):
(async () => {
  try {
    const result = await checkLicense(verifyUrl);

    if (result.status !== 'success') {
      throw new Error('ACCESS DENIED: ' + (result.message || 'Invalid License'));
    }

    console.log('>>> LICENSE VERIFIED! Client:', result.clientName, '| Days left:', result.daysRemaining);
    // Your bot logic continues here...

  } catch (err) {
    console.error(err.message);
    process.exit(1); // Stop BAS script execution
  }
})();
`;
  };

  const basSnippet  = useMemo(() => buildSnippet(snippetApp),     [hostUrl, snippetApp]);
  const nodeSnippet = useMemo(() => buildNodeSnippet(snippetApp),  [hostUrl, snippetApp]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showToast("BAS Code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Quick set expiry buttons
  const setExpiryDays = (days) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setNewExpiry(d.toISOString().split("T")[0]);
  };

  // -------------------------------------------------------------
  // RENDER: LOGIN GATE
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          className="glass-card"
          style={{
            width: "100%",
            maxWidth: "460px",
            padding: "44px 36px",
            textAlign: "center",
            boxShadow: "0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0,242,254,0.15)",
          }}
        >
          {/* 3D Cyber Emblem */}
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 24px auto",
              borderRadius: "24px",
              background: "linear-gradient(135deg, rgba(0,242,254,0.2), rgba(157,78,221,0.25))",
              border: "1px solid rgba(0,242,254,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 30px rgba(0,242,254,0.25)",
              transform: "perspective(600px) rotateX(10deg)",
            }}
          >
            <Shield size={42} color="#00f2fe" />
          </div>

          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "8px",
              background: "linear-gradient(135deg, #ffffff 40%, #00f2fe)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CYBER-AUTH // ADMIN
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "32px" }}>
            Browser Automation Studio Remote License Commander
          </p>

          {authError && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#f87171",
                padding: "12px",
                borderRadius: "12px",
                fontSize: "0.85rem",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textAlign: "left",
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Username */}
            <div style={{ textAlign: "left" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "8px",
                }}
              >
                Administrator Username
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Enter admin username (default: admin)"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                  autoFocus
                  required
                />
                <Users
                  size={18}
                  color="#94a3b8"
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ textAlign: "left" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "8px",
                }}
              >
                Administrator Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showAdminPassword ? "text" : "password"}
                  className="input-glass"
                  placeholder="Enter password (default: admin1234)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{ paddingLeft: "42px", paddingRight: "44px" }}
                  required
                />
                <Lock
                  size={18}
                  color="#94a3b8"
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-dim)",
                    cursor: "pointer",
                  }}
                  title="Toggle password visibility"
                >
                  {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-neon btn-primary"
              disabled={isAuthenticating}
              style={{ padding: "14px", width: "100%", fontSize: "0.95rem" }}
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>AUTHORIZE ACCESS</span>
                </>
              )}
            </button>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", textAlign: "center" }}>
              Default: <b>admin</b> / <b>admin1234</b> (Changeable in Settings)
            </div>
          </form>

          <div
            style={{
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border-glass)",
              fontSize: "0.78rem",
              color: "var(--text-dim)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Secured with Hardware ID Lock</span>
            <span style={{ color: "var(--accent-cyan)" }}>Version 2.0 Live</span>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MAIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: toastMessage.type === "error" ? "rgba(239, 68, 68, 0.9)" : "rgba(16, 185, 129, 0.9)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            backdropFilter: "blur(10px)",
            fontWeight: 600,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {toastMessage.type === "error" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* TOP NAVIGATION HEADER */}
      <header
        style={{
          borderBottom: "1px solid var(--border-glass)",
          background: "rgba(6, 8, 20, 0.75)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 32px",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Logo & Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #00f2fe, #9d4edd)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(0,242,254,0.4)",
              }}
            >
              <Shield size={24} color="#030712" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                  CYBER-AUTH <span style={{ color: "var(--accent-cyan)", fontWeight: 400 }}>// BAS</span>
                </h1>
                <span className="badge-neon badge-active" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                  <span className="pulse-dot"></span> LIVE
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Remote Bot License & Hardware Security Commander
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setActiveTab("settings")}
              className={`btn-neon ${activeTab === "settings" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "8px 14px", fontSize: "0.85rem" }}
              title="Admin Credentials & Settings"
            >
              <Settings size={16} color="var(--accent-cyan)" />
              <span>@{currentAdminUser}</span>
            </button>

            <button
              onClick={() => setActiveTab("bas")}
              className="btn-neon btn-secondary"
              style={{ padding: "8px 14px", fontSize: "0.85rem" }}
            >
              <Terminal size={16} color="var(--accent-cyan)" />
              <span>BAS Script Code</span>
            </button>

            <button
              onClick={() => {
                setModalError("");
                setIsModalOpen(true);
              }}
              className="btn-neon btn-primary"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              <Plus size={16} />
              <span>New License</span>
            </button>

            <button
              onClick={handleLogout}
              className="btn-neon btn-secondary btn-icon"
              title="Logout"
              style={{ border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <LogOut size={16} color="#f87171" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px", width: "100%", flex: 1 }}>
        {/* FIREBASE PERMISSION ERROR BANNER */}
        {firebaseError && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              borderRadius: "14px",
              padding: "18px 24px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              boxShadow: "0 10px 30px rgba(239, 68, 68, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <AlertTriangle size={24} color="#f87171" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#f87171", margin: 0 }}>
                  Firebase Firestore Database Rules Required
                </h4>
                <p style={{ fontSize: "0.85rem", color: "#fca5a5", marginTop: "4px", marginBottom: "8px" }}>
                  Your licenses/apps cannot be saved permanently because Firestore rejected access: <code>{firebaseError}</code>
                </p>
                <div style={{ fontSize: "0.82rem", color: "#e2e8f0", background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "8px" }}>
                  👉 <b>How to fix in 10 seconds:</b> Open <b>Firebase Console</b> &rarr; <b>Firestore Database</b> &rarr; <b>Rules</b> tab &rarr; change to <code>allow read, write: if true;</code> &rarr; click <b>Publish</b>.
                </div>
              </div>
            </div>
            <button
              onClick={() => fetchLicenses()}
              className="btn-neon btn-secondary"
              style={{ padding: "8px 16px", fontSize: "0.82rem", whiteSpace: "nowrap" }}
            >
              <RefreshCw size={14} />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* HERO 3D METRIC CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          {/* Card 1: Total Licenses */}
          <div className="glass-card glass-card-interactive" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Total Licenses
                </p>
                <h3 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "6px" }}>{metrics.total}</h3>
              </div>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(0, 242, 254, 0.12)",
                  border: "1px solid rgba(0, 242, 254, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={24} color="#00f2fe" />
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "0.78rem", color: "var(--text-dim)" }}>
              All clients registered in system
            </div>
          </div>

          {/* Card 2: Active Licenses */}
          <div className="glass-card glass-card-interactive" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Active & Running
                </p>
                <h3 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "6px", color: "var(--accent-emerald)" }}>
                  {metrics.active}
                </h3>
              </div>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2 size={24} color="#10b981" />
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "0.78rem", color: "var(--text-dim)" }}>
              Can currently execute BAS bots
            </div>
          </div>

          {/* Card 3: HWID Bound */}
          <div className="glass-card glass-card-interactive" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Hardware Locked
                </p>
                <h3 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "6px", color: "var(--accent-purple)" }}>
                  {metrics.locked}
                </h3>
              </div>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(157, 78, 221, 0.12)",
                  border: "1px solid rgba(157, 78, 221, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Cpu size={24} color="#9d4edd" />
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "0.78rem", color: "var(--text-dim)" }}>
              Tied strictly to client PCs
            </div>
          </div>

          {/* Card 4: Verification Events */}
          <div className="glass-card glass-card-interactive" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Audit Logs
                </p>
                <h3 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "6px", color: "var(--accent-blue)" }}>
                  {logs.length}
                </h3>
              </div>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(79, 172, 254, 0.12)",
                  border: "1px solid rgba(79, 172, 254, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Activity size={24} color="#4facfe" />
              </div>
            </div>
            <div style={{ marginTop: "14px", fontSize: "0.78rem", color: "var(--text-dim)" }}>
              Recent bot authentication pings
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid var(--border-glass)",
            paddingBottom: "14px",
            marginBottom: "28px",
          }}
        >
          <button
            onClick={() => setActiveTab("licenses")}
            className={`btn-neon ${activeTab === "licenses" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 20px", fontSize: "0.9rem" }}
          >
            <Key size={16} />
            <span>Licenses ({licenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("apps")}
            className={`btn-neon ${activeTab === "apps" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 20px", fontSize: "0.9rem" }}
          >
            <Zap size={16} />
            <span>My Apps ({appList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`btn-neon ${activeTab === "logs" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 20px", fontSize: "0.9rem" }}
          >
            <Activity size={16} />
            <span>Live Audit Stream ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("bas")}
            className={`btn-neon ${activeTab === "bas" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 20px", fontSize: "0.9rem" }}
          >
            <Terminal size={16} />
            <span>BAS Integration Guide</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`btn-neon ${activeTab === "settings" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 20px", fontSize: "0.9rem" }}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB: MY APPS */}
        {/* ========================================================= */}
        {activeTab === "apps" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>Add a New App</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Every time you build a new BAS app, register it here first. Then you can give licenses of that app to your users.
              </p>
              <form onSubmit={handleAddApp} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="App name (e.g. InstaBot)"
                  value={newAppFormName}
                  onChange={(e) => setNewAppFormName(e.target.value)}
                  required
                  style={{ flex: 1, minWidth: "220px" }}
                />
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Short note (optional)"
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  style={{ flex: 2, minWidth: "220px" }}
                />
                <button type="submit" disabled={isAddingApp} className="btn-neon btn-primary" style={{ padding: "10px 22px" }}>
                  <Plus size={16} />
                  <span>{isAddingApp ? "ADDING..." : "ADD APP"}</span>
                </button>
              </form>
            </div>

            {appList.length === 0 ? (
              <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                No apps yet. Add your first app above.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                {appList.map((name) => {
                  const reg = apps.find((a) => a.name === name);
                  const appLicenses = licenses.filter((l) => l.appName === name);
                  const activeCount = appLicenses.filter((l) => l.status === "Active").length;
                  return (
                    <div key={name} className="glass-card glass-card-interactive" style={{ padding: "22px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                        <div>
                          <div style={{ fontSize: "1.15rem", fontWeight: 800 }}>📦 {name}</div>
                          {reg?.description && (
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{reg.description}</div>
                          )}
                        </div>
                        {reg && (
                          <button
                            onClick={() => handleDeleteApp(reg)}
                            className="btn-neon btn-secondary btn-icon"
                            title="Delete app"
                            style={{ border: "1px solid rgba(239,68,68,0.3)" }}
                          >
                            <Trash2 size={14} color="#f87171" />
                          </button>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "18px", margin: "18px 0" }}>
                        <div>
                          <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{appLicenses.length}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Users</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-emerald)" }}>{activeCount}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Active</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => openLicenseModalForApp(name)}
                          className="btn-neon btn-primary"
                          style={{ padding: "7px 14px", fontSize: "0.78rem" }}
                        >
                          <Plus size={14} />
                          <span>Give License</span>
                        </button>
                        <button
                          onClick={() => {
                            setAppFilter(name);
                            setActiveTab("licenses");
                          }}
                          className="btn-neon btn-secondary"
                          style={{ padding: "7px 14px", fontSize: "0.78rem" }}
                        >
                          <Users size={14} />
                          <span>View Users</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(buildSnippet(name))}
                          className="btn-neon btn-secondary"
                          style={{ padding: "7px 14px", fontSize: "0.78rem" }}
                        >
                          <Terminal size={14} />
                          <span>Copy BAS Code</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: LICENSES TABLE */}
        {/* ========================================================= */}
        {activeTab === "licenses" && (
          <div className="glass-card" style={{ padding: "24px" }}>
            {/* Filter and Search Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div style={{ position: "relative", minWidth: "300px", flex: 1, maxWidth: "500px" }}>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Search by username, client name or HWID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                />
                <Search
                  size={18}
                  color="#94a3b8"
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {["ALL", "ACTIVE", "EXPIRED", "DISABLED"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className="btn-neon"
                    style={{
                      padding: "6px 14px",
                      fontSize: "0.78rem",
                      background: statusFilter === f ? "rgba(0,242,254,0.18)" : "rgba(255,255,255,0.04)",
                      border: statusFilter === f ? "1px solid var(--accent-cyan)" : "1px solid var(--border-glass)",
                      color: statusFilter === f ? "var(--accent-cyan)" : "var(--text-muted)",
                    }}
                  >
                    {f}
                  </button>
                ))}

                <button
                  onClick={() => fetchLicenses()}
                  className="btn-neon btn-secondary btn-icon"
                  title="Refresh Licenses"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* App Filter */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
                App:
              </span>
              {["ALL", ...appList].map((a) => (
                <button
                  key={a}
                  onClick={() => setAppFilter(a)}
                  className="btn-neon"
                  style={{
                    padding: "5px 12px",
                    fontSize: "0.76rem",
                    background: appFilter === a ? "rgba(157,78,221,0.2)" : "rgba(255,255,255,0.04)",
                    border: appFilter === a ? "1px solid var(--accent-purple)" : "1px solid var(--border-glass)",
                    color: appFilter === a ? "#d8b4fe" : "var(--text-muted)",
                  }}
                >
                  {a === "ALL" ? "All Apps" : a}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Client / Username</th>
                    <th>Password</th>
                    <th>Hardware Lock (HWID)</th>
                    <th>Expires At</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px auto" }} />
                        Loading licenses from secure database...
                      </td>
                    </tr>
                  ) : filteredLicenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No licenses found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLicenses.map((u) => (
                      <tr key={u.id}>
                        {/* Client / User */}
                        <td>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.98rem" }}>{u.clientName || u.username}</div>
                            <div className="font-mono" style={{ fontSize: "0.8rem", color: "var(--accent-cyan)" }}>
                              @{u.username}
                            </div>
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "4px",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "20px",
                                background: "rgba(79,172,254,0.14)",
                                border: "1px solid rgba(79,172,254,0.35)",
                                color: "#7dc4ff",
                              }}
                            >
                              {u.appName ? `📦 ${u.appName}` : "🌐 All Apps"}
                            </span>
                          </div>
                        </td>

                        {/* Password with Eye Reveal */}
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="font-mono" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              {revealedPasswords[u.id] ? u.password : "••••••••••••"}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(u.id)}
                              style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}
                              title="Toggle password view"
                            >
                              {revealedPasswords[u.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </td>

                        {/* HWID */}
                        <td>
                          {u.hwid ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                className="font-mono"
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(157, 78, 221, 0.15)",
                                  border: "1px solid rgba(157, 78, 221, 0.3)",
                                  color: "#d8b4fe",
                                }}
                                title={u.hwid}
                              >
                                {u.hwid.slice(0, 16)}...
                              </span>
                              <button
                                onClick={() => handleResetHWID(u)}
                                className="btn-neon btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                                title="Reset HWID binding"
                              >
                                <Unlock size={12} color="#f59e0b" />
                                <span>Reset</span>
                              </button>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-dim)",
                                fontStyle: "italic",
                              }}
                            >
                              Unbound (Binds on first run)
                            </span>
                          )}
                        </td>

                        {/* Expiry */}
                        <td>
                          <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                              {u.expiresAt || "Lifetime (No expiry)"}
                            </div>
                            {u.expiresAt && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: u.isExpired ? "#ef4444" : "var(--text-dim)",
                                }}
                              >
                                {u.isExpired ? "Expired" : "Valid"}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td>
                          {u.status === "Active" && (
                            <span className="badge-neon badge-active">
                              <span className="pulse-dot"></span> Active
                            </span>
                          )}
                          {u.status === "Expired" && (
                            <span className="badge-neon badge-expired">Expired</span>
                          )}
                          {u.status === "Disabled" && (
                            <span className="badge-neon badge-disabled">Disabled</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            {/* Toggle Kill Switch */}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="btn-neon btn-secondary btn-icon"
                              title={u.isActive ? "Deactivate License (Kill Switch)" : "Activate License"}
                              style={{
                                border: u.isActive
                                  ? "1px solid rgba(16, 185, 129, 0.3)"
                                  : "1px solid rgba(239, 68, 68, 0.3)",
                              }}
                            >
                              <Power size={15} color={u.isActive ? "#10b981" : "#ef4444"} />
                            </button>

                            {/* Extend +30 Days */}
                            <button
                              onClick={() => handleExtendDays(u, 30)}
                              className="btn-neon btn-secondary btn-icon"
                              title="Extend +30 Days"
                            >
                              <RotateCcw size={15} color="#00f2fe" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteLicense(u)}
                              className="btn-neon btn-danger btn-icon"
                              title="Delete License"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: LIVE AUDIT LOGS */}
        {/* ========================================================= */}
        {activeTab === "logs" && (
          <div className="glass-card" style={{ padding: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Live Bot Verification Stream</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "4px" }}>
                  Real-time security logs whenever a client executes the BAS script
                </p>
              </div>
              <button onClick={() => fetchLogs()} className="btn-neon btn-secondary" style={{ fontSize: "0.82rem" }}>
                <RefreshCw size={15} />
                <span>Refresh Stream</span>
              </button>
            </div>

            <div className="table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Client HWID</th>
                    <th>IP Address</th>
                    <th>Status</th>
                    <th>Server Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        No audit events recorded yet. Run your BAS bot to see real-time requests!
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="font-mono" style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>
                          @{log.username}
                        </td>
                        <td className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                          {log.hwid ? log.hwid.slice(0, 18) + "..." : "N/A"}
                        </td>
                        <td className="font-mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {log.ip}
                        </td>
                        <td>
                          {log.status === "SUCCESS" && (
                            <span className="badge-neon badge-active" style={{ fontSize: "0.7rem" }}>
                              SUCCESS
                            </span>
                          )}
                          {log.status === "REJECTED" && (
                            <span className="badge-neon badge-disabled" style={{ fontSize: "0.7rem" }}>
                              INVALID AUTH
                            </span>
                          )}
                          {log.status === "BLOCKED" && (
                            <span className="badge-neon badge-disabled" style={{ fontSize: "0.7rem" }}>
                              SUSPENDED
                            </span>
                          )}
                          {log.status === "EXPIRED" && (
                            <span className="badge-neon badge-expired" style={{ fontSize: "0.7rem" }}>
                              EXPIRED
                            </span>
                          )}
                          {log.status === "HWID_MISMATCH" && (
                            <span className="badge-neon badge-disabled" style={{ fontSize: "0.7rem" }}>
                              HWID MISMATCH
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{log.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BAS INTEGRATION GUIDE */}
        {/* ========================================================= */}
        {activeTab === "bas" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Left: Code Snippet */}
            <div className="glass-card" style={{ padding: "28px" }}>
              {/* Sub-tab toggle: BAS vs Node.js */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                  borderBottom: "1px solid var(--border-glass)",
                  paddingBottom: "14px",
                }}
              >
                <button
                  onClick={() => setBasCodeTab("bas")}
                  className={`btn-neon ${basCodeTab === "bas" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "6px 16px", fontSize: "0.82rem" }}
                >
                  <Terminal size={14} />
                  <span>BAS Built-in</span>
                </button>
                <button
                  onClick={() => setBasCodeTab("nodejs")}
                  className={`btn-neon ${basCodeTab === "nodejs" ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "6px 16px", fontSize: "0.82rem" }}
                >
                  <Zap size={14} color={basCodeTab === "nodejs" ? undefined : "var(--accent-emerald)"} />
                  <span>Node.js</span>
                </button>

                <div style={{ marginLeft: "auto" }}>
                  <button
                    onClick={() => copyToClipboard(basCodeTab === "bas" ? basSnippet : nodeSnippet)}
                    className="btn-neon btn-primary"
                    style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
              </div>

              {basCodeTab === "bas" && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                  BAS built-in functions — paste directly into an <code>Execute code</code> block:
                </p>
              )}
              {basCodeTab === "nodejs" && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "14px" }}>
                  Node.js script — use in a BAS <code>Execute code</code> block set to <b>Node.js</b> engine:
                </p>
              )}

              <pre
                style={{
                  background: "rgba(4, 6, 16, 0.9)",
                  border: "1px solid var(--border-glass)",
                  padding: "18px",
                  borderRadius: "14px",
                  fontSize: "0.78rem",
                  color: "#e2e8f0",
                  overflowX: "auto",
                  lineHeight: "1.6",
                  maxHeight: "460px",
                  overflowY: "auto",
                }}
              >
                {basCodeTab === "bas" ? basSnippet : nodeSnippet}
              </pre>
            </div>

            {/* Right: Step-by-Step Instructions */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px" }}>
                {basCodeTab === "nodejs" ? "Node.js Script — How to Use" : "BAS Built-in — How to Connect"}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Step 1 */}
                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "rgba(0, 242, 254, 0.2)", border: "1px solid var(--accent-cyan)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, color: "var(--accent-cyan)", flexShrink: 0,
                    }}
                  >1</div>
                  <div>
                    {basCodeTab === "bas" ? (
                      <>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Add BAS Input Resources</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          In your BAS project, go to <b>Resources</b> and create two inputs:<br />
                          <code>LicenseUser</code> (Fixed String / Line by user)<br />
                          <code>LicensePass</code> (Password String)
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Fill in Username & Password</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          In the copied code, replace <code>%LicenseUser%</code> and <code>%LicensePass%</code> with the
                          exact <b>username</b> and <b>password</b> you entered when creating the license in this panel.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "rgba(157, 78, 221, 0.2)", border: "1px solid var(--accent-purple)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, color: "var(--accent-purple)", flexShrink: 0,
                    }}
                  >2</div>
                  <div>
                    {basCodeTab === "bas" ? (
                      <>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Insert "Execute code" Block</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          At the very beginning of your BAS script (before browser launch), add an <b>Execute code</b> action
                          and paste the copied snippet. No extra setup needed.
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Add "Execute code" Block → Select Node.js</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          Add an <b>Execute code</b> block at the very start of your BAS script. In the block settings,
                          set the engine to <b>Node.js</b> (not the default BAS JS engine). Then paste the copied code.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 3 — Node.js only extra info */}
                {basCodeTab === "nodejs" && (
                  <div style={{ display: "flex", gap: "14px" }}>
                    <div
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "rgba(251, 191, 36, 0.15)", border: "1px solid #fbbf24",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, color: "#fbbf24", flexShrink: 0,
                      }}
                    >3</div>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>App Name Must Match Exactly</h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        The <code>appName</code> in the script (currently <b>"{snippetApp}"</b>) must <b>exactly match</b> the
                        App Name set on that user's license in this panel. Case-sensitive!
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3 (BAS) / Step 4 (Node.js) — HWID auto-bind */}
                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "rgba(16, 185, 129, 0.2)", border: "1px solid var(--accent-emerald)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, color: "var(--accent-emerald)", flexShrink: 0,
                    }}
                  >{basCodeTab === "nodejs" ? "4" : "3"}</div>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Automatic PC Binding & Kill Switch</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      On first run, the user's PC Hardware ID binds automatically to their license.
                      You can suspend access anytime from the Licenses tab with a single click!
                    </p>
                  </div>
                </div>

                {/* Node.js tip box */}
                {basCodeTab === "nodejs" && (
                  <div
                    style={{
                      background: "rgba(0, 242, 254, 0.07)",
                      border: "1px solid rgba(0, 242, 254, 0.25)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    <b style={{ color: "var(--accent-cyan)" }}>💡 Node.js Tip:</b> The script uses the Windows Registry
                    (<code>MachineGuid</code>) to generate a unique, stable Hardware ID per PC — no extra libraries needed,
                    only built-in Node.js modules (<code>https</code>, <code>child_process</code>, <code>os</code>).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: ADMIN SETTINGS & SECURITY */}
        {/* ========================================================= */}
        {activeTab === "settings" && (
          <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Overview / Info Card */}
            <div className="glass-card" style={{ padding: "32px", position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  top: "-40px",
                  right: "-40px",
                  width: "160px",
                  height: "160px",
                  background: "radial-gradient(circle, rgba(0,242,254,0.15) 0%, transparent 70%)",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "rgba(0, 242, 254, 0.12)",
                    border: "1px solid rgba(0, 242, 254, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lock size={24} color="#00f2fe" />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Admin Security & Credentials</h2>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Update your dashboard login username and password. Saved directly to Google Cloud Firestore.
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>
                    Active Administrator
                  </span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-cyan)", marginTop: "2px" }}>
                    @{currentAdminUser}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="badge-neon badge-active" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                    <span className="pulse-dot"></span> Cloud-Synced
                  </span>
                </div>
              </div>

              {/* Settings Form */}
              <form onSubmit={handleSaveSettings} style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
                {settingsError && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      borderRadius: "12px",
                      padding: "14px 18px",
                      color: "#fca5a5",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>{settingsError}</span>
                  </div>
                )}

                {/* New Username */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    New Admin Username
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="e.g. admin or myname"
                      value={settingsNewUsername}
                      onChange={(e) => setSettingsNewUsername(e.target.value)}
                      style={{ paddingLeft: "42px" }}
                      required
                    />
                    <Users
                      size={18}
                      color="#94a3b8"
                      style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                    />
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "6px", display: "block" }}>
                    Used to sign in to this control panel.
                  </span>
                </div>

                <div style={{ height: "1px", background: "var(--border-glass)", margin: "4px 0" }} />

                {/* Current Password */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#fbbf24",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    Current Password (Verification Required)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showSettingsCurrentPass ? "text" : "password"}
                      className="input-glass"
                      placeholder="Enter current password to authorize change"
                      value={settingsCurrentPassword}
                      onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                      style={{ paddingLeft: "42px", paddingRight: "44px" }}
                      required
                    />
                    <Lock
                      size={18}
                      color="#fbbf24"
                      style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSettingsCurrentPass(!showSettingsCurrentPass)}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-dim)",
                        cursor: "pointer",
                      }}
                      title="Toggle visibility"
                    >
                      {showSettingsCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "6px", display: "block" }}>
                    Default initial password is <b>admin1234</b> unless already changed.
                  </span>
                </div>

                {/* New Password */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showSettingsNewPass ? "text" : "password"}
                      className="input-glass"
                      placeholder="Enter new password (min 6 characters)"
                      value={settingsNewPassword}
                      onChange={(e) => setSettingsNewPassword(e.target.value)}
                      style={{ paddingLeft: "42px", paddingRight: "44px" }}
                      required
                      minLength={6}
                    />
                    <Key
                      size={18}
                      color="#94a3b8"
                      style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSettingsNewPass(!showSettingsNewPass)}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-dim)",
                        cursor: "pointer",
                      }}
                      title="Toggle visibility"
                    >
                      {showSettingsNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    Confirm New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="password"
                      className="input-glass"
                      placeholder="Re-type new password"
                      value={settingsConfirmPassword}
                      onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                      style={{ paddingLeft: "42px" }}
                      required
                    />
                    <CheckCircle2
                      size={18}
                      color="#94a3b8"
                      style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button
                    type="submit"
                    className="btn-neon btn-primary"
                    disabled={isSavingSettings}
                    style={{ padding: "12px 28px", fontSize: "0.95rem" }}
                  >
                    {isSavingSettings ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Saving to Cloud...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Update & Save Credentials</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: CREATE NEW LICENSE */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(3, 5, 15, 0.8)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "36px",
              boxShadow: "0 30px 70px rgba(0,0,0,0.9), 0 0 50px rgba(0,242,254,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Key size={22} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Create New License</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-neon btn-secondary btn-icon"
                style={{ width: "32px", height: "32px" }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#f87171",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  marginBottom: "18px",
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateLicense} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* App Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  App (Which software is this license for?)
                </label>
                <select
                  className="input-glass"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                >
                  <option value="">🌐 All Apps (works for every app)</option>
                  {appList.map((a) => (
                    <option key={a} value={a}>
                      📦 {a}
                    </option>
                  ))}
                </select>
                {appList.length === 0 && (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "6px" }}>
                    No apps yet — add one from the "My Apps" tab first.
                  </div>
                )}
              </div>

              {/* Client Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  Client Name / Identifier
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. VIP Trader or Alex Smith"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>

              {/* Username */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  License Username *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. client_alex"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  License Password *
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. strong_pass_9988"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              {/* Expiry Date with Quick Preset Buttons */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                  }}
                >
                  Expiry Date (Optional)
                </label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setExpiryDays(7)}
                    className="btn-neon btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryDays(30)}
                    className="btn-neon btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpiryDays(365)}
                    className="btn-neon btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                  >
                    +1 Year
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExpiry("")}
                    className="btn-neon btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                  >
                    Lifetime
                  </button>
                </div>
                <input
                  type="date"
                  className="input-glass"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                />
              </div>

              {/* Multi-Device Option */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="multiDeviceCheck"
                  checked={allowMultiDevice}
                  onChange={(e) => setAllowMultiDevice(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--accent-cyan)" }}
                />
                <label htmlFor="multiDeviceCheck" style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  Allow Multiple PCs (Disables Strict HWID Hardware Lock)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-neon btn-secondary"
                  style={{ padding: "10px 18px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-neon btn-primary"
                  style={{ padding: "10px 22px" }}
                >
                  {isSubmitting ? "CREATING..." : "GENERATE LICENSE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
