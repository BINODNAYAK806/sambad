/**
 * Converts a local file path to an app-data:// protocol URL
 * to bypass Electron's "Not allowed to load local resource" restriction.
 */
export function toLocalUrl(path: string | undefined): string {
  if (!path) return '';

  // If it's already a URL (blob, http, https, app-data), return as is
  if (
    path.startsWith('blob:') ||
    path.startsWith('http:') ||
    path.startsWith('https:') ||
    path.startsWith('app-data://') ||
    path.startsWith('data:')
  ) {
    return path;
  }

  // Handle Windows paths (C:\..., D:\...) and Unix paths (/...)
  // We want to extract the path relative to what the protocol handler expects.
  // The protocol handler in main/index.ts joins the request URL with app.getPath('userData').
  // If the path already contains the userData path, we need to make it relative or just strip it.

  // For this app, we know userData is 'D:/Wapro/AppData' (or similar)
  // But to be safe, we'll try to identify if it's a full path and just pass the relevant part
  // or the whole path if main handles it.

  // Simplest approach: main handler strips 'app-data://' and joins with userData.
  // If we pass an absolute path that STARTS with userData, we should strip userData.

  const userDataPath = 'D:/Wapro/AppData'; // Hardcoded for now as we know it's redirected
  const normalizedPath = path.replace(/\\/g, '/');
  const normalizedUserData = userDataPath.replace(/\\/g, '/');

  if (normalizedPath.startsWith(normalizedUserData)) {
    let relativePath = normalizedPath.slice(normalizedUserData.length);
    if (relativePath.startsWith('/')) relativePath = relativePath.slice(1);
    return `app-data://${relativePath}`;
  }

  // If it's not starting with userData but it's an absolute path,
  // it might be a problem because the handler ONLY serves from userData.
  // However, most campaign media IS in userData.

  // Just return app-data:// + the path for now, the main handler will join it.
  // If it's a full path like 'D:/Wapro/AppData/media/foo.png',
  // and we send 'app-data://D:/Wapro/AppData/media/foo.png',
  // the handler will join 'D:/Wapro/AppData' + 'D:/Wapro/AppData/media/foo.png' -> WRONG.

  // So we MUST return only the relative part if possible.
  // Let's look for known subdirectories.
  const knownDirs = ['campaign_media', 'temp', 'logs'];
  for (const dir of knownDirs) {
    const index = normalizedPath.indexOf(`/${dir}/`);
    if (index !== -1) {
      return `app-data://${normalizedPath.slice(index + 1)}`;
    }
    if (normalizedPath.startsWith(`${dir}/`)) {
      return `app-data://${normalizedPath}`;
    }
  }

  return path; // Fallback
}
