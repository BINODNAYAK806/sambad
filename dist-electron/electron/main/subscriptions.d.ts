export interface SubscriptionStatus {
    isActive: boolean;
    plan: 'TRIAL' | 'BASIC' | 'PRO' | 'EXPIRED';
    endDate: string | null;
    message?: string;
}
export declare class SubscriptionService {
    private static instance;
    private constructor();
    static getInstance(): SubscriptionService;
    getStatus(userId: string): Promise<SubscriptionStatus>;
    checkActive(userId: string): Promise<boolean>;
}
export declare const subscriptionService: SubscriptionService;
//# sourceMappingURL=subscriptions.d.ts.map