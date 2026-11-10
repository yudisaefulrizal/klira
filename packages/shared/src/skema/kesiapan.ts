/** Kesiapan pengaturan awal klinik: data master minimum agar alur pelayanan sampai penagihan berjalan. */
export const KUNCI_KESIAPAN = ['poli', 'praktisi', 'jadwal', 'tarif', 'obat', 'pemeriksaan', 'pemeriksaan_tanpa_tarif', 'sip_kedaluwarsa'] as const;
export type KunciKesiapan = (typeof KUNCI_KESIAPAN)[number];
/** `ok` false pada kunci wajib berarti belum siap; pada kunci peringatan (`pemeriksaan_tanpa_tarif`, `sip_kedaluwarsa`) berarti ada yang perlu dibereskan. */
export type ItemKesiapanDto = { kunci: KunciKesiapan; jumlah: number; ok: boolean; peringatan: boolean };
export type KesiapanDto = { item: ItemKesiapanDto[] };
