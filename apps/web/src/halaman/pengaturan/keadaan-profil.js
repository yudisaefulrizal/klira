import { PROFIL_KLINIK, profilKlinikMasukan } from '@klira/shared';
import { galatSkema } from '../../modal/akun-pengaturan/keadaan-akun.js';
export const formDariProfil = (p) => ({
    nama: p.nama, jenis: p.jenis, bentuk_usaha: p.bentuk_usaha ?? '', kode_registrasi: p.kode_registrasi ?? '', organization_id: p.organization_id ?? '',
    status_akreditasi: p.status_akreditasi ?? '', tanggal_akreditasi: p.tanggal_akreditasi ?? '', puskesmas_wilayah: p.puskesmas_wilayah ?? '',
});
const opsional = (t) => (t.trim() === '' ? undefined : t.trim());
export const bentukProfil = (f) => ({
    nama: f.nama.trim(), jenis: f.jenis, bentuk_usaha: opsional(f.bentuk_usaha), kode_registrasi: opsional(f.kode_registrasi),
    organization_id: opsional(f.organization_id), status_akreditasi: opsional(f.status_akreditasi),
    tanggal_akreditasi: opsional(f.tanggal_akreditasi), puskesmas_wilayah: opsional(f.puskesmas_wilayah),
});
export const galatProfil = (f) => galatSkema(profilKlinikMasukan, bentukProfil(f));
export const profilBerubah = (awal, f) => Object.keys(awal).some((k) => awal[k].trim() !== f[k].trim());
export const labelJenisRiwayat = (jenis) => PROFIL_KLINIK.riwayatJenis[jenis] ?? jenis;
