export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
export interface Permission {
    module_name: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
    hide_mobile: boolean;
}
type DbResult<T = any> = {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
};
export declare class UserService {
    private static instance;
    static getInstance(): UserService;
    private hashPassword;
    login(username: string, password: string): Promise<DbResult>;
    listUsers(): Promise<any[]>;
    createUser(username: string, password: string, role: UserRole): Promise<number>;
    getPermissions(userId: number): Permission[];
    setPermissions(userId: number, permissions: Permission[] | any[]): Promise<void>;
    maskMobile(mobile: string): string;
    updatePassword(userId: number, newPassword: string): Promise<void>;
    updateUsername(userId: number, newUsername: string): Promise<void>;
    deleteUser(userId: number): Promise<void>;
}
export declare const userService: UserService;
export {};
//# sourceMappingURL=userService.d.ts.map