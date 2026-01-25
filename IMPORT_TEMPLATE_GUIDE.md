# Contact Import Template Guide

This guide explains how to use the sample contact files to import your contacts into Sambad.

---

## Sample Files Included

### 📄 `sample_contacts.csv`
A CSV (Comma-Separated Values) file that can be opened in Excel, Google Sheets, or any text editor.

### 📊 `sample_contacts.xlsx`
An Excel file with the same data, formatted for use in Microsoft Excel or LibreOffice Calc.

---

## File Format

### Required Columns

| Column | Description | Example |
|--------|-------------|---------|
| `name` | Contact's full name | John Doe |
| `phone` | Phone number with country code | +1234567890 |

### Optional Columns (Custom Variables)

You can include up to 10 custom variables (`v1` through `v10`) for personalization:

| Column | Common Use Cases | Example |
|--------|------------------|---------|
| `v1` | Company Name | Acme Corp |
| `v2` | Job Title | Manager |
| `v3` | City/Location | New York |
| `v4` | Account Type | Premium |
| `v5` | Department | Marketing |
| `v6` | Email Address | john@example.com |
| `v7` | Year/Date | 2024 |
| `v8` | Status | Active |
| `v9` | Customer Type | VIP |
| `v10` | Tier/Level | Gold |

**Note:** You can use these variables for any data you want to track. The examples above are just suggestions.

---

## Phone Number Format

### Accepted Formats

Sambad automatically normalizes phone numbers to international format (`+country_code + number`):

| Input Format | Auto-Normalized To |
|--------------|-------------------|
| `1234567890` (10 digits) | `+11234567890` |
| `11234567890` (11 digits starting with 1) | `+11234567890` |
| `+1234567890` | `+1234567890` (unchanged) |
| `447700900123` | `+447700900123` |
| `+34 912 345 678` | `+34912345678` (spaces removed) |

### Best Practice
Always include the country code with a `+` prefix for accuracy:
- ✅ `+1234567890` (US)
- ✅ `+447700900123` (UK)
- ✅ `+34912345678` (Spain)
- ✅ `+8613800000000` (China)

---

## How to Use the Sample Files

### Method 1: Edit the Sample File

1. Open `sample_contacts.csv` or `sample_contacts.xlsx`
2. Replace the sample data with your actual contacts
3. Keep the header row (first row) unchanged
4. Save the file
5. Import into Sambad via **Contacts → Import**

### Method 2: Create Your Own File

#### For CSV:
1. Create a new file in Excel or Google Sheets
2. Add headers in the first row: `name,phone,v1,v2,v3...`
3. Add your contact data in subsequent rows
4. Save as `.csv` format

#### For Excel:
1. Create a new Excel workbook
2. Add headers in the first row: `name`, `phone`, `v1`, `v2`, etc.
3. Add your contact data in subsequent rows
4. Save as `.xlsx` format

---

## Example Data

Here's what the sample data looks like:

```csv
name,phone,v1,v2,v3,v4,v5
John Doe,+1234567890,Acme Corp,Manager,New York,Premium,Marketing
Jane Smith,+1987654321,Tech Solutions,Director,San Francisco,Standard,Sales
Bob Johnson,+447700900123,Global Industries,CEO,London,Enterprise,Executive
```

---

## Using Variables in Message Templates

Once imported, you can use these variables in your campaign messages:

### Example Message Template:
```
Hello {{name}}!

We have a special offer for {{v1}} employees.

As a {{v2}} in {{v3}}, you qualify for our {{v4}} plan!

Reply YES to learn more.
```

### Result for John Doe:
```
Hello John Doe!

We have a special offer for Acme Corp employees.

As a Manager in New York, you qualify for our Premium plan!

Reply YES to learn more.
```

---

## Common Use Cases

### E-commerce Store
```csv
name,phone,v1,v2,v3
John Doe,+1234567890,john@email.com,VIP,Gold
```
- `v1` = Email
- `v2` = Customer Type
- `v3` = Loyalty Tier

### Real Estate
```csv
name,phone,v1,v2,v3,v4
Jane Smith,+1987654321,Buyer,3BR,Downtown,$500k
```
- `v1` = Lead Type
- `v2` = Property Interest
- `v3` = Location Preference
- `v4` = Budget

### Event Invitations
```csv
name,phone,v1,v2,v3
Bob Johnson,+447700900123,Confirmed,VIP,Table 5
```
- `v1` = RSVP Status
- `v2` = Ticket Type
- `v3` = Seating

### SaaS/Software
```csv
name,phone,v1,v2,v3,v4
Maria Garcia,+34912345678,Free Trial,Expires 2024-12-31,100,maria@company.com
```
- `v1` = Account Type
- `v2` = Expiration Date
- `v3` = Usage (e.g., API calls)
- `v4` = Email

---

## Import Tips

### ✅ Do's
- Include country codes in phone numbers
- Keep variable names consistent across all contacts
- Remove any empty rows before importing
- Use UTF-8 encoding for special characters
- Test with a small batch first (5-10 contacts)

### ❌ Don'ts
- Don't use special characters in column headers
- Don't leave name or phone fields empty
- Don't include duplicate phone numbers (use "Remove Duplicates" after import)
- Don't exceed 10 custom variables (v1-v10)
- Don't include sensitive data you don't want to store locally

---

## Validation & Error Handling

During import, Sambad will:

1. **Validate phone numbers** - Invalid formats will be flagged
2. **Detect duplicates** - Duplicate phone numbers will be reported
3. **Normalize data** - Phone numbers will be auto-formatted
4. **Preview results** - You'll see a preview before finalizing

### If Import Fails:
- Check that file has `.csv` or `.xlsx` extension
- Verify first row contains headers
- Ensure `name` and `phone` columns exist
- Remove any hidden rows or columns
- Try saving with UTF-8 encoding

---

## After Import

1. **Review Imported Contacts**
   - Go to Contacts page
   - Verify all contacts appear correctly
   - Check that variables are mapped properly

2. **Remove Duplicates (if needed)**
   - Click **Remove Duplicates** button
   - Sambad will keep the first occurrence of each phone number

3. **Create Groups**
   - Click **Groups** button
   - Create groups to organize contacts
   - Assign contacts to groups for targeted campaigns

4. **Test Message Template**
   - Create a test campaign with 1-2 contacts
   - Verify variable replacement works correctly
   - Adjust template as needed

---

## Quick Reference

| Task | Action |
|------|--------|
| Download sample | Use `sample_contacts.csv` or `sample_contacts.xlsx` |
| Import contacts | Contacts → Import → Select File |
| Check for duplicates | Contacts → Remove Duplicates |
| Create groups | Contacts → Groups → Create Group |
| Use variables | Campaign message: `{{name}}`, `{{v1}}`, etc. |

---

## Need Help?

If you encounter issues:
1. Verify file format matches the sample
2. Check phone number formats
3. Ensure no empty required fields
4. Review error messages during import
5. Try with a smaller file first

---

**Ready to import?** Open the sample file, add your contacts, and import into Sambad!
