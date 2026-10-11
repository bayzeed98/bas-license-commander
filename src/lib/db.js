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

// Local fallback store (used if Firebase credentials are not yet configured)
let memoryUsers = [
  {
    id: "usr_demo1",
    username: "client_vip",
    password: "vip12345password",
    clientName: "VIP Client (Demo)",
    hwid: "", // Empty: will bind on first run
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days
    isActive: true,
    allowMultiDevice: false,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  },
  {
    id: "usr_demo2",
    username: "john_doe",
    password: "secure_pass_99",
    clientName: "John Doe",
    hwid: "BASEBOARD1234-CORE-I7",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days
    isActive: true,
    allowMultiDevice: false,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
  },
  {
    id: "usr_demo3",
    username: "expired_user",
    password: "oldpassword",
    clientName: "Trial Expired",
    hwid: "OLD-HWID-5566",
    expiresAt: "2024-01-01",
    isActive: false,
    allowMultiDevice: false,
    createdAt: new Date().toISOString(),
    lastUsedAt: "2024-01-01T12:00:00Z",
  },
];

let memoryLogs = [
  {
    id: "log_1",
    username: "client_vip",
    hwid: "NEW-DEVICE-XYZ",
    ip: "103.14.22.1",
    status: "SUCCESS",
    message: "License verified successfully",
    timestamp: new Date().toISOString(),
  },
  {
    id: "log_2",
    username: "expired_user",
    hwid: "OLD-HWID-5566",
    ip: "182.16.10.4",
    status: "BLOCKED",
    message: "Subscription expired",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

export async function getAllUsers() {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      return list;
    } catch (e) {
      console.error("Firestore error, falling back to memory:", e);
    }
  }
  return [...memoryUsers];
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
      console.error("Firestore error:", e);
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
      console.error("Firestore error:", e);
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
      console.error("Firestore error:", e);
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
