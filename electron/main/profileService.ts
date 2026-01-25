import { getDatabase } from './db/index.js';

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

class ProfileService {
  getProfile(): BusinessProfile | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM business_profile WHERE id = 1').get();
    return (row as BusinessProfile) || null;
  }

  saveProfile(profile: Omit<BusinessProfile, 'id' | 'updated_at'>): void {
    const db = getDatabase();

    // Check if profile exists
    const exists = db.prepare('SELECT id FROM business_profile WHERE id = 1').get();

    if (exists) {
      db.prepare(`
        UPDATE business_profile SET
          business_name = @business_name,
          phone_number = @phone_number,
          gstin = @gstin,
          email_id = @email_id,
          business_type = @business_type,
          business_category = @business_category,
          state = @state,
          pincode = @pincode,
          address = @address,
          logo_path = @logo_path,
          signature_path = @signature_path,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run({ ...profile, logo_path: profile.logo_path || null, signature_path: profile.signature_path || null });
    } else {
      db.prepare(`
        INSERT INTO business_profile (
          id, business_name, phone_number, gstin, email_id, business_type, 
          business_category, state, pincode, address, logo_path, signature_path
        ) VALUES (
          1, @business_name, @phone_number, @gstin, @email_id, @business_type,
          @business_category, @state, @pincode, @address, @logo_path, @signature_path
        )
      `).run({ ...profile, logo_path: profile.logo_path || null, signature_path: profile.signature_path || null });
    }
  }
}

export const profileService = new ProfileService();
