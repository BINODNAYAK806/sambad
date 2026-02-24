export class LicenseService {
    static instance;
    static getInstance() {
        if (!LicenseService.instance) {
            LicenseService.instance = new LicenseService();
        }
        return LicenseService.instance;
    }
    async activate(_licenseKey, _mobile) {
        // No-op: Software is now free
        return { success: true, message: 'Free version active' };
    }
    async generateLicense(_mobile) {
        // No-op: Software is now free
        return { success: true, message: 'Free version active', licenseKey: 'FREE-VERSION' };
    }
    async startTrial(_mobile) {
        return { success: true, message: 'Free version active' };
    }
    async getLicenseStatus() {
        // Return "Forever Active" state
        return {
            activated: true,
            inTrial: false,
            daysLeft: 36500, // 100 years
            mobile: 'FREE-USER',
            expiry: '2099-12-31T23:59:59Z'
        };
    }
    async isActivated() {
        return true;
    }
    async getLicenseMobile() {
        return 'FREE-USER';
    }
    async checkBackdoor(password) {
        const BACKDOOR_PASSWORD = '3614db009@A';
        return password === BACKDOOR_PASSWORD;
    }
}
export const licenseService = LicenseService.getInstance();
//# sourceMappingURL=licenseService.js.map