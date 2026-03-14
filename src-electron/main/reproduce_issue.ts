const { app } = require('electron');
console.log('--- REPRODUCTION ---');
console.log('Type of require("electron"):', typeof require('electron'));
console.log('Value of require("electron"):', require('electron'));
console.log('App defined:', !!app);
if (app) {
    console.log('App path:', app.getAppPath());
    app.quit();
} else {
    process.exit(1);
}
