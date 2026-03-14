import { app, BrowserWindow } from 'electron';

console.log('--- STARTING FINAL BYPASS TEST ---');

async function run() {
  console.log('app exists:', !!app);
  if (app) {
    console.log('✅ It worked! app.version:', app.getVersion());
    console.log('app.whenReady type:', typeof app.whenReady);
  } else {
    console.log('❌ Still no app.');
  }
  
  process.exit(0);
}

run();
