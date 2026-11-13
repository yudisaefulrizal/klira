import { z } from 'zod';
import { jenisFasyankes } from './entitas.js';
import { tanggal, teksOpsional, teksWajib } from './umum.js';
/** Ubah profil klinik (4.1, 4.9): isian langsung, bukan modal. */
export const profilKlinikMasukan = z.object({
    nama: teksWajib(200),
    jenis: jenisFasyankes,
    bentuk_usaha: teksOpsional(100),
    kode_registrasi: teksOpsional(50),
    organization_id: teksOpsional(100),
    status_akreditasi: teksOpsional(100),
    tanggal_akreditasi: tanggal.nullish(),
    puskesmas_wilayah: teksOpsional(200),
});
export const JENIS_RIWAYAT_PROFIL = ['profil', 'akreditasi', 'sip'];
