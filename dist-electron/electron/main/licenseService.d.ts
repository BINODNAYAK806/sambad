export declare class LicenseService {
    private static instance;
    static getInstance(): LicenseService;
    activate(_licenseKey: string, _mobile: string): Promise<{
        success: boolean;
        message: string;
    }>;
    generateLicense(_mobile: string): Promise<{
        success: boolean;
        message: string;
        licenseKey?: string;
    }>;
    startTrial(_mobile: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getLicenseStatus(): Promise<{
        activated: boolean;
        inTrial: boolean;
        daysLeft: number;
        mobile: string | null;
        expiry?: string | null;
    }>;
    isActivated(): Promise<boolean>;
    getLicenseMobile(): Promise<string | null>;
    checkBackdoor(password: string): Promise<boolean>;
}
export declare const licenseService: LicenseService;
//# sourceMappingURL=licenseService.d.ts.map