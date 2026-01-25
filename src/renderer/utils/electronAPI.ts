export const isElectronAvailable = (): boolean => {
  return typeof window !== 'undefined' &&
         window.electronAPI !== undefined &&
         window.electronAPI !== null;
};

export const waitForElectronAPI = (timeout = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (isElectronAvailable()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isElectronAvailable()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.error('[ElectronAPI] Timeout waiting for electronAPI');
        resolve(false);
      }
    }, 100);
  });
};

export const getElectronAPI = () => {
  if (!isElectronAvailable()) {
    console.error('[ElectronAPI] electronAPI is not available');
    return null;
  }
  return window.electronAPI;
};
