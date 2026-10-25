/** Sel CSV aman: kutip ganda digandakan, awalan rumus (= + - @) dinetralkan agar tidak dieksekusi spreadsheet. */
export function selCsv(nilai: unknown): string {
  let t = nilai === null || nilai === undefined ? '' : String(nilai);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export function keCsv(kolom: string[], baris: unknown[][]): string {
  return [kolom, ...baris].map((b) => b.map(selCsv).join(',')).join('\r\n') + '\r\n';
}
