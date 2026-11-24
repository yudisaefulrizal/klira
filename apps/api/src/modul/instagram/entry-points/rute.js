import * as db from '@klira/db';
import { pasangRuteBersihkan } from '../../pesan/domain/bersihkan.js';
import { perbaruiNamaKontakInstagram } from '../domain/profil.js';
import { pasangRuteKoneksi } from '../domain/koneksi.js';
import { kirimMeta, idPesan, hash, konfigurasiMeta, GalatMeta } from '../domain/meta.js';
import { kabarkanInstagram } from '../domain/kanal.js';
import { pasangRutePercakapan } from '../../pesan/entry-points/rute-percakapan.js';
import { randomUUID, randomBytes } from 'node:crypto';
import express, { Router } from 'express';
import { enkripsiRahasia, dekripsiRahasia, kunciPercakapanInstagram, pangkasPesanInstagram, } from '@klira/db';
import { kirimPesanWa, } from '@klira/shared';
import { buatFasilitasAudit } from '../../../middleware/audit.js';
import { wajibMasuk } from '../../../middleware/auth.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { pengguna } from '../../../umum/rute.js';
const tolak = (res, pesan, status = 400) => {
    res.status(status).json({ galat: { kode: 'instagram', pesan } });
};
export function buatRuteInstagram(akses, izin) {
    const rute = Router();
    const masuk = wajibMasuk(akses);
    const audit = buatFasilitasAudit();
    const { wajibIzin } = buatWajibIzin(izin);
    rute.use('/instagram', masuk);
    pasangRuteBersihkan(rute, 'instagram', wajibIzin('instagram', 'lihat'));
    pasangRuteKoneksi(rute, wajibIzin('instagram', 'lihat'));
    rute.get('/instagram/percakapan', wajibIzin('instagram', 'lihat'), async (req, res) => {
        const user = pengguna(res);
        const halaman = Math.min(1000, Math.max(1, Number(req.query.halaman) || 1));
        const rows = await db.daftarIgPercakapanUntukBuatRuteInstagram(200, (Math.floor(halaman) - 1) * 200, 1, user.id);
        for (const row of rows)
            void perbaruiNamaKontakInstagram(row.id);
        res.json({
            data: await Promise.all(rows.map(async ({ pesan, baca, ...row }) => ({
                ...row,
                terakhir: pesan[0] ? dekripsiRahasia(pesan[0].isi).slice(0, 160) || `[${pesan[0].jenis}]` : '',
                belum_dibaca: await db.hitungIgPesanUntukBuatRuteInstagram(row.id, 'masuk', baca[0]?.pesan_id ?? 0),
            }))),
        });
    });
    pasangRutePercakapan(rute, audit, wajibIzin, {
        kanal: 'instagram', entitasPercakapan: 'ig_percakapan', tolak, kabarkan: kabarkanInstagram,
        sahPercakapan: () => true,
        data: {
            hitungBelumDibaca: db.hitungIgPercakapanBelumDibaca,
            cariPercakapan: db.cariIgPercakapanUntukBuatRuteInstagram,
            daftarPesan: db.daftarIgPesanUntukBuatRuteInstagram,
            cariPesan: db.cariIgPesanUntukBuatRuteInstagram,
            simpanBaca: db.simpanIgBacaUntukBuatRuteInstagram,
            ubahBaca: db.ubahIgBacaUntukBuatRuteInstagram,
            tautkanPasien: db.ubahIgPercakapanUntukBuatRuteInstagram,
            ubahTautan: db.ubahIgPercakapanUntukBuatRuteInstagram2,
        },
    });
    // Badan berlampiran (hingga 8 MB, base64) baru diurai di sini: sesi, izin, dan kepemilikan percakapan sudah diperiksa.
    rute.post('/instagram/percakapan/:id/pesan', wajibIzin('instagram', 'lihat'), express.json({ limit: '12mb' }), audit.lihat({ entitas: 'ig_pesan', ringkasan: 'Permintaan kirim pesan Instagram' }), async (req, res) => {
        const hasil = kirimPesanWa.safeParse(req.body);
        if (!hasil.success)
            return tolak(res, hasil.error.issues[0].message);
        const user = pengguna(res);
        const koneksi = await db.ambilIgKoneksi(1);
        if (!koneksi || !koneksi.aktif || koneksi.penyedia !== 'meta' || koneksi.status !== 'terhubung' || !koneksi.access_token || !koneksi.token_berakhir || koneksi.token_berakhir.getTime() <= Date.now() || !koneksi.webhook_aktif)
            return tolak(res, 'Instagram belum terhubung. Buka menu Pesan → Instagram.', 409);
        const { teks, media } = hasil.data;
        if (media && teks)
            return tolak(res, 'Kirim gambar dan teks secara terpisah.');
        if (media &&
            (!/^[A-Za-z0-9+/]*={0,2}$/.test(media.base64) ||
                Buffer.from(media.base64, 'base64').length > 8 * 1024 * 1024 ||
                !media.base64.length))
            return tolak(res, 'Lampiran tidak valid atau melebihi 8 MB');
        if (media && !['image/jpeg', 'image/png'].includes(media.mime))
            return tolak(res, 'Pilih gambar JPG atau PNG');
        const row = await db.transaksi(async (tx) => {
            await kunciPercakapanInstagram(tx, res.locals.percakapan.id);
            let mediaId = null;
            if (media) {
                mediaId = randomUUID();
                await db.tambahIgMediaUntukBuatRuteInstagram(mediaId, enkripsiRahasia(media.base64), media.mime, media.nama, tx);
            }
            const pesan = await (async () => {
                const _hasil = await db.tambahIgPesanUntukBuatRuteInstagram(res.locals.percakapan.id, 'keluar', enkripsiRahasia(teks), media
                    ? media.mime.startsWith('image/')
                        ? 'image'
                        : media.mime.startsWith('audio/')
                            ? 'audio'
                            : media.mime.startsWith('video/')
                                ? 'video'
                                : 'document'
                    : 'text', mediaId, 'mengirim', user.id, tx);
                return db.tambahIgPesanUntukBuatRuteInstagramHasil(_hasil.id, tx);
            })();
            await db.ubahIgPercakapanUntukBuatRuteInstagram3(new Date(), res.locals.percakapan.id, tx);
            await pangkasPesanInstagram(tx, res.locals.percakapan.id);
            return pesan;
        });
        kabarkanInstagram({ tipe: 'pesan' });
        try {
            let gambarUrl;
            if (media && row.media_id) {
                const token = randomBytes(32).toString('hex');
                await db.tambahIgMediaPublikUntukBuatRuteInstagram(hash(token), row.media_id, koneksi.generasi, new Date(Date.now() + 15 * 60000));
                gambarUrl = `${konfigurasiMeta().origin}/instagram/media/${token}`;
            }
            const current = await db.ambilIgKoneksi(1);
            if (!current?.aktif || current.generasi !== koneksi.generasi)
                throw new GalatMeta('Koneksi berubah. Hubungkan ulang Instagram.', 409, true);
            const mid = await kirimMeta(dekripsiRahasia(koneksi.access_token), koneksi.akun_id, res.locals.percakapan.jid, teks, gambarUrl);
            await db.transaksi(async (tx) => {
                await kunciPercakapanInstagram(tx, res.locals.percakapan.id);
                const local = await db.ambilIgPesanUntukBuatRuteInstagram(row.id, tx);
                if (!local)
                    return; // Data may have been deleted by a signed deletion request.
                const echo = await db.ambilIgPesanUntukBuatRuteInstagram2(idPesan(koneksi.akun_id, mid), tx);
                if (echo && echo.id !== row.id) {
                    await db.hapusIgPesanUntukBuatRuteInstagram(echo.id, tx);
                    if (echo.media_id)
                        await db.hapusIgMediaUntukBuatRuteInstagram(echo.media_id, tx);
                }
                await db.ubahIgPesanUntukBuatRuteInstagram(idPesan(koneksi.akun_id, mid), 'terkirim', row.id, tx);
            });
        }
        catch (e) {
            const ditolak = e instanceof GalatMeta && e.pastiDitolak;
            await db.ubahIgPesanUntukBuatRuteInstagram2(ditolak ? 'gagal' : 'belum pasti', row.id);
            if (e instanceof GalatMeta && e.dicabut)
                await db.ubahIgKoneksiUntukBuatRuteInstagram(false, 'dicabut', null, 1, koneksi.generasi);
            kabarkanInstagram({ tipe: 'pesan' });
            return tolak(res, ditolak ? e.message : 'Pengiriman belum terkonfirmasi. Periksa Instagram sebelum mengirim ulang.', 502);
        }
        await db.transaksi(async (tx) => {
            await kunciPercakapanInstagram(tx, res.locals.percakapan.id);
            await pangkasPesanInstagram(tx, res.locals.percakapan.id);
        });
        kabarkanInstagram({ tipe: 'pesan' });
        res.status(201).json({ data: { id: row.id } });
    });
    rute.get('/instagram/media/:id', wajibIzin('instagram', 'lihat'), audit.lihat({ entitas: 'ig_media' }), async (req, res) => {
        const row = await db.cariIgMediaUntukBuatRuteInstagram(String(req.params.id));
        if (!row)
            return tolak(res, 'Lampiran tidak ditemukan', 404);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        const buffer = Buffer.from(dekripsiRahasia(row.isi), 'base64');
        const mimePratinjau = new Set([
            'image/jpeg',
            'image/png',
            'image/webp',
            'video/mp4',
            'audio/ogg',
            'audio/mpeg',
            'audio/mp4',
        ]);
        const inline = req.query.pratinjau === '1' && mimePratinjau.has(row.mime);
        if (!inline) {
            res.type('application/octet-stream');
            res.attachment(row.nama);
            return void res.send(buffer);
        }
        res.type(row.mime);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Accept-Ranges', 'bytes');
        const range = req.headers.range;
        if (range) {
            const bagian = /^bytes=(\d*)-(\d*)$/.exec(range);
            let awal = bagian?.[1] ? Number(bagian[1]) : 0;
            let akhir = bagian?.[2] ? Number(bagian[2]) : buffer.length - 1;
            if (bagian && !bagian[1] && bagian[2]) {
                awal = Math.max(0, buffer.length - Number(bagian[2]));
                akhir = buffer.length - 1;
            }
            if (!bagian ||
                (!bagian[1] && !bagian[2]) ||
                !Number.isSafeInteger(awal) ||
                !Number.isSafeInteger(akhir) ||
                awal > akhir ||
                awal >= buffer.length) {
                res.setHeader('Content-Range', `bytes */${buffer.length}`);
                return void res.status(416).end();
            }
            akhir = Math.min(akhir, buffer.length - 1);
            res.setHeader('Content-Range', `bytes ${awal}-${akhir}/${buffer.length}`);
            return void res.status(206).send(buffer.subarray(awal, akhir + 1));
        }
        res.send(buffer);
    });
    return rute;
}
