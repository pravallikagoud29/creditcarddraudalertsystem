// ============================================================================
// CSV parsing and export utilities.
// ============================================================================

import { RawTransaction } from './types';

// Parse CSV text into RawTransaction records.
// Expects headers: Time, V1..V28, Amount, Class
export function parseCsv(csvText: string): RawTransaction[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: RawTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, number> = {};
    for (let j = 0; j < headers.length && j < values.length; j++) {
      const val = parseFloat(values[j]);
      row[headers[j]] = Number.isNaN(val) ? 0 : val;
    }
    rows.push(row as unknown as RawTransaction);
  }

  return rows;
}

// Convert RawTransaction array to CSV string
export function toCsv(data: RawTransaction[]): string {
  if (data.length === 0) return '';
  const keys = Object.keys(data[0]);
  const header = keys.join(',');
  const lines = data.map((row) =>
    keys.map((k) => String(row[k as keyof RawTransaction])).join(',')
  );
  return [header, ...lines].join('\n');
}

// Generate a downloadable CSV blob
export function downloadCsv(data: RawTransaction[], filename: string): void {
  const csv = toCsv(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
