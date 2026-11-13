import * as db from '@klira/db';
import { Router } from 'express';
import { websiteKlinikMasukan } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { alamatDari, PenampungAuditMysql } from '../../../middleware/audit.js';
import { galatValidasi } from '../../../umum/hasil.js';
import { bacaKlinikPublik, pengaturanWebsite } from '../data-access/data.js';
export function buatRuteWebsitePublik() {
    const r = Router();
    r.get(['/publik/klinik', '/publik/klinik/:slug'], async (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        const slug = typeof req.params.slug === 'string' ? req.params.slug : undefined;
        if (req.params.slug !== undefined && (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))
            return void res.status(404).json({ galat: { pesan: 'Halaman klinik tidak ditemukan.' } });
        try {
            const data = await bacaKlinikPublik(req.hostname, slug);
            if (!data)
                return void res.status(404).json({ galat: { pesan: 'Halaman klinik belum tersedia.' } });
            res.json({ data });
        }
        catch (e) {
            next(e);
        }
    });
    return r;
}
export function buatRuteWebsitePengaturan(akses, izin) {
    const r = Router();
    const masuk = wajibMasuk(akses);
    const { wajibIzin } = buatWajibIzin(izin);
    r.get('/fasyankes/website', masuk, wajibIzin('profil-klinik', 'lihat'), async (_req, res, next) => {
        try {
            const data = await pengaturanWebsite(res.locals.pengguna.fasyankes_id);
            if (!data)
                return void res.status(404).json({ galat: { pesan: 'Profil klinik tidak ditemukan.' } });
            res.setHeader('Cache-Control', 'no-store');
            res.json({ data });
        }
        catch (e) {
            next(e);
        }
    });
    r.put('/fasyankes/website', masuk, wajibIzin('profil-klinik', 'perbaikan'), async (req, res, next) => {
        const nilai = websiteKlinikMasukan.safeParse(req.body);
        if (!nilai.success)
            return galatValidasi(res, nilai.error);
        const p = res.locals.pengguna;
        try {
            await db.transaksi(async (tx) => {
                await db.simpanWebsiteKlinikUntukBuatRuteWebsitePengaturan(p.fasyankes_id, (nilai.data)?.aktif, (nilai.data)?.slug, nilai.data.domain || null, (nilai.data)?.judul, (nilai.data)?.ringkasan, (nilai.data)?.tentang, (nilai.data)?.alamat, (nilai.data)?.whatsapp, (nilai.data)?.telepon, (nilai.data)?.email, (nilai.data)?.jam_operasional, (nilai.data)?.warna_utama, (nilai.data)?.logo_url, (nilai.data)?.hero_url, (nilai.data)?.tampilkan_jadwal, (nilai.data)?.tampilkan_nama_praktisi, new Date(), tx);
                await db.tambahRiwayatProfilUntukBuatRuteWebsitePengaturan(p.fasyankes_id, 'profil', 'Pengaturan website publik diperbarui.', p.id, tx);
            });
            await new PenampungAuditMysql().catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'website_klinik', keterangan: 'Pengaturan website publik diperbarui.', alamat: alamatDari(req) });
            res.json({ data: await pengaturanWebsite(p.fasyankes_id) });
        }
        catch (e) {
            if (db.bentrokUnik(e))
                return void res.status(409).json({ galat: { pesan: 'Alamat halaman atau domain sudah digunakan klinik lain.' } });
            next(e);
        }
    });
    return r;
}
