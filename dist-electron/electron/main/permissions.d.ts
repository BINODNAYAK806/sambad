export type PermissionAction = 'read' | 'create' | 'update' | 'delete';
export type ModuleName = 'contacts' | 'campaigns' | 'groups' | 'reports' | 'settings' | 'logs';
export declare class PermissionService {
    private static instance;
    private constructor();
    static getInstance(): PermissionService;
    check(userId: string, module: ModuleName, action: PermissionAction): Promise<boolean>;
    getUserPermissions(userId: string): Promise<any[]>;
    getCompanyStaff(companyId: string): Promise<any[]>;
    updateStaffPermissions(userId: string, companyId: string, module: ModuleName, permissions: Partial<Record<`can_${PermissionAction}`, boolean>>): Promise<boolean>;
}
export declare const permissionService: PermissionService;
//# sourceMappingURL=permissions.d.ts.map