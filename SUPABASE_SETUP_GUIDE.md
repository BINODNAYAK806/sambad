# Supabase Setup Guide for Sambad

## Quick Start: Cloud Storage Integration

Sambad uses a **hybrid storage architecture** with Supabase for cloud data and local SQLite for offline fallback.

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name:** Sambad Production
   - **Database Password:** (Generate strong password - save it!)
   - **Region:** Choose closest to your users
5. Click **"Create new project"** (takes ~2 minutes)

---

## Step 2: Get Your API Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Configure Sambad

### Method A: Using .env File (Recommended)

1. In your Sambad project folder, create/edit `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Restart Sambad - it will automatically connect to Supabase

### Method B: Using Settings Page (Future)

1. Open Sambad
2. Go to **Settings** → **Cloud Storage**
3. Paste your Supabase URL and API key
4. Click **"Test Connection"**
5. Click **"Save"**

---

## Step 4: Run Database Migrations

Sambad includes pre-built migrations to set up your Supabase database.

### Option A: Use Supabase Dashboard (Easiest)

1. Open Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy the migration SQL from each file in `supabase/migrations/`
4. Paste and **"Run"** each migration in order

### Option B: Use Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref xxxxxxxxxxxxx

# Run migrations
supabase db push
```

---

## Database Schema

Sambad creates these tables in Supabase:

### `contacts`
| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key (auto-increment) |
| `phone` | text | Phone number (unique) |
| `name` | text | Contact name |
| `vars_json` | jsonb | Custom variables (v1-v10) |
| `created_at` | timestamp | Creation timestamp |

### `groups`
| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key (auto-increment) |
| `name` | text | Group name (unique) |
| `created_at` | timestamp | Creation timestamp |

### `group_contacts`
| Column | Type | Description |
|--------|------|-------------|
| `group_id` | bigint | Foreign key → groups |
| `contact_id` | bigint | Foreign key → contacts |

### `campaigns`
| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key (auto-increment) |
| `name` | text | Campaign name |
| `status` | text | Status (draft/running/paused/completed/failed) |
| `message_template` | text | Message template with {{variables}} |
| `group_id` | bigint | Foreign key → groups |
| `delay_preset` | text | Delay configuration |
| `delay_min` | integer | Minimum delay (ms) |
| `delay_max` | integer | Maximum delay (ms) |
| `sent_count` | integer | Messages sent |
| `failed_count` | integer | Messages failed |
| `total_count` | integer | Total messages |
| `started_at` | timestamp | Start time |
| `completed_at` | timestamp | Completion time |
| `created_at` | timestamp | Creation timestamp |

### `campaign_messages`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `campaign_id` | bigint | Foreign key → campaigns |
| `contact_id` | bigint | Foreign key → contacts |
| `recipient_number` | text | Phone number |
| `recipient_name` | text | Contact name |
| `template_text` | text | Original template |
| `resolved_text` | text | Resolved message |
| `status` | text | Status (pending/sent/failed) |
| `error_message` | text | Error details if failed |
| `sent_at` | timestamp | Send timestamp |
| `created_at` | timestamp | Creation timestamp |

### `campaign_media`
| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key (auto-increment) |
| `campaign_id` | bigint | Foreign key → campaigns |
| `media_url` | text | URL or file path |
| `media_type` | text | Type (image/video/document/audio) |
| `filename` | text | Original filename |
| `caption` | text | Media caption |
| `display_order` | integer | Order in campaign |

---

## Row Level Security (RLS)

Sambad migrations automatically set up RLS policies. Here's what they do:

### Why RLS?

Row Level Security ensures:
- Users can only access their own data
- No accidental data leaks between users
- Built-in database-level authorization

### Policies

**contacts:**
- Users can **read** their own contacts
- Users can **insert** new contacts
- Users can **update** their own contacts
- Users can **delete** their own contacts

**campaigns:**
- Users can **read** their own campaigns
- Users can **create** new campaigns
- Users can **update** their own campaigns
- Users can **delete** their own campaigns

(Same pattern for groups, campaign_messages, campaign_media)

---

## Testing Your Setup

### 1. Check Connection

Run Sambad and look for this in the logs:

```
[Sambad] Environment loaded from...
[Storage] Supabase client initialized {"mode":"hybrid"}
```

### 2. Create a Test Contact

```sql
-- In Supabase SQL Editor
INSERT INTO contacts (phone, name, vars_json)
VALUES ('+1234567890', 'Test Contact', '{"v1": "Test"}');
```

### 3. Verify in Sambad

- Open Sambad → **Contacts** page
- You should see "Test Contact" in the list
- This confirms cloud sync is working!

---

## Troubleshooting

### "Failed to initialize Supabase"

**Cause:** Invalid credentials or network issue

**Fix:**
1. Double-check your `.env` file:
   - `VITE_SUPABASE_URL` is correct (starts with `https://`)
   - `VITE_SUPABASE_ANON_KEY` is the **anon public** key (not service role key)
2. Check internet connection
3. Verify Supabase project is active (not paused)

### "Table does not exist"

**Cause:** Migrations not run

**Fix:**
1. Go to Supabase Dashboard → **SQL Editor**
2. Run each migration from `supabase/migrations/` folder
3. Restart Sambad

### "permission denied for table contacts"

**Cause:** RLS policies not set up

**Fix:**
1. Run the migration that creates RLS policies
2. In Supabase Dashboard → **Authentication**, ensure RLS is enabled
3. Check if policies exist: **Database** → **Policies**

### Data Not Syncing

**Cause:** App is in local-only mode

**Fix:**
1. Check error.log: `{userData}/error.log`
2. Look for Supabase connection errors
3. Verify `.env` file is in correct location:
   - Development: Project root `.env`
   - Production: `{userData}/.env`

---

## Offline Mode (Automatic Fallback)

Sambad automatically handles offline scenarios:

```typescript
// When cloud is unavailable, automatically uses local SQLite
const contacts = await storageService.getContacts();
// ✅ Returns data from SQLite if Supabase is down
```

**How it works:**
1. App tries Supabase first
2. If network error → falls back to local SQLite
3. Logs warning: `"Cloud storage unavailable, using local fallback"`
4. When network returns → syncs back to cloud

**User Experience:**
- No error dialogs
- App continues working
- Data is saved locally
- Auto-syncs when online

---

## Migration Files

Sambad includes these migrations (in order):

1. `20251214200641_create_sambad_database_schema.sql`
   - Creates all tables
   - Sets up foreign keys
   - Enables RLS

2. `20251214202618_add_media_attachments_support.sql`
   - Adds campaign_media table
   - Links media to campaigns

3. `20251214214704_add_file_path_to_campaign_media.sql`
   - Adds file_path column
   - Supports local file attachments

4. `20251214233516_add_template_image_to_campaigns.sql`
   - Adds template_image_url column
   - Supports campaign-level images

---

## Best Practices

### ✅ DO

1. **Use environment variables** for API keys (never hardcode)
2. **Run migrations in order** (check timestamps)
3. **Enable RLS on all tables** (security)
4. **Test connection before production** (use test contact)
5. **Keep local fallback** (hybrid mode recommended)

### ❌ DON'T

1. **Don't use service_role key in frontend** (major security risk!)
2. **Don't disable RLS** (exposes data to all users)
3. **Don't skip migrations** (tables won't exist)
4. **Don't hardcode Supabase URL** (use .env)
5. **Don't rely solely on cloud** (local fallback is important)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   SAMBAD + SUPABASE                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐                                        │
│  │  Sambad App  │                                        │
│  └──────┬───────┘                                        │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────────┐                                     │
│  │ Storage Service │                                     │
│  │    (Hybrid)     │                                     │
│  └────┬────────┬───┘                                     │
│       │        │                                          │
│       │        └──────────┐                              │
│       │                   │                              │
│       ▼                   ▼                              │
│  ┌─────────────┐   ┌──────────────┐                     │
│  │  Supabase   │   │    SQLite    │                     │
│  │   (Cloud)   │   │   (Local)    │                     │
│  └──────┬──────┘   └──────────────┘                     │
│         │                                                 │
│         ▼                                                 │
│  ┌─────────────────────────┐                            │
│  │  Supabase PostgreSQL    │                            │
│  ├─────────────────────────┤                            │
│  │ ✅ contacts             │                            │
│  │ ✅ groups               │                            │
│  │ ✅ campaigns            │                            │
│  │ ✅ campaign_messages    │                            │
│  │ ✅ campaign_media       │                            │
│  └─────────────────────────┘                            │
│                                                           │
│  ┌─────────────────────────┐                            │
│  │   userData (Local)      │                            │
│  ├─────────────────────────┤                            │
│  │ .wwebjs_auth/           │ ◄─ WhatsApp Session        │
│  │ sambad.db               │ ◄─ Offline Fallback        │
│  │ error.log               │ ◄─ Error Logging           │
│  └─────────────────────────┘                            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Advanced: Multi-User Setup (Future)

For enterprise deployments with multiple users:

1. **Enable Supabase Auth:**
   ```typescript
   const { user } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'secure-password'
   });
   ```

2. **Update RLS Policies:**
   ```sql
   CREATE POLICY "Users can access own data"
   ON contacts FOR ALL
   TO authenticated
   USING (user_id = auth.uid());
   ```

3. **Add user_id Column:**
   ```sql
   ALTER TABLE contacts
   ADD COLUMN user_id UUID REFERENCES auth.users(id);
   ```

---

## Support

For issues with Supabase setup:

1. Check `error.log` in userData folder
2. Review Supabase Dashboard → **Logs**
3. Test connection with SQL query in Supabase Editor
4. Refer to `PRODUCTION_ARCHITECTURE.md` for detailed architecture

---

**Your Supabase database is ready for production WhatsApp campaigns!**
