/** Format tanggal dan waktu untuk tampilan (zona peramban, bahasa Indonesia). */
export const tanggalWaktuPendek = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};
export const tanggalPendek = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(d);
};
