export const NIK_REGEX = /^\d{16}$/;

export function nikValid(nik: string): boolean {
  return NIK_REGEX.test(nik);
}

export function pastikanNik(nik: string): string {
  if (!nikValid(nik)) throw new Error('NIK harus 16 digit angka');
  return nik;
}

export const TANGGAL_MINIMAL = new Date('2014-06-03T00:00:00.000Z');

export function tanggalValid(tanggal: Date): boolean {
  return !Number.isNaN(tanggal.getTime()) && tanggal.getTime() >= TANGGAL_MINIMAL.getTime();
}
