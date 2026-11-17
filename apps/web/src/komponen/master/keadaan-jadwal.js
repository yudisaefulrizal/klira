export const TAMPILAN_JADWAL = ['poli', 'dokter'];
export const HARI = [1, 2, 3, 4, 5, 6, 7];
/** Jadwal milik satu dokter (id dalam bentuk teks); kosong = semua dokter. */
export const saringDokter = (daftar, dokterId) => (dokterId ? daftar.filter((b) => String(b.pengguna_id) === String(dokterId)) : daftar);
/** Jadwal di satu poli (id dalam bentuk teks); kosong = semua poli. */
export const saringPoli = (daftar, poliId) => (poliId ? daftar.filter((b) => String(b.lokasi_id) === String(poliId)) : daftar);
/** Sel peta: tiap item punya sel untuk setiap shift x hari; sel berisi daftar jadwal (bisa beberapa) atau kosong. */
function petaSel(daftar, item, shift, milik, urutNama) {
    const sel = {};
    for (const s of shift) sel[s.id] = Object.fromEntries(HARI.map((h) => [h, []]));
    for (const b of daftar) if (milik(b) && sel[b.shift_id]?.[Number(b.hari)]) sel[b.shift_id][Number(b.hari)].push(b);
    for (const s of shift) for (const h of HARI) sel[s.id][h].sort((a, b) => String(a[urutNama]).localeCompare(String(b[urutNama])));
    return { ...item, sel };
}
/** Peta per poli: semua poli (termasuk yang belum punya jadwal). `poli` = [{ id, nama }], `shift` = [{ id, ... }] urut Pagi-Malam. */
export const petaPoli = (daftar, poli, shift) => poli.map((p) => petaSel(daftar, p, shift, (b) => Number(b.lokasi_id) === Number(p.id), 'pengguna_nama'));
/** Peta per dokter: semua dokter (termasuk yang belum punya jadwal); sel berisi poli tempat dokter bertugas. */
export const petaDokter = (daftar, dokter, shift) => dokter.map((d) => petaSel(daftar, d, shift, (b) => Number(b.pengguna_id) === Number(d.id), 'lokasi_nama'));
