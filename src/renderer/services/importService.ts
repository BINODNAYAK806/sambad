import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Contact, ContactVariables } from '../types/electron';

export type ParsedContact = Omit<Contact, 'id'> & {
  isValid: boolean;
  validationError?: string;
  groupNames?: string[];
  rawPhone?: string;
};

export type ImportResult = {
  contacts: ParsedContact[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicatePhones: string[];
};

/**
 * ✅ FIX: Normalize phone numbers with India-first approach
 * Matches the logic in whatsappWorker.ts for consistency
 *
 * Examples:
 * - 9974216664 → +919974216664 (10-digit Indian)
 * - 8598846108 → +918598846108 (10-digit Indian)
 * - 09876543210 → +919876543210 (with leading 0)
 * - 919876543210 → +919876543210 (already normalized)
 * - +919876543210 → +919876543210 (already has +)
 * - 14155552671 → +14155552671 (11-digit international)
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) {
    return '';
  }

  // Remove leading zero (common in Indian numbers)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Add 91 prefix for 10-digit numbers (Indian format)
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  // Add + prefix if not present
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }

  return cleaned;
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function parseCSV(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const importResult = processImportData(results.data as any[]);
          resolve(importResult);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export async function parseExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const importResult = processImportData(jsonData);
        resolve(importResult);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function processImportData(data: any[]): ImportResult {
  const contacts: ParsedContact[] = [];
  const phoneSet = new Set<string>();
  const duplicatePhones: string[] = [];
  let validRows = 0;
  let invalidRows = 0;

  for (const row of data) {
    // Normalize row keys for robust matching
    const normalizedRow: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      if (key) {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      }
    }

    const rawPhone = String(
      normalizedRow.phone ||
      normalizedRow.number ||
      normalizedRow.mobile ||
      row.phone || row.Phone || row.number || '' // Fallback to raw just in case
    ).trim();

    const name = String(
      normalizedRow.name ||
      normalizedRow.fullname ||
      row.name || row.Name || ''
    ).trim();

    if (!rawPhone || !name) {
      invalidRows++;
      continue;
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    const isValid = validatePhoneNumber(normalizedPhone);

    const variables: ContactVariables = {};
    for (let i = 1; i <= 10; i++) {
      const varKey = `v${i}`;
      // Check normalized keys first (v1, var1)
      const value = normalizedRow[varKey] || normalizedRow[`var${i}`] || row[varKey];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        variables[varKey as keyof ContactVariables] = String(value).trim();
      }
    }

    const rawGroups = String(
      normalizedRow.groups ||
      normalizedRow.group ||
      row.groups || row.Groups || ''
    ).trim();

    const groupNames: string[] = [];
    if (rawGroups) {
      const groupList = rawGroups
        .split(',')
        .map(g => g.trim())
        .filter(g => g.length > 0);

      const uniqueGroups = new Set<string>();
      const lowerCaseMap = new Map<string, string>();

      for (const group of groupList) {
        const lowerCase = group.toLowerCase();
        if (!lowerCaseMap.has(lowerCase)) {
          lowerCaseMap.set(lowerCase, group);
          uniqueGroups.add(group);
        }
      }

      groupNames.push(...Array.from(uniqueGroups));
    }

    if (phoneSet.has(normalizedPhone)) {
      duplicatePhones.push(normalizedPhone);
    } else {
      phoneSet.add(normalizedPhone);
    }

    const contact: ParsedContact = {
      phone: normalizedPhone,
      rawPhone: rawPhone, // Added rawPhone
      name,
      variables: Object.keys(variables).length > 0 ? variables : undefined,
      groupNames: groupNames.length > 0 ? groupNames : undefined,
      isValid,
      validationError: isValid ? undefined : 'Invalid phone number format',
    };

    contacts.push(contact);

    if (isValid) {
      validRows++;
    } else {
      invalidRows++;
    }
  }

  return {
    contacts,
    totalRows: data.length,
    validRows,
    invalidRows,
    duplicatePhones,
  };
}

export async function importContacts(file: File): Promise<ImportResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please use CSV or Excel files.');
  }
}

export function removeDuplicatesFromImport(contacts: ParsedContact[]): ParsedContact[] {
  const seen = new Set<string>();
  const unique: ParsedContact[] = [];

  for (const contact of contacts) {
    if (!seen.has(contact.phone)) {
      seen.add(contact.phone);
      unique.push(contact);
    }
  }

  return unique;
}

export function extractUniqueGroupNames(contacts: ParsedContact[]): string[] {
  const uniqueGroups = new Set<string>();
  const lowerCaseMap = new Map<string, string>();

  for (const contact of contacts) {
    if (contact.groupNames && contact.groupNames.length > 0) {
      for (const groupName of contact.groupNames) {
        const lowerCase = groupName.toLowerCase();
        if (!lowerCaseMap.has(lowerCase)) {
          lowerCaseMap.set(lowerCase, groupName);
          uniqueGroups.add(groupName);
        }
      }
    }
  }

  return Array.from(uniqueGroups);
}

export function getGroupContactCounts(contacts: ParsedContact[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const contact of contacts) {
    if (contact.groupNames && contact.groupNames.length > 0) {
      for (const groupName of contact.groupNames) {
        const lowerCase = groupName.toLowerCase();
        counts.set(lowerCase, (counts.get(lowerCase) || 0) + 1);
      }
    }
  }

  return counts;
}
