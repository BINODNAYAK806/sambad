"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConsoleWindow = createConsoleWindow;
exports.getConsoleWindow = getConsoleWindow;
exports.closeConsoleWindow = closeConsoleWindow;
exports.toggleConsoleWindow = toggleConsoleWindow;
// Robust Electron import for CommonJS
const { BrowserWindow } = require('electron');
const path = __importStar(require("path"));
const logManager_1 = require("./logManager");
let consoleWindow = null;
const isDev = process.env.NODE_ENV === 'development';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
function createConsoleWindow() {
    if (consoleWindow && !consoleWindow.isDestroyed()) {
        consoleWindow.focus();
        return consoleWindow;
    }
    logManager_1.logManager.info('system', 'Creating console window');
    consoleWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 600,
        minHeight: 400,
        title: 'Sambad Console',
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, '../preload/index.cjs'),
        },
    });
    consoleWindow.once('ready-to-show', () => {
        consoleWindow?.show();
        logManager_1.logManager.info('browser', 'Console window shown');
    });
    if (isDev) {
        consoleWindow.loadURL(`${VITE_DEV_SERVER_URL}/console.html`);
    }
    else {
        consoleWindow.loadFile(path.join(__dirname, '../../renderer/console.html'));
    }
    consoleWindow.on('closed', () => {
        logManager_1.logManager.info('browser', 'Console window closed');
        consoleWindow = null;
        logManager_1.logManager.setConsoleWindow(null);
    });
    logManager_1.logManager.setConsoleWindow(consoleWindow);
    return consoleWindow;
}
function getConsoleWindow() {
    return consoleWindow;
}
function closeConsoleWindow() {
    if (consoleWindow && !consoleWindow.isDestroyed()) {
        logManager_1.logManager.info('browser', 'Closing console window');
        consoleWindow.close();
    }
}
function toggleConsoleWindow() {
    if (consoleWindow && !consoleWindow.isDestroyed()) {
        if (consoleWindow.isVisible()) {
            consoleWindow.hide();
            logManager_1.logManager.info('browser', 'Console window hidden');
        }
        else {
            consoleWindow.show();
            consoleWindow.focus();
            logManager_1.logManager.info('browser', 'Console window shown');
        }
    }
    else {
        createConsoleWindow();
    }
}
//# sourceMappingURL=consoleWindow.js.map