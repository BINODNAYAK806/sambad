import { getDatabase } from './db/index.js';
class ProfileService {
    getProfile() {
        const db = getDatabase();
        const row = db.prepare('SELECT * FROM business_profile WHERE id = 1').get();
        return row || null;
    }
    saveProfile(profile) {
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
        }
        else {
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
//# sourceMappingURL=profileService.js.map