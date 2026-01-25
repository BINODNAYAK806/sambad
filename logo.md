# How to Add a Custom Logo to Your App

Follow these steps to replace the default Electron icon with your custom logo for the application, installer, and desktop shortcuts.

## 1. Prepare Your Logo Files

You need your logo in two formats:
1. **`icon.ico`** (Required for Windows)
   - Size: At least 256x256 pixels.
   - You can convert a PNG to ICO using online tools like [ConvertICO](https://convertico.com/).
2. **`icon.png`** (Required for Window Title Bar & Linux)
   - Size: 512x512 pixels recommended.
   - Transparent background looks best.

## 2. Create the Build Directory

1. Go to the root folder of the project (`d:\sam-12`).
2. Create a new folder named `build`.
   > **Note:** If it typically doesn't verify existence, just create it: Right-click -> New -> Folder, name it `build`.

## 3. Place Your Icons

Copy your prepared files into the `build` folder:
- `d:\sam-12\build\icon.ico`
- `d:\sam-12\build\icon.png`

## 4. Verify Configuration

The project is already configured to look for these files.
- **Windows Installer:** Uses `build/icon.ico` (Configured in `package.json`).
- **Window Icon:** To show the logo in the top-left of the app window while running, we recommend verifying the code handles it (see below).

### Optional: Update Code for Development Icon
To ensure the icon shows up immediately when you run `npm run dev`, open `electron/main/index.ts` and ensure the BrowserWindow creation includes the icon path:

```typescript
// Add this near the top of createWindow()
const iconPath = path.join(__dirname, '../../build/icon.png');

// In the new BrowserWindow config:
mainWindow = new BrowserWindow({
  // ... other settings ...
  icon: iconPath, // Add this line
});
```

## 5. Build the App

To generate the final Windows installer with your new logo:

```bash
npm run dist:win
```

This will create a `dist` folder containing `Sambad-Setup-1.2.0.exe` which will have your custom icon.

## 6. How to Rename the App (e.g., to "Pingo")

To change the application name from "Sambad" to "Pingo", follow these steps:

### A. Update `package.json`
Open `package.json` and change the following fields:

```json
{
  "name": "pingo",            // Lowercase, no spaces, url-safe
  "productName": "Pingo",     // Display name (shows in Add/Remove programs)
  "description": "Pingo - Smart Marketing . Safe Sending",
  "build": {
    "appId": "com.pingo.whatsapp", // Unique ID
    "productName": "Pingo"     // Build product name
  }
}
```

### B. Update Window Title
Open `electron/main/index.ts` and find the `createWindow` function:

```typescript
mainWindow = new BrowserWindow({
  // ...
  title: 'Pingo - Smart Marketing . Safe Sending', // Change title here
  // ...
});
```

### C. Update Login Page (Optional)
Open `src/renderer/pages/LoginPage.tsx` and text references:

```tsx
// Change "Welcome to Sambad..." to "Welcome to Pingo..."
<CardDescription>Welcome to Pingo Campaign Manager</CardDescription>

// Change footer version text
<p>Pingo v1.2.0 • Local Secure Node</p>
```

### D. Rebuild
After these changes, run `npm run build` or `npm run dist:win` to generate the application with the new name.

