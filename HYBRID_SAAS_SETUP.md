# Sambad Hybrid SaaS Setup & Licensing Guide

This document explains the architecture and setup process for the Sambad Hybrid SaaS model, combining Cloud Licensing (Supabase) with Local Data Management (SQLite).

---

## 1. Licensing Workflow

### **A. License Creation**
Currently, licenses are created manually in the Supabase `licenses` table.
1.  **Open Supabase SQL Editor** or **Table Editor**.
2.  **Insert a new row** into the `licenses` table:
    -   `license_key`: A unique string (e.g., `SAMBAD-PRO-2024`).
    -   `mobile`: The registered mobile number (e.g., `9876543210`).
    -   `status`: Set to `INACTIVE`.
    -   `device_id`: Leave `NULL`.

### **B. Activation Process**
When a user launches the app for the first time:
1.  **User Input**: The user enters their `License Key` and `Mobile Number`.
2.  **Hardware Binding**: The app generates a unique `device_id` using `node-machine-id`.
3.  **Cloud Verification**: The app calls the Supabase RPC `verify_license`.
    -   It checks if the key and mobile match.
    -   It checks if the key is already bound to a different `device_id`.
4.  **Device Lock**: If valid, Supabase saves the `device_id` to that license and returns success.
5.  **Local Persistence**: Upon success, the app saves the activation status locally in SQLite (`system_settings` table).

---

## 2. Supabase Setup (Step-by-Step)

Follow these steps to configure your Supabase backend:

### **Step 1: SQL Schema (IMPORTANT: Copy ONLY the code inside the block)**
Run the following SQL in your Supabase SQL Editor. 
> [!IMPORTANT]
> **Do NOT copy the triple backticks (```sql or ```).** Copy only the text between them.

```sql
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Licenses Table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key TEXT UNIQUE NOT NULL,
  mobile TEXT NOT NULL,
  device_id TEXT, -- Bound to a specific computer
  status TEXT DEFAULT 'INACTIVE', -- INACTIVE, ACTIVE, REVOKED
  expiry_date TIMESTAMPTZ, -- Initial: NOW() (0 days)
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Supporting Tables for Auth
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_sessions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Set Permissions for Direct App Access
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Explicitly Grant table permissions
GRANT ALL ON TABLE licenses TO anon;
GRANT ALL ON TABLE licenses TO authenticated;
GRANT ALL ON TABLE licenses TO service_role;

-- Allow SELECT, INSERT, and UPDATE for Anonymous users
DROP POLICY IF EXISTS "Allow anon select" ON licenses;
CREATE POLICY "Allow anon select" ON licenses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert" ON licenses;
CREATE POLICY "Allow anon insert" ON licenses FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update" ON licenses;
CREATE POLICY "Allow anon update" ON licenses FOR UPDATE TO anon USING (true);
```

### **Step 2: Environment Variables**
Update your `.env` file in the root directory:
```env
# Supabase Credentials
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Step 3: Verification (MANDATORY)**
Run this in your SQL Editor. If it returns **0 rows**, the Licensing feature will NOT work.
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'licenses';
```

---

## 3. Local Authentication (SQLite)

Once the app is activated, it uses a local authentication system for day-to-day operations.

-   **Initial Admin**: On the first run, a default user is created:
    -   **Username**: `admin`
    -   **Password**: `admin123`
-   **Staff Management**: Admins can create Staff accounts via **Settings > Users**.
-   **Security**: Passwords are hashed locally using SHA-256.

---

## 4. Emergency Backdoor

If an admin is locked out, use the built-in backdoor:
1.  On the Login screen, **Click the User Icon 5 times**.
2.  The UI will switch to **Emergency Access Mode**.
3.  **Password Formula**: `sambad_backdoor_[DAY_OF_MONTH]`
    -   Example: If today is the 28th, the password is `sambad_backdoor_28`.

---

## 5. 3-Day Trial Period

The application includes a built-in grace period for new users:

-   **Activation**: On the activation screen, users can click **"Start 3-Day Free Trial"**.
-   **Mobile Registration**: Users must provide a mobile number to start the trial.
-   **Local Tracking**: The trial start date is saved in the local SQLite database.
-   **Expiration**: After 72 hours (3 days), the app will automatically block access and return the user to the Activation screen.
-   **Upgrade**: Users can enter a valid license key at any time during the trial to upgrade to the full lifetime version.
-   **Persistence**: The trial is tracked locally; deleting the local database will reset the trial period (intended for development/easy demo resets).
