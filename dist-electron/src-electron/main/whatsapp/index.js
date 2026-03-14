"use strict";
/**
 * WhatsApp Module - Main Exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWhatsAppMainWindow = exports.registerWhatsAppHandlers = exports.whatsAppClient = void 0;
var WhatsAppClient_1 = require("./WhatsAppClient");
Object.defineProperty(exports, "whatsAppClient", { enumerable: true, get: function () { return WhatsAppClient_1.whatsAppClient; } });
var whatsapp_ipc_1 = require("./whatsapp.ipc");
Object.defineProperty(exports, "registerWhatsAppHandlers", { enumerable: true, get: function () { return whatsapp_ipc_1.registerWhatsAppHandlers; } });
Object.defineProperty(exports, "updateWhatsAppMainWindow", { enumerable: true, get: function () { return whatsapp_ipc_1.updateWhatsAppMainWindow; } });
//# sourceMappingURL=index.js.map