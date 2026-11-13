import { PERINGATAN_IZIN, kunciIzin } from '@klira/shared';
export const aktifPada = (mulai, selesai, t) => mulai.getTime() <= t.getTime() && (selesai === null || selesai.getTime() > t.getTime());
/**
 * Akses efektif (2.0 butir 5): gabungan izin semua jenis akun aktif pada periode berjalan,
 * ditambah izin tambahan aktif, dikurangi izin pengurangan aktif (pengurangan menang atas tambahan).
 */
export function hitungAksesEfektif(snap, t) {
    if (!snap.aktif)
        return { pengguna_id: snap.pengguna_id, jenis_akun: [], izin: [], fitur: [] };
    const peta = new Map();
    const jenis = new Set();
    for (const p of snap.penugasan) {
        if (!p.jenis_aktif || !aktifPada(p.mulai, p.selesai, t))
            continue;
        jenis.add(p.jenis_nama);
        for (const i of p.izin)
            peta.set(kunciIzin(i), { fitur: i.fitur, aksi: i.aksi, cakupan: i.cakupan });
    }
    const aktif = snap.izin_akun.filter((x) => aktifPada(x.mulai, x.selesai, t));
    for (const x of aktif)
        if (x.tipe === 'tambah')
            peta.set(kunciIzin(x.izin), { ...x.izin });
    for (const x of aktif)
        if (x.tipe === 'kurang')
            peta.delete(kunciIzin(x.izin));
    const izin = [...peta.values()].sort((a, b) => kunciIzin(a).localeCompare(kunciIzin(b)));
    return { pengguna_id: snap.pengguna_id, jenis_akun: [...jenis], izin, fitur: [...new Set(izin.map((i) => i.fitur))] };
}
const POLA_DOKTER = /dokter/i;
const POLA_KEFARMASIAN = /apoteker|farmasi|kefarmasian/i;
const POLA_ADMIN = /admin\s*(it|vendor)/i;
const akhirHari = (d) => new Date(d.getTime() + 86_400_000);
const sipAktif = (p, t) => !!p.nomor_sip && (p.masa_berlaku_sip === null || akhirHari(p.masa_berlaku_sip).getTime() > t.getTime());
/**
 * Evaluasi enam peringatan izin (2.2) untuk keadaan saat ini; hasilnya tidak memblokir apa pun.
 * `konteks` memuat data tindakan (mis. pembuat dan penyetuju perbaikan).
 */
export function evaluasiPeringatan(snap, t, konteks = {}) {
    const hasil = [];
    if (!snap.aktif)
        return hasil;
    const akses = hitungAksesEfektif(snap, t);
    const tambah = (jenis, kunci, fitur_terkait, ekstra = {}) => hasil.push({ jenis, kunci: `${jenis}|${kunci}`, pesan: PERINGATAN_IZIN[jenis], fitur_terkait, ...ekstra });
    const izinFitur = (fitur, aksi) => akses.izin.find((i) => i.fitur === fitur && (!aksi || aksi.includes(i.aksi)));
    const dokter = snap.profil.some((p) => POLA_DOKTER.test(p.profesi) && !!p.nomor_sip);
    const kefarmasian = snap.profil.some((p) => POLA_KEFARMASIAN.test(p.profesi));
    // 1. Izin klinis (resep) ke bukan dokter ber-SIP; pengeluaran obat ke bukan tenaga kefarmasian.
    const resep = izinFitur('resep', ['input', 'perbaikan']);
    if (resep && !dokter)
        tambah('izin_klinis_non_dokter', 'resep', ['resep'], { izin: resep });
    const farmasi = izinFitur('farmasi', ['input']);
    if (farmasi && !kefarmasian)
        tambah('izin_klinis_non_dokter', 'farmasi', ['farmasi'], { izin: farmasi });
    // 2. Pembuat = penyetuju perbaikan.
    if (konteks.pembuat_id != null && konteks.pembuat_id === konteks.penyetuju_id && konteks.pembuat_id === snap.pengguna_id) {
        tambah('perbaikan_pembuat_penyetuju_sama', String(snap.pengguna_id), ['rekam-medis', 'klinis']);
    }
    // 3. Izin lihat rekam medis tidak dibatasi ke unit yang ditangani (cakupan layanan).
    const lihatLuas = akses.izin.find((i) => i.fitur === 'rekam-medis' && i.aksi === 'lihat' && i.cakupan === 'layanan');
    if (lihatLuas)
        tambah('lihat_tak_dibatasi', 'rekam-medis', ['rekam-medis'], { izin: lihatLuas });
    // 4. Admin IT atau admin vendor diberi izin lihat isi rekam medis.
    const jabatanAdmin = snap.penugasan.some((p) => p.jenis_aktif && aktifPada(p.mulai, p.selesai, t) && POLA_ADMIN.test(p.jenis_nama));
    const lihatRm = izinFitur('rekam-medis', ['lihat']);
    if (jabatanAdmin && lihatRm)
        tambah('admin_lihat_rekam_medis', 'rekam-medis', ['rekam-medis'], { izin: lihatRm });
    // 5. Nakes tanpa SIP aktif diberi izin klinis.
    const nakes = snap.profil.length > 0 || snap.penugasan.some((p) => p.syarat_profesi && p.jenis_aktif && aktifPada(p.mulai, p.selesai, t));
    const klinis = izinFitur('klinis', ['input', 'perbaikan']) ?? resep;
    if (nakes && klinis && !snap.profil.some((p) => sipAktif(p, t))) {
        tambah('nakes_tanpa_sip', 'akun', ['klinis', 'resep'], { izin: klinis });
    }
    // 6. Penugasan jenis akun melewati masa berlaku SIP.
    const masaSip = snap.profil
        .filter((p) => p.nomor_sip && p.masa_berlaku_sip)
        .map((p) => akhirHari(p.masa_berlaku_sip).getTime())
        .sort((a, b) => b - a)[0];
    if (masaSip !== undefined) {
        for (const p of snap.penugasan) {
            if (!p.syarat_profesi || !p.jenis_aktif || (p.selesai !== null && p.selesai.getTime() <= t.getTime()))
                continue;
            if (p.selesai === null || p.selesai.getTime() > masaSip) {
                tambah('penugasan_lewat_sip', `j${p.jenis_akun_id}`, [...new Set(p.izin.map((i) => i.fitur))], {
                    ...(p.id > 0 ? { penugasan_id: p.id } : {}),
                });
            }
        }
    }
    return hasil;
}
/** Peringatan yang muncul akibat perubahan: ada sesudah, belum ada sebelum. */
export function peringatanBaru(sebelum, sesudah, t) {
    const lama = new Set(evaluasiPeringatan(sebelum, t).map((w) => w.kunci));
    return evaluasiPeringatan(sesudah, t).filter((w) => !lama.has(w.kunci));
}
/** Peringatan yang relevan untuk tindakan pada fitur tertentu. */
export function relevanUntukTindakan(daftar, fitur) {
    return daftar.filter((w) => w.fitur_terkait.includes(fitur));
}
