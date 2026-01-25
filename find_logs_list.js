
const fs = require('fs');
const content = fs.readFileSync('d:/sam-12/electron/main/ipc.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('logs:list')) {
        console.log(`${index + 1}: ${line}`);
    }
});
