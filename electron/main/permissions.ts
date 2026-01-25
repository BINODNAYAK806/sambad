import { getSupabase } from './supabase.js';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete';
export type ModuleName = 'contacts' | 'campaigns' | 'groups' | 'reports' | 'settings' | 'logs';

export class PermissionService {
    private static instance: PermissionService;

    private constructor() { }

    public static getInstance(): PermissionService {
        if (!PermissionService.instance) {
            PermissionService.instance = new PermissionService();
        }
        return PermissionService.instance;
    }

    async check(userId: string, module: ModuleName, action: PermissionAction): Promise<boolean> {
        const supabase = getSupabase();

        // 1. Get user role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (profileError || !profile) return false;

        // 2. ADMIN has full access
        if (profile.role === 'ADMIN') return true;

        // 3. STAFF check
        const { data: permission, error: permError } = await supabase
            .from('user_permissions')
            .select(`can_${action}`)
            .eq('user_id', userId)
            .eq('module', module)
            .single();

        if (permError || !permission) return false;

        return (permission as any)[`can_${action}`] === true;
    }

    async getUserPermissions(userId: string) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('user_permissions')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    }

    async getCompanyStaff(companyId: string) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('profiles')
            .select('*, user_permissions(*)')
            .eq('company_id', companyId)
            .eq('role', 'STAFF');

        if (error) throw error;
        return data;
    }

    async updateStaffPermissions(userId: string, companyId: string, module: ModuleName, permissions: Partial<Record<`can_${PermissionAction}`, boolean>>) {
        const supabase = getSupabase();
        const { error } = await supabase
            .from('user_permissions')
            .upsert({
                user_id: userId,
                company_id: companyId,
                module,
                ...permissions
            }, { onConflict: 'user_id,module' });

        if (error) throw error;
        return true;
    }
}

export const permissionService = PermissionService.getInstance();
