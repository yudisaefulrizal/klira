import { Router } from 'express';
import { GALAT, KEAMANAN, filterRiwayatBackup, pengaturanKeamananMasukan } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { BATAS_UNGGAH_CADANGAN, CadanganLewatWebMati, GalatCadangan } from '../domain/layanan-cadangan.js';
import { bungkus, pengguna } from '../../../umum/rute.js';
import { galatValidasi } from '../../../umum/hasil.js';
/** Rute tab Keamanan: lihat butuh `akses` lihat, simpan butuh `akses` perbaikan; riwayat backup hanya baca. `cadangan`: layanan cadangan sistem. */
export function buatRuteKeamanan(layananAkses, layananIzin, layanan, cadangan) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin } = buatWajibIzin(layananIzin);
    rute.get('/pengaturan-keamanan', masuk, wajibIzin('akses', 'lihat'), bungkus(async (_req, res) => {
        res.json({ data: await layanan.ambil(pengguna(res)) });
    }));
    rute.patch('/pengaturan-keamanan', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
        const h = pengaturanKeamananMasukan.safeParse(req.body ?? {});
        if (!h.success)
            return galatValidasi(res, h.error);
        res.json({ data: await layanan.simpan(pengguna(res), h.data, alamatDari(req)) });
    }));
    rute.get('/riwayat-backup', masuk, wajibIzin('akses', 'lihat'), bungkus(async (req, res) => {
        const h = filterRiwayatBackup.safeParse(req.query);
        if (!h.success)
            return galatValidasi(res, h.error);
        res.json({ data: { ...(await layanan.daftarBackup(pengguna(res), h.data.halaman, h.data.ukuran)), pulihkan_lewat_web: cadangan.lewatWeb } });
    }));
    // Cadangan sistem: hanya yang boleh memperbaiki akses. Semua operasi dicatat layanan cadangan sebelum dijalankan.
    // Unduh selalu tersedia; pulihkan dan reset lewat web mati kecuali dihidupkan operator (KLIRA_PULIHKAN_LEWAT_WEB=1).
    const kirimGalat = (res, e) => {
        if (res.headersSent)
            return;
        if (e instanceof CadanganLewatWebMati)
            return void res.status(403).json({ galat: { kode: 'dinonaktifkan', pesan: KEAMANAN.lewatServer } });
        if (e instanceof GalatCadangan)
            return void res.status(400).json({ galat: { kode: 'tidak_valid', pesan: e.message } });
        console.error(e);
        res.status(500).json({ galat: { kode: 'galat_server', pesan: GALAT.umum } });
    };
    rute.get('/cadangan/unduh', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
        let unduhan;
        try {
            unduhan = await cadangan.mulaiUnduh(pengguna(res), alamatDari(req));
        }
        catch (e) {
            return kirimGalat(res, e);
        }
        const { aliran, selesai, batal } = unduhan;
        const stempel = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
        res.setHeader('content-type', 'application/sql');
        res.setHeader('content-disposition', `attachment; filename="klira-backup-${stempel}.sql"`);
        res.setHeader('cache-control', 'no-store');
        res.on('close', () => { if (!res.writableFinished)
            batal(); });
        aliran.pipe(res);
        selesai.catch(() => res.destroy());
    }));
    // Unggah dikirim mentah (bukan JSON) agar tidak dimuat ke memori.
    rute.post('/cadangan/pulihkan', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
        if (cadangan.lewatWeb && Number(req.headers['content-length']) > BATAS_UNGGAH_CADANGAN)
            return void res.status(413).json({ galat: { kode: 'terlalu_besar', pesan: KEAMANAN.unggahTerlaluBesar(BATAS_UNGGAH_CADANGAN / 1024 / 1024) } });
        try {
            await cadangan.pulihkan(pengguna(res), req, alamatDari(req));
            res.json({ data: { ok: true } });
        }
        catch (e) {
            kirimGalat(res, e);
        }
    }));
    rute.post('/cadangan/reset', masuk, wajibIzin('akses', 'perbaikan'), bungkus(async (req, res) => {
        if (req.body?.konfirmasi !== 'RESET')
            return void res.status(400).json({ galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid } });
        try {
            await cadangan.reset(pengguna(res), alamatDari(req));
            res.json({ data: { ok: true } });
        }
        catch (e) {
            kirimGalat(res, e);
        }
    }));
    return rute;
}
