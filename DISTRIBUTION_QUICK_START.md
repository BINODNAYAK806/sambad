# Quick Distribution Guide

## TL;DR - How to Create an Installer for Testing

### Step 1: Build the Installer

Choose the command for your target platform:

```bash
# For Windows (creates .exe installer)
npm run dist:win

# For macOS (creates .dmg installer)
npm run dist:mac

# For Linux (creates .AppImage and .deb)
npm run dist:linux

# For your current platform automatically
npm run dist
```

### Step 2: Find Your Installer

After building (takes 5-10 minutes first time), look in the `release/` folder:

- **Windows:** `release/Sambad-1.0.0-Setup.exe`
- **macOS:** `release/Sambad-1.0.0-x64.dmg` or `release/Sambad-1.0.0-arm64.dmg`
- **Linux:** `release/Sambad-1.0.0-x64.AppImage` or `release/Sambad-1.0.0-x64.deb`

### Step 3: Share with Testers

1. Upload the installer to Google Drive, Dropbox, or similar
2. Share the link with testers
3. Send them the setup instructions below

## Tester Instructions

### Windows
1. Download `Sambad-1.0.0-Setup.exe`
2. Run the installer
3. If Windows warns you, click "More info" → "Run anyway"
4. Follow the installation wizard

### macOS
1. Download the .dmg file
2. Open it and drag Sambad to Applications
3. Right-click Sambad in Applications and select "Open" (first time only)

### Linux
1. Download the .AppImage file
2. Make executable: `chmod +x Sambad-1.0.0-x64.AppImage`
3. Run: `./Sambad-1.0.0-x64.AppImage`

## Important Notes

### Environment Variables
Testers need to configure Supabase connection. Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Place it in:
- **Windows:** `C:\Users\[Username]\AppData\Roaming\Sambad\.env`
- **macOS:** `~/Library/Application Support/Sambad/.env`
- **Linux:** `~/.config/Sambad/.env`

### First Build Takes Time
- The first `npm run dist` can take 5-15 minutes
- It downloads platform-specific build tools
- Subsequent builds are much faster (2-5 minutes)

### Icons (Optional)
To customize the app icon, add these files to the `build/` directory before building:
- `build/icon.ico` (Windows)
- `build/icon.icns` (macOS)
- `build/icon.png` (Linux)

See `build/ICONS_README.md` for details.

## Troubleshooting

### Build fails with "command not found"
```bash
npm install
```

### Release folder is empty
Check the console output for errors. Common fixes:
```bash
rm -rf dist dist-electron release
npm run build
npm run dist
```

### App doesn't start after installation
- Ensure the .env file is in the correct location
- Check that Supabase credentials are correct
- Look for error logs in the app's data directory

## Common Issues for Testers

### Windows Security Warning
This is normal for unsigned apps. Click "More info" → "Run anyway"

### macOS Gatekeeper Block
Right-click the app → Select "Open" → Click "Open" in dialog

### Linux Permission Denied
Make the AppImage executable: `chmod +x Sambad-*.AppImage`

## Need More Details?

See the full `DISTRIBUTION_GUIDE.md` for:
- Advanced configuration
- Code signing
- Auto-updates
- CI/CD integration
- Cross-platform building

## Quick Checklist

Before distributing:
- [ ] Update version in package.json
- [ ] Test the app locally (`npm run dev`)
- [ ] Build successfully (`npm run build`)
- [ ] Create distributable (`npm run dist`)
- [ ] Test the installer on your machine
- [ ] Document any setup requirements
- [ ] Prepare Supabase credentials or instructions
- [ ] Create a feedback collection method

## Example Distribution Email

```
Subject: Sambad WhatsApp Campaign Manager - Testing Version 1.0.0

Hi [Tester Name],

I'm sharing the Sambad app for testing. Here's how to get started:

1. Download the installer: [Your Download Link]

2. Install the app:
   - Windows: Run the .exe file (click "Run anyway" if warned)
   - Mac: Open the .dmg and drag to Applications
   - Linux: Make the .AppImage executable and run it

3. Set up Supabase connection:
   Create a .env file with these credentials:
   VITE_SUPABASE_URL=[provide URL]
   VITE_SUPABASE_ANON_KEY=[provide key]

   Location:
   - Windows: C:\Users\[YourName]\AppData\Roaming\Sambad\.env
   - Mac: ~/Library/Application Support/Sambad/.env
   - Linux: ~/.config/Sambad/.env

4. Launch the app and test features:
   - WhatsApp connection
   - Contact management
   - Campaign creation
   - Message sending

Please report any issues or feedback to [your email/platform].

Thank you for testing!
```

## Support

For issues:
1. Check the console logs in the app
2. Verify environment variables are set correctly
3. Ensure WhatsApp Web is working in a regular browser
4. Contact the development team with:
   - Operating system and version
   - Error messages or screenshots
   - Steps to reproduce the issue
