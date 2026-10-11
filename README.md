# 🛡️ CYBER-AUTH // BAS 3D License Commander

A futuristic, high-security **License Management & Hardware ID (HWID) Protection System** tailored specifically for **Browser Automation Studio (BAS)** bots.

---

## ✨ Features

- **Cyberpunk 3D Glassmorphism UI:** Ultra-modern dark aesthetic with neon glowing metrics, 3D cards, and micro-animations.
- **Hardware ID (HWID) Auto-Binding:** When a client runs the bot for the first time, their unique PC Hardware ID is automatically bound to their license. They cannot share the bot with anyone else.
- **One-Click Kill Switch:** Instantly deactivate or suspend any user's license right from the dashboard.
- **Expiry Date Management:** Set trial or subscription end dates with quick presets (+7d, +30d, +1y, Lifetime).
- **One-Click HWID Reset:** Easily unbind a client's device if they change their PC or reinstall Windows.
- **Live Security Audit Stream:** Real-time logging of all bot verification requests, IP addresses, and rejection reasons.
- **Built-in BAS Script Generator:** Generates copy-paste ready JavaScript for BAS `Execute code` blocks.
- **Flexible Database Architecture:** Works out-of-the-box with built-in memory storage for instant testing, and seamlessly connects to **Google Firebase Firestore** for 24/7 persistent cloud storage.

---

## 🚀 Running Locally

```bash
# 1. Navigate to the project folder
cd license-dashboard

# 2. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Default Master Admin Password:** `admin1234` (Change in `.env.local`)

---

## 🌐 Deploy to GitHub & Vercel (100% Free Hosting)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit of CYBER-AUTH License Commander"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [Vercel.com](https://vercel.com) and Sign In with your GitHub account.
2. Click **"Add New Project"** and select your GitHub repository.
3. In **Environment Variables**, add:
   - `ADMIN_PASSWORD` = `YourSecretAdminPassword`
4. Click **Deploy**!
5. In under 60 seconds, your dashboard will be live with a URL like `https://your-bot-admin.vercel.app`!

---

## 🔌 Connecting to Browser Automation Studio (BAS)

### Step 1: Create Resources in BAS
In your BAS project, go to **Resources** and create:
1. `LicenseUser` (Fixed String / Text line from user)
2. `LicensePass` (Password / Text line from user)

### Step 2: Add "Execute code" Block
At the **very beginning** of your BAS script (before browser initialization):
1. Add an **Execute code** block.
2. Paste the following code:

```javascript
// ==========================================
// BAS CYBER-AUTH LICENSE VERIFICATION CODE
// ==========================================
// 1. Get credentials from BAS resources:
var username = {{LicenseUser}};
var password = {{LicensePass}};

// 2. Extract unique PC Hardware ID (HWID):
var hwid = native("sysinfo", "baseboard_serial_number", "") + "_" + native("sysinfo", "cpu_name", "");
hwid = btoa(hwid.trim()); // Safe Base64 encoding

// 3. Your Live Dashboard Verification Endpoint:
// (Replace with your actual Vercel URL when deployed)
var serverUrl = "https://your-app.vercel.app/api/verify"; 

var verifyApi = serverUrl + "?username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password) + "&hwid=" + encodeURIComponent(hwid);

// 4. Send HTTP verification request:
var response = http_client_get2(verifyApi, { method: "GET" });
var result = JSON.parse(response.content);

// 5. Check validation response:
if (result.status !== "success") {
    fail("ACCESS DENIED: " + (result.message || "Invalid License Credentials"));
}

log(">>> LICENSE VALIDATED SUCCESSFULLY! Client: " + result.clientName + " (Days left: " + result.daysRemaining + ")");
```

---

## 🔥 Optional: Connect Firebase for 24/7 Cloud Database

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a free project.
2. Go to **Firestore Database** > **Create database** (Start in test mode or production).
3. Go to **Project Settings** (Gear icon) > **General** > **Your apps** > Web (</>) and register an app.
4. Copy the config keys and paste them into your Vercel Environment Variables or `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## 🔒 Securing Your Compiled BAS .EXE (Antitamper & Packing)

After compiling your BAS bot into a standalone `.exe`:
1. Download **Enigma Virtual Box** (Free from `enigmaprotector.com/en/aboutvb.html`).
2. Select your compiled bot's main `.exe`.
3. Compress and pack it into a single protected binary.
4. This prevents ordinary users from inspecting the files, extracting resources, or decompiling the source code!
