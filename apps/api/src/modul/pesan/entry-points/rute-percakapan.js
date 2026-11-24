import * as db from '@klira/db';
import { dekripsiRahasia } from '@klira/db';
import { punyaIzin, ubahPercakapanWa } from '@klira/shared';
import { pengguna } from '../../../umum/rute.js';
const idValid = (v) => (typeof v === 'string' && /^[1-9]\d{0,9}$/.test(v) ? Number(v) : 0);
/**
 * Rute percakapan yang sama untuk kanal pesan (WhatsApp, Instagram): ringkasan belum dibaca, pemuatan percakapan,
 * daftar pesan, tandai baca, info kontak, dan tautan pasien/penanggung jawab. Perbedaan kanal masuk lewat `o`:
 * kanal, entitasPercakapan (entitas audit), tolak, kabarkan, sahPercakapan(row), dan fungsi akses data `o.data`.
 */
export function pasangRutePercakapan(rute, audit, wajibIzin, o) {
    const dasar = `/${o.kanal}`;
    const opsiAudit = { entitas: o.entitasPercakapan, id: (req) => Number(req.params.id) };
    rute.get(`${dasar}/ringkasan`, wajibIzin(o.kanal, 'lihat'), async (_req, res) => {
        const rows = await o.data.hitungBelumDibaca(pengguna(res).id);
        res.json({ data: { belum_dibaca: Number(rows[0]?.belum ?? 0), terbaru: rows[0]?.terbaru ?? 0 } });
    });
    rute.use(`${dasar}/percakapan/:id`, wajibIzin(o.kanal, 'lihat'), async (req, res, next) => {
        const row = await o.data.cariPercakapan(idValid(req.params.id));
        if (!row || !o.sahPercakapan(row))
            return o.tolak(res, 'Percakapan pribadi tidak ditemukan', 404);
        res.locals.percakapan = row;
        next();
    });
    rute.get(`${dasar}/percakapan/:id/pesan`, audit.lihat(opsiAudit), async (req, res) => {
        const rows = await o.data.daftarPesan(res.locals.percakapan.id, 10);
        res.setHeader('Cache-Control', 'no-store');
        res.json({ data: rows.reverse().map(({ isi, ...row }) => ({ ...row, teks: dekripsiRahasia(isi) })) });
    });
    rute.post(`${dasar}/percakapan/:id/baca`, async (req, res) => {
        const id = res.locals.percakapan.id;
        const terakhir = Number(req.body?.pesan_id);
        if (!Number.isSafeInteger(terakhir) ||
            terakhir <= 0 ||
            !(await o.data.cariPesan(terakhir, id)))
            return o.tolak(res, 'Pesan tidak valid');
        await o.data.simpanBaca(id, pengguna(res).id, terakhir);
        await o.data.ubahBaca(terakhir, id, pengguna(res).id);
        o.kabarkan({ tipe: 'baca' });
        res.json({ data: { ok: true } });
    });
    rute.get(`${dasar}/percakapan/:id/info`, audit.lihat(opsiAudit), async (_req, res) => {
        const row = res.locals.percakapan;
        const user = pengguna(res);
        const [pasien, penanggung] = await Promise.all([
            row.pasien_id && punyaIzin(user, 'pasien', 'lihat')
                ? db.cariPasienUntukBuatRuteInstagram(row.pasien_id)
                : null,
            row.penanggung_jawab
                ? db.cariPenggunaUntukBuatRuteInstagram(row.penanggung_jawab)
                : null,
        ]);
        res.setHeader('Cache-Control', 'no-store');
        res.json({ data: { pasien_tertaut: !!row.pasien_id, pasien, penanggung } });
    });
    rute.patch(`${dasar}/percakapan/:id`, wajibIzin(o.kanal, 'lihat'), audit.perbaikan(opsiAudit), async (req, res) => {
        const hasil = ubahPercakapanWa.safeParse(req.body);
        if (!hasil.success)
            return o.tolak(res, 'Tautan pasien atau penanggung jawab tidak valid');
        if (hasil.data.penanggung_jawab &&
            !(await db.cariPenggunaUntukBuatRuteInstagram2(hasil.data.penanggung_jawab, true)))
            return o.tolak(res, 'Akun penanggung jawab tidak ditemukan');
        if (hasil.data.pasien_id) {
            const user = pengguna(res);
            if (!punyaIzin(user, 'pasien', 'lihat'))
                return o.tolak(res, 'Tidak memiliki izin mengakses pasien', 403);
            const pasien = await db.cariPasienUntukBuatRuteInstagram2(hasil.data.pasien_id);
            if (!pasien)
                return o.tolak(res, 'Pasien tidak ditemukan', 404);
            const diperbarui = await o.data.tautkanPasien(hasil.data?.pasien_id, hasil.data?.penanggung_jawab, res.locals.percakapan.id, null, pasien.id);
            if (!diperbarui.count)
                return o.tolak(res, 'Kontak sudah ditautkan ke pasien lain', 409);
        }
        else
            await o.data.ubahTautan(hasil.data?.pasien_id, hasil.data?.penanggung_jawab, res.locals.percakapan.id);
        o.kabarkan({ tipe: 'percakapan' });
        res.json({ data: { ok: true } });
    });
}
