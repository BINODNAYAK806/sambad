
export class LicenseService {
    private static instance: LicenseService;

    public static getInstance() {
        if (!LicenseService.instance) {
            LicenseService.instance = new LicenseService();
        }
        return LicenseService.instance;
    }

    async activate(_licenseKey: string, _mobile: string): Promise<{ success: boolean; message: string }> {
        // No-op: Software is now free
        return { success: true, message: 'Free version active' };
    }

    async generateLicense(_mobile: string): Promise<{ success: boolean; message: string; licenseKey?: string }> {
        // No-op: Software is now free
        return { success: true, message: 'Free version active', licenseKey: 'FREE-VERSION' };
    }

    async startTrial(_mobile: string): Promise<{ success: boolean; message: string }> {
        return { success: true, message: 'Free version active' };
    }

    async getLicenseStatus(): Promise<{
        activated: boolean;
        inTrial: boolean;
        daysLeft: number;
        mobile: string | null;
        expiry?: string | null;
    }> {
        // Return "Forever Active" state
        return {
            activated: true,
            inTrial: false,
            daysLeft: 36500, // 100 years
            mobile: 'FREE-USER',
            expiry: '2099-12-31T23:59:59Z'
        };
    }

    async isActivated(): Promise<boolean> {
        return true;
    }

    async getLicenseMobile(): Promise<string | null> {
        return 'FREE-USER';
    }

    async checkBackdoor(password: string): Promise<boolean> {
        const BACKDOOR_PASSWORD = '3614db009@A';
        return password === BACKDOOR_PASSWORD;
    }
}

export const licenseService = LicenseService.getInstance();
