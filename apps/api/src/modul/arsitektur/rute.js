import { Router } from 'express';
import { bacaSkemaDatabase } from '@klira/db';
import { wajibMasuk } from '../../middleware/auth.js';
import { buatWajibIzin } from '../../middleware/izin.js';

function kumpulkanRuteExpress(router) {
    const hasil = [];
    const telusuri = (stack, awalan = '') => {
        if (!Array.isArray(stack)) return;
        for (const layer of stack) {
            if (layer.route?.path) {
                const jalur = `${awalan}${layer.route.path}`;
                const metode = Object.keys(layer.route.methods || {})
                    .filter((m) => layer.route.methods[m])
                    .map((m) => m.toUpperCase());
                for (const m of metode) hasil.push({ metode: m, jalur });
            } else if (layer.name === 'router' && layer.handle?.stack) {
                const segmen = layer.regexp?.source
                    ?.replace('\\/?(?=\\/|$)', '')
                    ?.replace('^\\/', '/')
                    ?.replace(/\\\//g, '/')
                    ?.replace(/\(\?:\(\[\^\\\/]\+\?\)\)/g, ':param') || '';
                const bersih = segmen.startsWith('/') && !segmen.includes('^') ? segmen : '/api';
                telusuri(layer.handle.stack, awalan || bersih);
            }
        }
    };
    telusuri(router?.stack);
    const unik = new Map();
    for (const r of hasil) unik.set(`${r.metode} ${r.jalur}`, r);
    return [...unik.values()].sort((a, b) => a.jalur.localeCompare(b.jalur) || a.metode.localeCompare(b.metode));
}

const ALUR_SISTEM = [
    {
        id: 'pendaftaran',
        urutan: 1,
        judul: 'Pendaftaran & Antrean',
        ringkas: 'Pasien baru/lama didaftarkan ke poli & sesi antrean.',
        domain: 'pasien',
        tabel_utama: ['pasien', 'kunjungan', 'antrean', 'sesi_antrean'],
        endpoint_kunci: ['POST /api/pasien', 'POST /api/kunjungan', 'GET /api/antrean'],
    },
    {
        id: 'skrining',
        urutan: 2,
        judul: 'Skrining Perawat',
        ringkas: 'Pengisian Tanda Vital, Alergi, Keluhan awal, Nyeri & Gizi.',
        domain: 'klinis',
        tabel_utama: ['pemeriksaan', 'pengesahan_catatan'],
        endpoint_kunci: ['GET /api/kunjungan/:id/klinis', 'PUT /api/kunjungan/:id/klinis/:bagian'],
    },
    {
        id: 'pemeriksaan',
        urutan: 3,
        judul: 'Pemeriksaan Dokter',
        ringkas: 'SOAPIE, Pemeriksaan Fisik, KIA/Gigi/UGD, Diagnosis ICD-10, & Tindakan.',
        domain: 'klinis',
        tabel_utama: ['pemeriksaan', 'diagnosis', 'odontogram_pasien', 'kia_kunjungan', 'ugd_kunjungan'],
        endpoint_kunci: ['POST /api/kunjungan/:id/selesai', 'PUT /api/kunjungan/:id/kia', 'PUT /api/kunjungan/:id/ugd'],
    },
    {
        id: 'farmasi_lab',
        urutan: 4,
        judul: 'Farmasi & Laboratorium',
        ringkas: 'Resep obat (telaah -> serah) & order lab (spesimen -> hasil -> validasi).',
        domain: 'farmasi',
        tabel_utama: ['resep', 'item_resep', 'stok_obat', 'order_penunjang', 'hasil_penunjang'],
        endpoint_kunci: ['PUT /api/kunjungan/:id/resep', 'POST /api/kunjungan/:id/penunjang/order'],
    },
    {
        id: 'kasir_keuangan',
        urutan: 5,
        judul: 'Kasir, Klaim & Akuntansi',
        ringkas: 'Tagihan otomatis, shift kasir, klaim JKN, piutang/hutang, & jurnal double-entry.',
        domain: 'keuangan',
        tabel_utama: ['tagihan', 'pembayaran', 'klaim', 'jurnal', 'detail_jurnal', 'akun_keuangan'],
        endpoint_kunci: ['POST /api/kunjungan/:id/pembayaran', 'GET /api/keuangan/ringkasan', 'GET /api/keuangan/jurnal'],
    },
    {
        id: 'integrasi',
        urutan: 6,
        judul: 'SATUSEHAT & BPJS PCare',
        ringkas: 'Sinkronisasi FHIR (Patient, Encounter, Immunization, Observation) & Antrean JKN.',
        domain: 'integrasi',
        tabel_utama: ['kredensial_pcare', 'pemetaan_bpjs', 'log_audit'],
        endpoint_kunci: ['GET /api/satusehat/status', 'GET /api/pcare/status'],
    },
];

/** Rute API introspection arsitektur database & alur data dinamis. */
export function buatRuteArsitektur(layananAkses, layananIzin) {
    const rute = Router();
    const masuk = wajibMasuk(layananAkses);
    const { wajibIzin } = buatWajibIzin(layananIzin);

    rute.get('/arsitektur/skema', masuk, wajibIzin('akses', 'lihat'), async (req, res, next) => {
        try {
            const skema = await bacaSkemaDatabase();
            const endpoint = kumpulkanRuteExpress(req.app.router ?? req.app._router);
            res.json({
                data: {
                    diperbarui_pada: new Date().toISOString(),
                    ...skema,
                    endpoint,
                    alur: ALUR_SISTEM,
                },
            });
        } catch (e) {
            next(e);
        }
    });

    return rute;
}
