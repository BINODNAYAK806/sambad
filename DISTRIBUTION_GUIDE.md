# Sambad - Distribution Guide

This guide explains how to package and distribute the Sambad WhatsApp Campaign Manager for testing on other computers.

## Prerequisites

Before building distributable packages, ensure you have:

1. Node.js and npm installed
2. All dependencies installed (`npm install`)
3. The app builds successfully (`npm run build`)
4. App icons in the `build/` directory (see `build/ICONS_README.md`)

## Quick Start

### Build for Your Current Platform

```bash
npm run dist
```

This will create a distributable installer for your current platform (Windows, macOS, or Linux) in the `release/` directory.

### Build for Specific Platforms

```bash
# Windows installer (.exe)
npm run dist:win

# macOS installer (.dmg)
npm run dist:mac

# Linux packages (.AppImage and .deb)
npm run dist:linux
```

## Distribution Files Location

After building, your distributable files will be in the `release/` directory:

- **Windows:** `release/Sambad-1.0.0-Setup.exe`
- **macOS:** `release/Sambad-1.0.0-x64.dmg` and `release/Sambad-1.0.0-arm64.dmg`
- **Linux:** `release/Sambad-1.0.0-x64.AppImage` and `release/Sambad-1.0.0-x64.deb`

## Preparing for Distribution

### 1. Update App Information

Edit `package.json` and update:

```json
{
  "name": "sambad",
  "productName": "Sambad",
  "version": "1.0.0",
  "description": "WhatsApp Campaign Manager Desktop Application",
  "author": "Your Name or Company"
}
```

### 2. Add App Icons

Place your app icons in the `build/` directory:
- `build/icon.ico` (Windows)
- `build/icon.icns` (macOS)
- `build/icon.png` (Linux)

See `build/ICONS_README.md` for icon requirements and creation tips.

### 3. Configure Environment Variables

Create a `.env.example` file with placeholders for required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

This file will be included with the distribution so users know what to configure.

### 4. Test the Build

Before distributing, test the packaged app on your machine:

1. Build the installer: `npm run dist`
2. Install the app from the generated installer
3. Verify all features work correctly
4. Check WhatsApp connection functionality
5. Test with sample campaigns and contacts

## Distributing to Testers

### Option 1: Cloud Storage

1. Upload the installer file(s) to a cloud storage service:
   - Google Drive
   - Dropbox
   - OneDrive
   - WeTransfer

2. Share the download link with testers

3. Include setup instructions (see below)

### Option 2: GitHub Releases

1. Create a GitHub repository for your project
2. Create a new release (tag)
3. Upload the installer files as release assets
4. Share the release page URL

### Option 3: Direct File Sharing

For local networks or direct sharing:
- USB drive
- Network file share
- Email (if file size permits)

## Tester Setup Instructions

Create a document for testers with these instructions:

### For Windows Users

1. Download `Sambad-1.0.0-Setup.exe`
2. Double-click the installer
3. If you see a Windows SmartScreen warning, click "More info" then "Run anyway"
4. Follow the installation wizard
5. Create a `.env` file in the installation directory with your Supabase credentials
6. Launch Sambad from the Start Menu or Desktop shortcut

### For macOS Users

1. Download `Sambad-1.0.0-x64.dmg` (Intel) or `Sambad-1.0.0-arm64.dmg` (Apple Silicon)
2. Open the DMG file
3. Drag Sambad to the Applications folder
4. Right-click Sambad in Applications and select "Open" (required for first launch)
5. Create a `.env` file in `~/Library/Application Support/Sambad/` with your Supabase credentials
6. Launch the app

### For Linux Users

#### AppImage
1. Download `Sambad-1.0.0-x64.AppImage`
2. Make it executable: `chmod +x Sambad-1.0.0-x64.AppImage`
3. Run: `./Sambad-1.0.0-x64.AppImage`
4. Create a `.env` file in `~/.config/Sambad/` with your Supabase credentials

#### DEB Package
1. Download `Sambad-1.0.0-x64.deb`
2. Install: `sudo dpkg -i Sambad-1.0.0-x64.deb`
3. If dependencies are missing: `sudo apt-get install -f`
4. Create a `.env` file in `~/.config/Sambad/` with your Supabase credentials
5. Launch from applications menu or run `sambad`

## Environment Variables Setup

Testers will need to configure these environment variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Where to place the .env file:

- **Windows:** `%APPDATA%\Sambad\.env` or installation directory
- **macOS:** `~/Library/Application Support/Sambad/.env`
- **Linux:** `~/.config/Sambad/.env`

Alternatively, you can bundle the environment variables directly in the app (not recommended for production).

## Troubleshooting

### Windows SmartScreen Warning

This is normal for unsigned applications. Users need to:
1. Click "More info"
2. Click "Run anyway"

To avoid this, you need a code signing certificate (costs money).

### macOS Gatekeeper Warning

For unsigned apps, users need to:
1. Right-click the app
2. Select "Open"
3. Click "Open" in the dialog

To avoid this, you need an Apple Developer certificate and notarization.

### Build Errors

If the build fails:

1. Ensure all dependencies are installed: `npm install`
2. Clean build directories: `rm -rf dist dist-electron release`
3. Rebuild: `npm run build`
4. Try building again: `npm run dist`

### Large Build Size

The first build downloads platform-specific dependencies and may take several minutes. Subsequent builds will be faster.

## Advanced Configuration

### Code Signing (Optional)

For production distribution, consider code signing:

#### Windows
- Get a code signing certificate
- Add to `electron-builder.json5`:
```json5
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

#### macOS
- Join Apple Developer Program
- Add to `electron-builder.json5`:
```json5
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)"
}
```

### Auto-Updates (Optional)

To enable automatic updates, you'll need to:
1. Set up an update server or use services like electron-updater
2. Configure update settings in `electron-builder.json5`
3. Implement update checking in your app

### Reducing Bundle Size

1. Enable code splitting in vite.config.ts
2. Remove unused dependencies
3. Use production builds only
4. Consider compression options in electron-builder

## Building on CI/CD

For automated builds, consider:

- **GitHub Actions:** Build on push/tag
- **GitLab CI:** Similar to GitHub Actions
- **Jenkins:** Custom pipeline

Example GitHub Actions workflow:

```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run dist
      - uses: actions/upload-artifact@v2
        with:
          name: ${{ matrix.os }}
          path: release/*
```

## Cross-Platform Building

You can build for different platforms from a single machine:

- **From Windows:** Can build for Windows only (without additional tools)
- **From macOS:** Can build for macOS, Windows, and Linux
- **From Linux:** Can build for Linux and Windows (with wine)

For true cross-platform builds, use CI/CD or dedicated build servers.

## Support and Issues

When testers report issues, ask for:

1. Operating system and version
2. Installation method used
3. Error messages or screenshots
4. Steps to reproduce the issue
5. Console logs (if available)

## Next Steps

1. Build your first distributable: `npm run dist`
2. Test the installer on your machine
3. Share with a small group of testers
4. Gather feedback and iterate
5. Fix any reported issues
6. Prepare for wider distribution

## Resources

- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [Publishing and Updates](https://www.electron.build/configuration/publish)
