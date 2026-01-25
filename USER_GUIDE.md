# Sambad - Complete User Guide

## Overview
Sambad is a WhatsApp Campaign Manager that allows you to send bulk messages with smart delays and anti-ban protection. This guide walks you through the complete workflow from adding contacts to sending campaigns.

---

## Complete Workflow: From Contacts to Campaign

### Step 1: Add Contacts

You have three ways to add contacts:

#### Method A: Import from CSV/Excel
1. Go to **Contacts** page
2. Click **Import** button
3. Upload your CSV or Excel file
   - Required columns: `phone`, `name`
   - Optional columns: `v1` to `v10` (for custom variables)
4. Review the import summary (valid/invalid contacts)
5. Click **Import X Contacts** to save

**Sample CSV Format:**
```csv
phone,name,v1,v2,v3
+919876543210,John Doe,Mumbai,Premium,January
+919876543211,Jane Smith,Delhi,Standard,February
```

#### Method B: Add Single Contact
1. Go to **Contacts** page
2. Click **Add Contact** button
3. Fill in the form:
   - Name (required)
   - Phone with country code (required, e.g., +919876543210)
   - Custom variables v1-v10 (optional)
4. Click **Add Contact**

#### Method C: Bulk Add via Sample
1. Click **Import** → **Download Sample CSV**
2. Fill the sample with your contacts
3. Import the filled CSV file

### Step 2: Create Groups

Groups help you organize contacts for targeted campaigns.

1. Go to **Contacts** page
2. Click **Groups** button
3. Enter a group name (e.g., "Premium Customers", "Mumbai Region")
4. Click **Create Group**
5. Repeat for multiple groups if needed

### Step 3: Assign Contacts to Groups

Now link your contacts to groups:

1. Go to **Contacts** page
2. Select contacts using checkboxes (you can select multiple)
   - Use the checkbox in the header to select all visible contacts
3. Click **Assign to Groups (X)** button
4. Select one or more groups
5. Click **Assign to X Groups**

**Done!** Your contacts are now organized into groups.

### Step 4: Create a Campaign

1. Go to **Campaigns** page
2. Click **New Campaign** button
3. Fill in the campaign details:

   **Campaign Name:** Give it a descriptive name

   **Target Group:** Select the group you want to send messages to

   **Message Template:** Write your message with variables
   - Use `{{v1}}`, `{{v2}}`, etc. to insert custom data
   - Example: "Hi {{v1}}, Welcome to our {{v2}} plan!"
   - Click the v1-v10 buttons to quickly insert variables

   **Delivery Delay:** Choose delay between messages
   - **Quick (1-5s):** Fast but higher ban risk
   - **Medium (5-15s):** Balanced option (recommended)
   - **Slow (15-30s):** Safer for large campaigns
   - **Careful (30-60s):** Maximum safety
   - **Manual:** Set custom min/max delay

4. Click **Create Campaign**

### Step 5: Run Your Campaign

1. On the **Campaigns** page, find your campaign
2. Click **Run Campaign** button
3. The Campaign Runner dialog opens showing:
   - Campaign status
   - Progress bar
   - Total/Sent/Failed message counts
   - Current recipient being processed

4. **Controls available during campaign:**
   - **Pause:** Temporarily stop sending
   - **Resume:** Continue after pause
   - **Stop:** End campaign completely

5. Monitor real-time progress as messages are sent

### Step 6: View Reports

1. Go to **Reports** page
2. View campaign performance:
   - Total campaigns
   - Total messages sent
   - Success rate
   - Failed message count
   - Per-campaign breakdown

3. Export reports:
   - Click **Export CSV** for spreadsheet
   - Click **Export PDF** for print-ready format

---

## Key Features

### Variable Replacement System
Messages support 10 custom variables (v1-v10) that get replaced with actual contact data:
- Template: `"Hi {{v1}}, your order from {{v2}} is ready!"`
- Contact v1: "John", v2: "Mumbai"
- Sent message: "Hi John, your order from Mumbai is ready!"

### Smart Delay System
Prevents WhatsApp bans by adding random delays between messages:
- Delays are randomized within the chosen range
- Mimics human sending behavior
- Reduces detection risk

### Contact Management
- **Search:** Find contacts by name or phone
- **Duplicate Removal:** Clean up duplicate entries
- **Bulk Selection:** Select multiple contacts at once
- **Group Assignment:** Organize contacts efficiently

### Campaign Status Tracking
- **Draft:** Campaign created but not started
- **Running:** Currently sending messages
- **Paused:** Temporarily stopped
- **Completed:** All messages sent
- **Stopped:** Manually terminated
- **Failed:** Error occurred

---

## Common Workflows

### Workflow 1: Quick Campaign for New Offer
1. Import contacts from CSV
2. Create group "New Offer Recipients"
3. Assign all contacts to group
4. Create campaign with offer message
5. Set Medium delay
6. Run campaign
7. Monitor progress

### Workflow 2: Personalized Birthday Messages
1. Prepare CSV with columns: phone, name, v1 (birthday_date)
2. Import contacts
3. Create group "Birthday List"
4. Assign contacts to group
5. Create campaign with template: "Happy Birthday {{v1}}! 🎉"
6. Set Slow delay for safety
7. Run campaign

### Workflow 3: Regional Campaigns
1. Import contacts with v1 = region (Mumbai, Delhi, etc.)
2. Create groups by region (Group 1: "Mumbai", Group 2: "Delhi")
3. Assign contacts to respective regional groups
4. Create separate campaigns per region
5. Customize messages with regional details
6. Run campaigns sequentially

---

## Tips & Best Practices

### For Safe Sending
1. ✓ Start with small test campaigns (10-20 contacts)
2. ✓ Use Medium or Slow delays for first-time sending
3. ✓ Avoid sending to invalid/non-WhatsApp numbers
4. ✓ Don't run multiple campaigns simultaneously
5. ✓ Take breaks between large campaigns

### For Better Results
1. ✓ Personalize messages using variables
2. ✓ Keep messages concise and clear
3. ✓ Test your message template before bulk sending
4. ✓ Clean up duplicates before campaigns
5. ✓ Organize contacts into meaningful groups

### For Data Quality
1. ✓ Use consistent phone number format (+country code)
2. ✓ Validate CSV files before importing
3. ✓ Remove inactive numbers regularly
4. ✓ Keep variable names consistent across contacts
5. ✓ Backup your contact data regularly

---

## Troubleshooting

### Problem: "Failed to add contact"
**Solution:**
- Ensure phone number includes country code (e.g., +91)
- Phone must be 10-15 digits
- Check that phone number doesn't already exist

### Problem: "No contacts found in selected group"
**Solution:**
- Go to Contacts page
- Select contacts
- Click "Assign to Groups"
- Make sure contacts are assigned to the group

### Problem: Import shows "Invalid Contacts"
**Solution:**
- Check CSV has required columns: phone, name
- Ensure phone numbers have country codes
- Remove any empty rows
- Verify phone number format

### Problem: Campaign not starting
**Solution:**
- Ensure WhatsApp is connected (check Home page)
- Verify group has contacts assigned
- Check that message template is filled
- Try refreshing the page

### Problem: Messages failing to send
**Solution:**
- Verify phone numbers are valid WhatsApp accounts
- Check your internet connection
- Reduce sending speed (use Careful delay)
- Restart the application

---

## Database Structure

Sambad uses Supabase for data persistence:

- **contacts:** Stores all contact information
- **groups:** Stores group names
- **group_contacts:** Links contacts to groups (many-to-many)
- **campaigns:** Stores campaign configurations
- **campaign_messages:** Tracks individual message delivery
- **logs:** System logs for debugging

All data is automatically saved and persists between sessions.

---

## Security & Privacy

- All data is stored in your Supabase database
- No contact data is sent to third parties
- WhatsApp session is stored locally
- Message content is not logged
- Use environment variables for sensitive configuration

---

## Support

For issues or questions:
1. Check the Reports page for error details
2. Review the Console page for technical logs
3. Verify all steps in this guide
4. Check database connection status

---

**Happy Campaigning! 🚀**
