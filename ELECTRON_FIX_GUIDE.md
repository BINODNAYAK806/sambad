# Electron Desktop App - Fixed!

## What Was Fixed

The issue was that the preload script was being compiled as an ES Module instead of CommonJS, which Electron requires. This has been fixed by:

1. **Created separate TypeScript config** for the preload script (`tsconfig.preload.json`)
2. **Changed module format** from ES2022 to CommonJS for the preload script
3. **Updated build process** to compile preload script separately
4. **Added comprehensive logging** to help diagnose any future issues
5. **Added sample contact download** feature in the import dialog

## How to Run the Application

**IMPORTANT: You MUST restart the dev server completely after the build!**

### Step 1: Stop the Current Dev Server

If the dev server is still running, press `Ctrl+C` in the terminal to stop it.

### Step 2: Start Fresh

```bash
npm run dev
```

This will:
- Start the Vite dev server on port 5173
- Build the Electron main and preload scripts
- Launch the Electron desktop app

### Step 3: Verify It's Working

When the app starts, you should see these logs in the console:

```
[Preload] Starting preload script
[Preload] electronAPI successfully exposed to window object
[WhatsApp] Component mounted
[WhatsApp] window.electronAPI exists: true
[WhatsApp] electronAPI found, setting up listeners
```

If you see these logs, the Electron API is working correctly!

## Using the Application

### 1. Import Contacts

1. Go to the **Contacts** page
2. Click **Import Contacts**
3. Click **Download Sample CSV** to get a template
4. Fill in your contacts following the format:
   - **Required:** phone, name
   - **Optional:** v1-v10 (custom variables for message personalization)
5. Upload your CSV/Excel file
6. Click Import

### 2. Connect WhatsApp

1. Go to the **Home** page
2. Find the **WhatsApp Connection** section
3. Click **Connect WhatsApp**
4. Scan the QR code with your WhatsApp mobile app
5. Wait for "WhatsApp connected successfully"

### 3. Create and Run a Campaign

1. Go to the **Campaigns** page
2. Click **Create Campaign**
3. Fill in:
   - Campaign name
   - Select contact group
   - Write message template (use {{name}}, {{v1}}, etc. for personalization)
   - Choose delay settings (Safe, Moderate, or Fast)
4. Click **Create Campaign**
5. Click the **Play** button to start the campaign
6. Monitor progress in real-time

## Sample Contact Format

The downloadable sample CSV includes:

```csv
phone,name,v1,v2,v3,v4,v5,v6,v7,v8,v9,v10
+1234567890,John Doe,Variable 1,Variable 2,,,,,,,
+0987654321,Jane Smith,Value A,Value B,Value C,,,,,,
+1122334455,Bob Johnson,Test 1,Test 2,Test 3,Test 4,,,,,
```

## Message Template Variables

Use these in your message templates:

- `{{name}}` - Contact name
- `{{phone}}` - Contact phone number
- `{{v1}}` to `{{v10}}` - Custom variables from your contact import

Example:
```
Hello {{name}}!

Your order {{v1}} is ready for pickup.
Amount: {{v2}}

Thank you!
```

## Troubleshooting

### If You Still See "Desktop App Required" Error:

1. **Stop the dev server completely** (Ctrl+C)
2. **Clear any cached builds:**
   ```bash
   rm -rf dist dist-electron
   ```
3. **Rebuild everything:**
   ```bash
   npm run build
   ```
4. **Start fresh:**
   ```bash
   npm run dev
   ```

### Check Console Logs

Open DevTools in the Electron window (it opens automatically in dev mode) and check the Console tab for any errors.

## Production Build

To create a production build:

```bash
npm run build
```

The built files will be in:
- `dist/` - Renderer (React app)
- `dist-electron/` - Main process and preload scripts

## Key Features

1. **WhatsApp Integration** - Connect via QR code, send messages
2. **Contact Management** - Import from CSV/Excel, manage groups
3. **Campaign System** - Create, schedule, and run message campaigns
4. **Smart Delays** - Anti-ban protection with configurable delays
5. **Progress Tracking** - Real-time campaign monitoring
6. **Message Templates** - Use variables for personalized messages
7. **Duplicate Detection** - Automatically find and remove duplicates

## Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify `window.electronAPI` is defined
3. Ensure you're running the app via `npm run dev` (not opening the HTML file directly)
4. Make sure all dependencies are installed (`npm install`)
