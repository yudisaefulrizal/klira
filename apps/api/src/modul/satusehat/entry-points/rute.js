import { Router } from 'express';
import QRCode from 'qrcode';
import * as db from '@klira/db';
import { GALAT, idParam } from '@klira/shared';
import { wajibMasuk } from '../../../middleware/auth.js';
import { alamatDari } from '../../../middleware/audit.js';
import { buatWajibIzin } from '../../../middleware/izin.js';
import { bungkus, pengguna } from '../../../umum/rute.js';
const status = { tidak_valid: 400, tidak_ditemukan: 404, belum_lengkap: 409, konflik: 409 };
/** Rute koneksi SATUSEHAT: lihat butuh `satusehat` lihat; uji butuh `satusehat` perbaikan. Rahasia tidak pernah dikembalikan. */
export function buatRuteSatusehat(layananAkses, layananIzin, layanan, sinkronIhs, kirimSatusehat = null, pelayananPcare = null) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin, wajibIzinSalahSatu } = buatWajibIzin(layananIzin);
    const jawab = (res, h) => {
        if (h.ok)
            return void res.json({ data: h.data });
        const badan = { galat: { kode: h.kode, pesan: h.pesan, ...(h.bidang ? { rincian: [{ jalur: h.bidang, pesan: h.pesan }] } : {}) } };
        res.status(status[h.kode] ?? 400).json(badan);
    };
    rute.get('/satusehat/konfigurasi', masuk, wajibIzin('satusehat', 'lihat'), bungkus(async (_req, res) => {
        res.json({ data: await layanan.ambil(pengguna(res)) });
    }));
    rute.post('/satusehat/konfigurasi/uji', masuk, wajibIzin('satusehat', 'perbaikan'), bungkus(async (_req, res) => {
        jawab(res, await layanan.uji());
    }));
    /** Cari ulang IHS Number satu pasien (petugas pendaftaran atau admin SATUSEHAT), mis. setelah NIK diperbaiki atau koneksi dipulihkan. */
    rute.post('/satusehat/pasien/:id/ihs', masuk, wajibIzinSalahSatu(['satusehat', 'perbaikan'], ['pasien', 'perbaikan']), bungkus(async (req, res) => {
        const id = idParam.safeParse(req.params);
        if (!id.success)
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        const hasil = await sinkronIhs(pengguna(res), id.data.id, { paksa: true, alamat: alamatDari(req) });
        if (hasil.alasan === 'pasien_tidak_ada')
            return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
        res.json({ data: hasil });
    }));
    if (kirimSatusehat) {
        rute.post('/satusehat/kunjungan/:id/kirim', masuk, wajibIzinSalahSatu(['satusehat', 'perbaikan'], ['kunjungan', 'perbaikan'], ['klaim', 'perbaikan']), bungkus(async (req, res) => {
            const id = idParam.safeParse(req.params);
            if (!id.success)
                return void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
            jawab(res, await kirimSatusehat.kirimKunjungan(pengguna(res), id.data.id, alamatDari(req)));
        }));
    }
    if (kirimSatusehat || pelayananPcare) {
        rute.get('/integrasi/sinkronisasi', masuk, wajibIzinSalahSatu(['satusehat', 'lihat'], ['klaim', 'lihat']), bungkus(async (req, res) => {
            const tgl = String(req.query?.tanggal ?? '').trim();
            const cari = String(req.query?.cari ?? '').trim() || null;
            const mulai = /^\d{4}-\d{2}-\d{2}$/.test(tgl) ? new Date(`${tgl}T00:00:00+07:00`) : null;
            const selesai = mulai ? new Date(mulai.getTime() + 86_400_000) : null;
            const semua = await db.daftarPemantauanIntegrasi({ mulai, selesai, cari, batas: 100 });
            const ringkasan = { total: semua.length, pcare_terkirim: 0, pcare_gagal: 0, pcare_belum: 0, ss_terkirim: 0, ss_belum: 0 };
            for (const b of semua) {
                if (b.cara_pembayaran === 'jkn') {
                    if (b.pcare_no_kunjungan && b.pcare_status === 'terkirim')
                        ringkasan.pcare_terkirim += 1;
                    else if (b.pcare_status === 'gagal')
                        ringkasan.pcare_gagal += 1;
                    else
                        ringkasan.pcare_belum += 1;
                }
                if (b.encounter_id)
                    ringkasan.ss_terkirim += 1;
                else
                    ringkasan.ss_belum += 1;
            }
            const layananFilter = req.query?.layanan;
            const statusFilter = req.query?.status;
            const baris = semua.filter((b) => {
                if (layananFilter === 'pcare' && b.cara_pembayaran !== 'jkn')
                    return false;
                if (statusFilter === 'terkirim')
                    return layananFilter === 'pcare' ? b.pcare_status === 'terkirim' : layananFilter === 'satusehat' ? Boolean(b.encounter_id) : (b.pcare_status === 'terkirim' && Boolean(b.encounter_id));
                if (statusFilter === 'gagal')
                    return b.cara_pembayaran === 'jkn' && b.pcare_status === 'gagal';
                if (statusFilter === 'belum')
                    return layananFilter === 'pcare' ? (b.cara_pembayaran === 'jkn' && !b.pcare_no_kunjungan) : layananFilter === 'satusehat' ? !b.encounter_id : (!b.encounter_id || (b.cara_pembayaran === 'jkn' && !b.pcare_no_kunjungan));
                return true;
            });
            res.json({ data: { ringkasan, baris } });
        }));
        rute.post('/integrasi/tte-qr', masuk, bungkus(async (req, res) => {
            const teks = String(req.body?.teks ?? '').trim().slice(0, 500);
            if (!teks)
                return res.status(400).json({ galat: { kode: 'tidak_valid', pesan: 'Teks QR wajib diisi.' } });
            const qr = await QRCode.toDataURL(teks, { width: 112, margin: 1 });
            res.json({ data: { qr } });
        }));
    }
    return rute;
}
