"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionService = exports.PermissionService = void 0;
const supabase_1 = require("./supabase");
class PermissionService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!PermissionService.instance) {
            PermissionService.instance = new PermissionService();
        }
        return PermissionService.instance;
    }
    async check(userId, module, action) {
        const supabase = (0, supabase_1.getSupabase)();
        // 1. Get user role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        if (profileError || !profile)
            return false;
        // 2. ADMIN has full access
        if (profile.role === 'ADMIN')
            return true;
        // 3. STAFF check
        const { data: permission, error: permError } = await supabase
            .from('user_permissions')
            .select(`can_${action}`)
            .eq('user_id', userId)
            .eq('module', module)
            .single();
        if (permError || !permission)
            return false;
        return permission[`can_${action}`] === true;
    }
    async getUserPermissions(userId) {
        const supabase = (0, supabase_1.getSupabase)();
        const { data, error } = await supabase
            .from('user_permissions')
            .select('*')
            .eq('user_id', userId);
        if (error)
            throw error;
        return data;
    }
    async getCompanyStaff(companyId) {
        const supabase = (0, supabase_1.getSupabase)();
        const { data, error } = await supabase
            .from('profiles')
            .select('*, user_permissions(*)')
            .eq('company_id', companyId)
            .eq('role', 'STAFF');
        if (error)
            throw error;
        return data;
    }
    async updateStaffPermissions(userId, companyId, module, permissions) {
        const supabase = (0, supabase_1.getSupabase)();
        const { error } = await supabase
            .from('user_permissions')
            .upsert({
            user_id: userId,
            company_id: companyId,
            module,
            ...permissions
        }, { onConflict: 'user_id,module' });
        if (error)
            throw error;
        return true;
    }
}
exports.PermissionService = PermissionService;
exports.permissionService = PermissionService.getInstance();
//# sourceMappingURL=permissions.js.map