import { Teacher } from '../types';

/**
 * Downloads a pre-formatted CSV template for importing teacher data
 */
export function downloadTeacherCsvTemplate(): void {
  // UTF-8 BOM so Excel opens indonesian characters properly
  const BOM = '\uFEFF';
  const csvHeaders = 'Nama Lengkap,NIP/NUPTK,Jenis Kelamin (L/P),Mata Pelajaran,Nomor HP\n';
  const sampleRows = [
    'Ust. H. Ahmad Dahlan, S.Pd.I,198507122010011005,L,Al-Qur\'an Hadits,081234567890',
    'Usth. Siti Maryam, M.Pd,199003152015022003,P,Bahasa Arab,081398765432',
    'Ust. Muhammad Ihsan, S.Si,198811202012011008,L,Matematika / Fiqih,082155554444',
    'Usth. Fatimah Az-Zahra, S.Ag,,P,Akidah Akhlak,085211112222',
  ].join('\n');

  const fullContent = BOM + csvHeaders + sampleRows;
  const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_data_guru_darul_mahfudz.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses CSV lines considering quotes and commas/semicolons
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export interface TeacherCsvParseResult {
  validTeachers: Omit<Teacher, 'id'>[];
  errors: string[];
  totalRows: number;
}

/**
 * Parses CSV text into teacher objects
 */
export function parseTeacherCsv(csvText: string): TeacherCsvParseResult {
  const validTeachers: Omit<Teacher, 'id'>[] = [];
  const errors: string[] = [];

  // Remove UTF-8 BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rawLines = cleanText.split(/\r\n|\n|\r/).filter((line) => line.trim().length > 0);
  if (rawLines.length === 0) {
    return { validTeachers: [], errors: ['File CSV kosong.'], totalRows: 0 };
  }

  // Detect delimiter (semicolon or comma) from the header line
  const firstLine = rawLines[0];
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

  const headerCols = parseCsvLine(firstLine, delimiter).map((col) =>
    col.toLowerCase().replace(/[^a-z0-9/]/g, '')
  );

  // Map header positions
  let nameIndex = -1;
  let nipIndex = -1;
  let genderIndex = -1;
  let subjectIndex = -1;
  let phoneIndex = -1;

  headerCols.forEach((col, idx) => {
    if (col.includes('nama') || col.includes('name')) {
      nameIndex = idx;
    } else if (col.includes('nip') || col.includes('nuptk')) {
      nipIndex = idx;
    } else if (col.includes('kelamin') || col.includes('gender') || col === 'lp' || col === 'jk') {
      genderIndex = idx;
    } else if (col.includes('mapel') || col.includes('pelajaran') || col.includes('subject')) {
      subjectIndex = idx;
    } else if (col.includes('hp') || col.includes('telepon') || col.includes('wa') || col.includes('phone')) {
      phoneIndex = idx;
    }
  });

  // Fallback positional indexing if headers were standard or missing
  if (nameIndex === -1) {
    nameIndex = 0;
    if (nipIndex === -1 && headerCols.length > 1) nipIndex = 1;
    if (genderIndex === -1 && headerCols.length > 2) genderIndex = 2;
    if (subjectIndex === -1 && headerCols.length > 3) subjectIndex = 3;
    if (phoneIndex === -1 && headerCols.length > 4) phoneIndex = 4;
  }

  // Process data lines
  const dataLines = rawLines.slice(1);

  dataLines.forEach((line, lineIdx) => {
    const cols = parseCsvLine(line, delimiter);
    const rawName = nameIndex >= 0 && cols[nameIndex] ? cols[nameIndex] : '';

    if (!rawName.trim()) {
      errors.push(`Baris ${lineIdx + 2}: Nama guru kosong, baris dilewati.`);
      return;
    }

    const rawNip = nipIndex >= 0 && cols[nipIndex] ? cols[nipIndex].trim() : '';
    const rawGender = genderIndex >= 0 && cols[genderIndex] ? cols[genderIndex].trim().toUpperCase() : 'L';
    const rawSubject = subjectIndex >= 0 && cols[subjectIndex] ? cols[subjectIndex].trim() : 'Mata Pelajaran';
    const rawPhone = phoneIndex >= 0 && cols[phoneIndex] ? cols[phoneIndex].trim() : '';

    // Normalize gender: 'P', 'PEREMPUAN', 'AKHWAT', 'F', 'WANITA' -> 'P', else 'L'
    let gender: 'L' | 'P' = 'L';
    if (
      rawGender.startsWith('P') ||
      rawGender.startsWith('W') ||
      rawGender.startsWith('A') ||
      rawGender === 'F'
    ) {
      gender = 'P';
    }

    validTeachers.push({
      name: rawName.trim(),
      nip: rawNip || undefined,
      gender,
      primarySubject: rawSubject || 'Mata Pelajaran',
      phone: rawPhone || undefined,
      isActive: true,
    });
  });

  return {
    validTeachers,
    errors,
    totalRows: dataLines.length,
  };
}

/**
 * Exports existing teachers list to CSV
 */
export function exportTeachersToCsv(teachers: Teacher[]): void {
  const BOM = '\uFEFF';
  const headers = 'Nama Lengkap,NIP/NUPTK,Jenis Kelamin (L/P),Mata Pelajaran,Nomor HP\n';
  const rows = teachers
    .map((t) => {
      const escape = (str: string = '') => {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      return [
        escape(t.name),
        escape(t.nip || ''),
        t.gender,
        escape(t.primarySubject || ''),
        escape(t.phone || ''),
      ].join(',');
    })
    .join('\n');

  const fullContent = BOM + headers + rows;
  const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `data_dewan_guru_darul_mahfudz_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
