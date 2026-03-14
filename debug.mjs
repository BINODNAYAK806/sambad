import { app } from 'electron';
console.log('App in MJS:', app ? 'Defined' : 'Undefined');
if (app) console.log('App version:', app.getVersion());
process.exit(0);
