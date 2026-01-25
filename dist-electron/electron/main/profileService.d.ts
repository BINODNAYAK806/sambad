export type BusinessProfile = {
    id?: number;
    business_name: string;
    phone_number?: string;
    gstin?: string;
    email_id?: string;
    business_type?: string;
    business_category?: string;
    state?: string;
    pincode?: string;
    address?: string;
    logo_path?: string;
    signature_path?: string;
    updated_at?: string;
};
declare class ProfileService {
    getProfile(): BusinessProfile | null;
    saveProfile(profile: Omit<BusinessProfile, 'id' | 'updated_at'>): void;
}
export declare const profileService: ProfileService;
export {};
//# sourceMappingURL=profileService.d.ts.map