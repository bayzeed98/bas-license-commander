import { db, isFirebaseConfigured } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Local fallback store (used only if Firebase credentials are not yet configured)
let memoryUsers = [];
let memoryLogs = [];
let memoryAdmin = null;

export async function getAdminCredentials() {
  const defaultUsername = process.env.ADMIN_USERNAME || "admin";
  const defaultPassword = process.env.ADMIN_PASSWORD || "admin1234";

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "settings", "admin_auth");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          username: data.username || defaultUsername,
          password: data.password || defaultPassword,
        };
      }
    } catch (e) {
      console.error("Firestore getAdminCredentials error:", e);
    }
  }

  return {
    username: memoryAdmin?.username || defaultUsername,
    password: memoryAdmin?.password || defaultPassword,
  };
}

export async function updateAdminCredentials(newUsername, newPassword) {
  const cleanUser = (newUsername || "").trim();
  const cleanPass = (newPassword || "").trim();

  if (!cleanUser || !cleanPass) {
    throw new Error("Username and password cannot be empty");
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "settings", "admin_auth");
      await setDoc(docRef, {
        username: cleanUser,
        password: cleanPass,
        updatedAt: new Date().toISOString(),
      });
      return { username: cleanUser };
    } catch (e) {
      console.error("Firestore updateAdminCredentials error:", e);
      throw new Error(`Failed to update credentials in Firestore: ${e.message}`);
    }
  }

  memoryAdmin = { username: cleanUser, password: cleanPass };
  return { username: cleanUser };
}

export async function getAllUsers() {
  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return { users: list, error: null };
    } catch (e) {
      console.error("Firestore getAllUsers error:", e);
      return { users: [...memoryUsers], error: e.message || e.code };
    }
  }
  return { users: [...memoryUsers], error: null };
}

// ---------------- App registry ----------------
let memoryApps = [];

export async function getAllApps() {
  if (isFirebaseConfigured && db) {
    try {
      const snapshot = await getDocs(collection(db, "apps"));
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      return list;
    } catch (e) {
      console.error("Firestore apps error:", e);
    }
  }
  return [...memoryApps];
}

export async function createApp({ name, description }) {
  const clean = name.trim();
  const existing = await getAllApps();
  if (existing.some((a) => (a.name || "").toLowerCase() === clean.toLowerCase())) {
    return { duplicate: true };
  }

  const newApp = {
    name: clean,
    description: description?.trim() || "",
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "apps"), newApp);
      return { app: { id: docRef.id, ...newApp } };
    } catch (e) {
      console.error("Firestore apps error:", e);
      throw new Error(`Firebase Permission/Connection Error: ${e.message}`);
    }
  }

  const created = { id: "app_" + Date.now(), ...newApp };
  memoryApps.push(created);
  return { app: created };
}

export async function deleteApp(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "apps", id));
      return true;
    } catch (e) {
      console.error("Firestore apps error:", e);
      throw new Error(`Firebase Permission/Connection Error: ${e.message}`);
    }
  }
  const before = memoryApps.length;
  memoryApps = memoryApps.filter((a) => a.id !== id);
  return memoryApps.length < before;
}

export async function getUserById(id) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (e) {
      console.error("Firestore error:", e);
    }
  }
  return memoryUsers.find((u) => u.id === id) || null;
}

const normApp = (a) => (a || "").trim().toLowerCase();

// Returns all licenses sharing a username (they may belong to different apps)
export async function getUsersByUsername(username) {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (e) {
      console.error("Firestore error:", e);
    }
  }
  return memoryUsers.filter((u) => u.username.toLowerCase() === username.toLowerCase());
}

// Finds the license for a username within a specific app.
// A license with an empty appName is a legacy/universal license valid for any app.
export async function getUserByUsername(username, appName) {
  const list = await getUsersByUsername(username);
  const target = normApp(appName);
  return (
    list.find((u) => normApp(u.appName) === target && target !== "") ||
    list.find((u) => normApp(u.appName) === "") ||
    null
  );
}

// Strict check used when creating licenses (same username + same app only)
export async function findExactUser(username, appName) {
  const list = await getUsersByUsername(username);
  return list.find((u) => normApp(u.appName) === normApp(appName)) || null;
}

export async function createUser(userData) {
  const newUser = {
    username: userData.username.trim(),
    password: userData.password.trim(),
    clientName: userData.clientName?.trim() || "Client",
    appName: userData.appName?.trim() || "",
    hwid: userData.hwid || "",
    expiresAt: userData.expiresAt || "",
    isActive: userData.isActive !== false,
    allowMultiDevice: Boolean(userData.allowMultiDevice),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };

  if (isFirebaseConfigured && db) {
    try {
      const col = collection(db, "users");
      const docRef = await addDoc(col, newUser);
      return { id: docRef.id, ...newUser };
    } catch (e) {
      console.error("Firestore createUser error:", e);
      throw new Error(`Firebase Permission/Connection Error: ${e.message}`);
    }
  }

  const memoryId = "usr_" + Date.now();
  const created = { id: memoryId, ...newUser };
  memoryUsers.unshift(created);
  return created;
}

export async function updateUser(id, updates) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "users", id);
      await updateDoc(docRef, updates);
      return true;
    } catch (e) {
      console.error("Firestore updateUser error:", e);
      throw new Error(`Firebase Permission/Connection Error: ${e.message}`);
    }
  }

  const idx = memoryUsers.findIndex((u) => u.id === id);
  if (idx !== -1) {
    memoryUsers[idx] = { ...memoryUsers[idx], ...updates };
    return true;
  }
  return false;
}

export async function deleteUser(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "users", id));
      return true;
    } catch (e) {
      console.error("Firestore deleteUser error:", e);
      throw new Error(`Firebase Permission/Connection Error: ${e.message}`);
    }
  }

  const initialLen = memoryUsers.length;
  memoryUsers = memoryUsers.filter((u) => u.id !== id);
  return memoryUsers.length < initialLen;
}

export async function logVerification({ username, hwid, ip, status, message, appName }) {
  const logEntry = {
    username: username || "unknown",
    appName: appName || "",
    hwid: hwid || "unknown",
    ip: ip || "unknown",
    status,
    message,
    timestamp: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, "logs"), {
        ...logEntry,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Firestore log error:", e);
    }
  }

  memoryLogs.unshift({ id: "log_" + Date.now(), ...logEntry });
  if (memoryLogs.length > 100) memoryLogs.pop();
}

export async function getRecentLogs(max = 20) {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, "logs"),
        orderBy("createdAt", "desc"),
        limit(max)
      );
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (e) {
      console.error("Firestore get logs error:", e);
    }
  }
  return memoryLogs.slice(0, max);
}
