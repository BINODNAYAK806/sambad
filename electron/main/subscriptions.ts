import { getSupabase } from './supabase.js';

export interface SubscriptionStatus {
    isActive: boolean;
    plan: 'TRIAL' | 'BASIC' | 'PRO' | 'EXPIRED';
    endDate: string | null;
    message?: string;
}

export class SubscriptionService {
    private static instance: SubscriptionService;

    private constructor() { }

    public static getInstance(): SubscriptionService {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }

    async getStatus(userId: string): Promise<SubscriptionStatus> {
        const supabase = getSupabase();

        // Get user profile for company_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return { isActive: false, plan: 'EXPIRED', endDate: null, message: 'Profile not found' };
        }

        // Get active subscription
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('company_id', profile.company_id)
            .order('end_date', { ascending: false })
            .limit(1)
            .single();

        if (subError || !subscription) {
            return { isActive: false, plan: 'EXPIRED', endDate: null, message: 'No active subscription found' };
        }

        const now = new Date();
        const endDate = new Date(subscription.end_date);
        const isActive = endDate > now && subscription.status !== 'CANCELLED';

        return {
            isActive,
            plan: subscription.plan_id.includes('PRO') ? 'PRO' : subscription.plan_id.includes('BASIC') ? 'BASIC' : 'TRIAL',
            endDate: subscription.end_date,
            message: isActive ? undefined : 'Your subscription has expired'
        };
    }

    async checkActive(userId: string): Promise<boolean> {
        const status = await this.getStatus(userId);
        return status.isActive;
    }
}

export const subscriptionService = SubscriptionService.getInstance();
