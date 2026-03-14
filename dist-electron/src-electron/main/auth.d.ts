export interface RegistrationData {
    company_name: string;
    business_category: string;
    address: string;
    state: string;
    pincode: string;
    referral_code?: string;
    first_name: string;
    last_name: string;
    mobile: string;
    email: string;
    password: string;
}
export declare class AuthService {
    private static instance;
    private currentSession;
    private heartbeatTimer;
    private onSessionInvalid;
    private constructor();
    static getInstance(): AuthService;
    private getAdminClient;
    register(data: RegistrationData): Promise<{
        success: boolean;
        user: any;
    }>;
    login(email: string, password: string): Promise<{
        success: boolean;
        session: any;
        user: any;
    }>;
    logout(): Promise<{
        success: boolean;
    }>;
    setOnSessionInvalid(callback: () => void): void;
    validateSession(): Promise<boolean>;
    startHeartbeat(): void;
    stopHeartbeat(): void;
    forgotPassword(email: string): Promise<{
        success: boolean;
    }>;
    getCurrentSession(): any;
    setLocalSession(user: any): void;
    getCurrentUserProfile(): Promise<any>;
    getCurrentCompanyId(): Promise<string | null>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.d.ts.map