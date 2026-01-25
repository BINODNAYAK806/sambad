# Quick Fix for Windows Build Issues

## The Error You're Seeing

```
'scripts\force-clean.bat' is not recognized as an internal or external command
```

## Why This Happens

The `.bat` file exists in the remote/cloud development environment but hasn't been synced to your local Windows PC.

---

## ✅ SOLUTION: Use npm instead

**Just run this:**

```cmd
cd C:\Users\lenovo\Downloads\sam-12\sam-12
npm run clean
```

**Then rebuild:**

```cmd
npm run dist:win
```

That's it! The npm clean script does the same thing and works on all platforms.

---

## If npm clean Doesn't Work

1. **Close the app completely** (Check Task Manager)
2. **Delete folders manually:**
   ```cmd
   rmdir /s /q release
   rmdir /s /q dist
   rmdir /s /q dist-electron
   ```
3. **Run the build:**
   ```cmd
   npm run dist:win
   ```

---

## Need More Help?

See `WINDOWS_CLEANUP_GUIDE.md` for detailed instructions.
