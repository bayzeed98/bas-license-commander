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
} from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  // Create License Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [allowMultiDevice, setAllowMultiDevice] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [appFilter, setAppFilter] = useState("ALL");
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
      if (token) {
        setIsAuthenticated(true);
        fetchLicenses(token);
        fetchLogs(token);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;
    setIsAuthenticating(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        localStorage.setItem("bas_admin_token", data.token);
        setIsAuthenticated(true);
        fetchLicenses(data.token);
        fetchLogs(data.token);
        showToast("Authenticated as Administrator");
      } else {
        setAuthError(data.message || "Invalid administrator password");
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

  // Distinct app names across all licenses
  const appList = useMemo(() => {
    const set = new Set();
    licenses.forEach((l) => {
      if (l.appName && l.appName.trim()) set.add(l.appName.trim());
    });
    return Array.from(set).sort();
  }, [licenses]);

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

  // BAS Code Snippet
  const basSnippet = useMemo(() => {
    const targetUrl = hostUrl ? `${hostUrl}/api/verify` : "https://YOUR-APP.vercel.app/api/verify";
    return `// ==========================================
// BAS CYBER-AUTH LICENSE VERIFICATION CODE
// ==========================================
// 1. Get credentials from BAS resources:
var username = {{LicenseUser}};
var password = {{LicensePass}};

// App name (must match the 'App Name' you entered when creating the license):
var appName = "${snippetApp}";

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
  }, [hostUrl, snippetApp]);

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
                Master Administrator Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="input-glass"
                  placeholder="Enter admin password (default: admin1234)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{ paddingLeft: "42px" }}
                  autoFocus
                />
                <Key
                  size={18}
                  color="#94a3b8"
                  style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
                />
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
        </div>

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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Terminal size={20} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>BAS Verification Code</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(basSnippet)}
                  className="btn-neon btn-primary"
                  style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                >
                  {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Copy and paste this script directly into an <code>Execute code</code> block in Browser Automation Studio:
              </p>

              <pre
                style={{
                  background: "rgba(4, 6, 16, 0.9)",
                  border: "1px solid var(--border-glass)",
                  padding: "18px",
                  borderRadius: "14px",
                  fontSize: "0.8rem",
                  color: "#e2e8f0",
                  overflowX: "auto",
                  lineHeight: "1.6",
                }}
              >
                {basSnippet}
              </pre>
            </div>

            {/* Right: Step-by-Step Instructions */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px" }}>
                How to Connect with Browser Automation Studio
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(0, 242, 254, 0.2)",
                      border: "1px solid var(--accent-cyan)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      color: "var(--accent-cyan)",
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Add BAS Input Resources</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Open your BAS project, go to <b>Resources</b>, and create two new resources named:
                      <br />
                      <code>LicenseUser</code> (Fixed String / Line by user)
                      <br />
                      <code>LicensePass</code> (Password String)
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(157, 78, 221, 0.2)",
                      border: "1px solid var(--accent-purple)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      color: "var(--accent-purple)",
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Insert "Execute code" Block</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      At the very beginning of your BAS script (before browser launch or profile load), add an{" "}
                      <b>Execute code</b> action and paste the copied snippet.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "14px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(16, 185, 129, 0.2)",
                      border: "1px solid var(--accent-emerald)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      color: "var(--accent-emerald)",
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Automatic PC Binding & Kill Switch</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      When the user runs the bot, their PC Hardware ID will automatically bind to your dashboard.
                      You can suspend their access anytime with a single click on the Power icon!
                    </p>
                  </div>
                </div>
              </div>
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
                  App Name (Which software is this license for?)
                </label>
                <input
                  type="text"
                  className="input-glass"
                  list="appNameList"
                  placeholder="e.g. InstaBot, YoutubeTool (leave blank = works for all apps)"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                />
                <datalist id="appNameList">
                  {appList.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
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
