import { fileURLToPath as kliraFilePath } from 'node:url';
const __dirname = kliraFilePath(new URL('.', import.meta.url));
import { readFile } from 'node:fs/promises';
import { bacaKlinikPublik } from './modul/website-klinik/data-access/data.js';
import { htmlKlinikPublik } from './modul/website-klinik/domain/html.js';
import { buatRuteWebsitePublik, buatRuteWebsitePengaturan } from './modul/website-klinik/entry-points/rute.js';
import { buatRuteLayarPanggilan } from './modul/layar-panggilan/entry-points/rute.js';
import { GalatMeta } from './modul/instagram/domain/meta.js';
import { buatRuteInstagram } from './modul/instagram/entry-points/rute.js';
import { buatRuteInstagramPublik } from './modul/instagram/entry-points/publik.js';
import { buatRuteStatistik } from './modul/statistik/entry-points/rute.js';
import path from 'path';
import express from 'express';
import { GALAT } from '@klira/shared';
import { blokirSelamaWajibGanti } from './middleware/auth.js';
import { PenampungAuditMysql } from './middleware/audit.js';
import { buatLayananAkses } from './modul/akses/domain/layanan.js';
import { PembatasPercobaan } from './modul/akses/domain/pembatas.js';
import { RepositoriAksesMysql } from './modul/akses/data-access/repositori.js';
import { buatRuteAkses } from './modul/akses/entry-points/rute.js';
import { buatLayananIzin } from './modul/akses/domain/layanan-izin.js';
import { RepositoriIzinMysql } from './modul/akses/data-access/repositori-izin.js';
import { buatRuteIzin } from './modul/akses/entry-points/rute-izin.js';
import { bacaPengaturanKeamanan, buatLayananKeamanan } from './modul/keamanan/domain/layanan.js';
import { RepositoriKeamananMysql } from './modul/keamanan/data-access/repositori.js';
import { buatRuteKeamanan } from './modul/keamanan/entry-points/rute.js';
import { buatLayananAudit } from './modul/audit/domain/layanan.js';
import { RepositoriAuditMysql } from './modul/audit/data-access/repositori.js';
import { buatRuteAudit } from './modul/audit/entry-points/rute.js';
import { buatLayananMaster } from './modul/master/domain/layanan.js';
import { RepositoriMasterMysql } from './modul/master/data-access/repositori.js';
import { buatRuteMaster } from './modul/master/entry-points/rute.js';
import { buatLayananFasyankes } from './modul/fasyankes/domain/layanan.js';
import { RepositoriFasyankesMysql } from './modul/fasyankes/data-access/repositori.js';
import { buatRuteFasyankes } from './modul/fasyankes/entry-points/rute.js';
import { buatLayananPasien } from './modul/pasien/domain/layanan.js';
import { RepositoriPasienMysql } from './modul/pasien/data-access/repositori.js';
import { buatRutePasien } from './modul/pasien/entry-points/rute.js';
import { buatLayananKunjungan } from './modul/kunjungan/domain/layanan.js';
import { RepositoriKunjunganMysql } from './modul/kunjungan/data-access/repositori.js';
import { buatRuteKunjungan } from './modul/kunjungan/entry-points/rute.js';
import { buatLayananPengesahan } from './modul/rekam-medis/domain/layanan.js';
import { RepositoriPengesahanMysql } from './modul/rekam-medis/data-access/repositori.js';
import { buatRutePengesahan } from './modul/rekam-medis/entry-points/rute.js';
import { buatLayananKlinis } from './modul/klinis/domain/layanan.js';
import { buatLayananRm } from './modul/rekam-medis/domain/layanan-rm.js';
import { RepositoriRmMysql } from './modul/rekam-medis/data-access/repositori-rm.js';
import { buatRuteRm } from './modul/rekam-medis/entry-points/rute-rm.js';
import { buatLayananDokumen } from './modul/rekam-medis/domain/layanan-dokumen.js';
import { RepositoriDokumenMysql } from './modul/rekam-medis/data-access/repositori-dokumen.js';
import { buatRuteDokumen } from './modul/rekam-medis/entry-points/rute-dokumen.js';
import { buatLayananPdp } from './modul/pdp/domain/layanan.js';
import { RepositoriPdpMysql } from './modul/pdp/data-access/repositori.js';
import { buatRutePdp } from './modul/pdp/entry-points/rute.js';
import { buatLayananKlaim } from './modul/klaim/domain/layanan.js';
import { RepositoriKlaimMysql } from './modul/klaim/data-access/repositori.js';
import { buatRuteKlaim } from './modul/klaim/entry-points/rute.js';
import { buatLayananRawatInap } from './modul/rawat-inap/domain/layanan.js';
import { RepositoriRawatInapMysql } from './modul/rawat-inap/data-access/repositori.js';
import { buatRuteRawatInap } from './modul/rawat-inap/entry-points/rute.js';
import { RepositoriKlinisMysql } from './modul/klinis/data-access/repositori.js';
import { buatRuteKlinis } from './modul/klinis/entry-points/rute.js';
import { buatLayananAddendum } from './modul/rekam-medis/domain/layanan-addendum.js';
import { RepositoriAddendumMysql } from './modul/rekam-medis/data-access/repositori-addendum.js';
import { buatRuteAddendum } from './modul/rekam-medis/entry-points/rute-addendum.js';
import { buatLayananTagihan } from './modul/kasir/domain/layanan.js';
import { RepositoriTagihanMysql } from './modul/kasir/data-access/repositori.js';
import { buatRuteKasir } from './modul/kasir/entry-points/rute.js';
import { buatLayananFarmasi } from './modul/farmasi/domain/layanan.js';
import { RepositoriFarmasiMysql } from './modul/farmasi/data-access/repositori.js';
import { buatRuteFarmasi } from './modul/farmasi/entry-points/rute.js';
import { buatLayananKasir } from './modul/kasir/domain/layanan-kasir.js';
import { RepositoriKasirMysql } from './modul/kasir/data-access/repositori-kasir.js';
import { buatRuteKasirLengkap } from './modul/kasir/entry-points/rute-kasir.js';
import { buatLayananPenunjang } from './modul/penunjang/domain/layanan.js';
import { RepositoriPenunjangMysql } from './modul/penunjang/data-access/repositori.js';
import { buatRutePenunjang } from './modul/penunjang/entry-points/rute.js';
import { buatLayananPersetujuan } from './modul/persetujuan/domain/layanan.js';
import { RepositoriPersetujuanMysql } from './modul/persetujuan/data-access/repositori.js';
import { buatRutePersetujuan } from './modul/persetujuan/entry-points/rute.js';
import { buatLayananPengguna } from './modul/pengguna/domain/layanan.js';
import { RepositoriPenggunaMysql } from './modul/pengguna/data-access/repositori.js';
import { buatLayananPembuatanAkun } from './modul/pengguna/domain/pembuatan.js';
import { RepositoriAkunBaruMysql } from './modul/pengguna/data-access/repositori-baru.js';
import { buatRutePengguna } from './modul/pengguna/entry-points/rute.js';
import { buatRuteWhatsapp } from './modul/whatsapp/entry-points/rute.js';
const direktoriWebNative = path.resolve(__dirname, '../../web');
const direktoriWebBawaan = direktoriWebNative;
export function buatApp(direktoriWeb = direktoriWebBawaan, opsi = {}) {
    const app = express();
    app.set('trust proxy', true);
    app.use('/api/instagram', express.json({ limit: '12mb' }));
    app.use('/api/whatsapp', express.json({ limit: '12mb' }));
    const repoKeamanan = new RepositoriKeamananMysql();
    const layananAkses = opsi.layananAkses ??
        buatLayananAkses({
            repo: new RepositoriAksesMysql(),
            audit: new PenampungAuditMysql(),
            pembatas: new PembatasPercobaan(),
            bacaPengaturan: (fasyankesId) => bacaPengaturanKeamanan(repoKeamanan, fasyankesId),
        });
    app.locals.layananAkses = layananAkses;
    app.use(buatRuteInstagramPublik(layananAkses));
    app.use(express.json({ limit: '100kb' }));
    const layananIzin = opsi.layananIzin ?? buatLayananIzin({ repo: new RepositoriIzinMysql(), audit: new PenampungAuditMysql() });
    app.get('/api/kesehatan', (_req, res) => {
        res.json({ status: 'ok' });
    });
    app.use('/api', buatRuteAkses(layananAkses, opsi.baseUrl ?? process.env.BASE_URL ?? 'http://localhost'));
    app.use('/api', buatRuteLayarPanggilan());
    app.use('/api', buatRuteWebsitePublik());
    // Semua rute di bawah ini ditolak selama akun wajib ganti kredensial.
    app.use('/api', blokirSelamaWajibGanti(layananAkses));
    app.use('/api', buatRuteWebsitePengaturan(layananAkses, layananIzin));
    app.use('/api', buatRuteStatistik(layananAkses, layananIzin));
    app.use('/api', buatRuteWhatsapp(layananAkses, layananIzin));
    app.use('/api', buatRuteInstagram(layananAkses, layananIzin));
    app.use('/api', buatRuteIzin(layananAkses, layananIzin));
    app.use('/api', buatRuteKeamanan(layananAkses, layananIzin, buatLayananKeamanan({ repo: repoKeamanan, audit: new PenampungAuditMysql() })));
    app.use('/api', buatRuteMaster(layananAkses, layananIzin, buatLayananMaster({ repo: new RepositoriMasterMysql(), audit: new PenampungAuditMysql() })));
    app.use('/api', buatRuteFasyankes(layananAkses, layananIzin, buatLayananFasyankes({ repo: new RepositoriFasyankesMysql(), audit: new PenampungAuditMysql() })));
    app.use('/api', buatRutePasien(layananAkses, layananIzin, buatLayananPasien({ repo: new RepositoriPasienMysql(), audit: new PenampungAuditMysql() })));
    const layananKunjungan = buatLayananKunjungan({ repo: new RepositoriKunjunganMysql(), audit: new PenampungAuditMysql() });
    app.use('/api', buatRuteKunjungan(layananAkses, layananIzin, layananKunjungan));
    // Pengesahan catatan generik (dipakai ulang CPPT, resume, hasil lab nanti) dan modul klinis yang mendaftarkan penyedia isinya.
    const layananPengesahan = buatLayananPengesahan({ repo: new RepositoriPengesahanMysql(), audit: new PenampungAuditMysql() });
    const repoKlinis = new RepositoriKlinisMysql();
    const layananKlinis = buatLayananKlinis({ repo: repoKlinis, audit: new PenampungAuditMysql(), pengesahan: layananPengesahan, kunjungan: layananKunjungan });
    app.use('/api', buatRuteKlinis(layananAkses, layananIzin, layananKlinis));
    const repoRm = new RepositoriRmMysql();
    app.use('/api', buatRuteRm(layananAkses, layananIzin, buatLayananRm({
        repo: repoRm, pengesahanRepo: new RepositoriPengesahanMysql(), klinis: layananKlinis, baca: repoKlinis, audit: new PenampungAuditMysql(),
    })));
    const repoDokumen = new RepositoriDokumenMysql();
    const layananDokumen = buatLayananDokumen({ repo: repoDokumen, repoRm, pengesahan: layananPengesahan, baca: repoKlinis, audit: new PenampungAuditMysql() });
    app.use('/api', buatRuteDokumen(layananAkses, layananIzin, layananDokumen));
    app.use('/api', buatRutePdp(layananAkses, layananIzin, buatLayananPdp({ repo: new RepositoriPdpMysql(), audit: new PenampungAuditMysql() })));
    app.use('/api', buatRuteKlaim(layananAkses, layananIzin, buatLayananKlaim({
        repo: new RepositoriKlaimMysql(), rm: { resumeAda: (fas, ids) => repoDokumen.resumeAda(fas, ids) }, baca: repoKlinis, audit: new PenampungAuditMysql(),
    })));
    app.use('/api', buatRuteRawatInap(layananAkses, layananIzin, buatLayananRawatInap({
        repo: new RepositoriRawatInapMysql(), pengesahan: layananPengesahan, audit: new PenampungAuditMysql(), simpanResume: layananDokumen.simpanResume,
    })));
    // Addendum generik, penunjang (order, spesimen, hasil), persetujuan tindakan, dan tagihan dasar.
    const layananAddendum = buatLayananAddendum({ repo: new RepositoriAddendumMysql(), audit: new PenampungAuditMysql(), pengesahan: layananPengesahan });
    app.use('/api', buatRuteAddendum(layananAkses, layananIzin, layananAddendum));
    app.use('/api', buatRutePenunjang(layananAkses, layananIzin, buatLayananPenunjang({
        repo: new RepositoriPenunjangMysql(), audit: new PenampungAuditMysql(), pengesahan: layananPengesahan, addendum: layananAddendum,
    })));
    app.use('/api', buatRutePersetujuan(layananAkses, layananIzin, buatLayananPersetujuan({
        repo: new RepositoriPersetujuanMysql(), audit: new PenampungAuditMysql(),
        tindakanKunjungan: async (fas, id) => ((await repoKlinis.bacaBagian(fas, id, 'tindakan'))?.item ?? []).map((t) => ({ kode: t.kode, nama: t.nama })),
    })));
    app.use('/api', buatRuteFarmasi(layananAkses, layananIzin, buatLayananFarmasi({ repo: new RepositoriFarmasiMysql(), audit: new PenampungAuditMysql() })));
    const repoFarmasi = new RepositoriFarmasiMysql();
    app.use('/api', buatRuteKasirLengkap(layananAkses, layananIzin, buatLayananKasir({ repo: new RepositoriKasirMysql(), farmasi: repoFarmasi, audit: new PenampungAuditMysql() })));
    app.use('/api', buatRuteKasir(layananAkses, layananIzin, buatLayananTagihan({ repo: new RepositoriTagihanMysql(), audit: new PenampungAuditMysql() })));
    app.use('/api', buatRutePengesahan(layananAkses, layananIzin, layananPengesahan));
    app.use('/api', buatRuteAudit(layananAkses, layananIzin, buatLayananAudit({ repo: new RepositoriAuditMysql(), audit: new PenampungAuditMysql() })));
    app.use('/api', buatRutePengguna(layananAkses, layananIzin, buatLayananPengguna({ repo: new RepositoriPenggunaMysql(), audit: new PenampungAuditMysql() }), buatLayananPembuatanAkun({ repo: new RepositoriAkunBaruMysql(), repoIzin: new RepositoriIzinMysql(), audit: new PenampungAuditMysql() })));
    app.use('/api', (_req, res) => {
        res.status(404).json({ galat: 'Rute tidak ditemukan' });
    });
    const penangananGalat = (galat, _req, res, next) => {
        if (res.headersSent)
            return next(galat);
        if (galat instanceof GalatMeta) {
            res.status(galat.status).json({ galat: { kode: 'instagram_meta', pesan: galat.message } });
            return;
        }
        console.error(galat);
        const badan = { galat: { kode: 'galat_server', pesan: GALAT.umum } };
        res.status(galat?.type === 'entity.parse.failed' ? 400 : 500).json(badan);
    };
    // Source ESM uses stable URLs; never retain mixed versions across deployments.
    const modulBrowser = (direktori) => [
        (_req, res, next) => {
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('CDN-Cache-Control', 'no-store');
            res.setHeader('Cloudflare-CDN-Cache-Control', 'no-store');
            next();
        },
        express.static(direktori, { cacheControl: false, index: false }),
        (_req, res) => res.status(404).type('text').send('Modul browser tidak ditemukan.'),
    ];
    app.use('/src', ...modulBrowser(path.join(direktoriWeb, 'src')));
    app.use('/modul/shared', ...modulBrowser(path.resolve(__dirname, '../../../packages/shared/src')));
    app.use('/modul/zod', ...modulBrowser(path.resolve(__dirname, '../../../node_modules/zod')));
    app.use(express.static(path.join(direktoriWebNative, 'public')));
    app.get(['/', '/klinik/:slug'], async (req, res, next) => {
        try {
            const slug = typeof req.params.slug === 'string' ? req.params.slug : undefined;
            const ruteNative = !slug || /^[a-z0-9-]+$/.test(slug);
            const data = slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? null : await bacaKlinikPublik(req.hostname, slug);
            const html = await readFile(path.join(direktoriWeb, 'index.html'), 'utf8');
            res.setHeader('Cache-Control', 'no-store');
            res.status(data ? 200 : 404).type('html').send(htmlKlinikPublik(html, data));
        } catch (e) { next(e); }
    });
    app.get(['/masuk', '/ganti-kredensial'], (req, res, next) => {
        if (req.path.endsWith('/')) { res.redirect(308, req.path.slice(0, -1) + req.url.slice(req.path.length)); return; }
        res.sendFile(path.join(direktoriWebNative, 'index.html'), galat => { if (galat) next(galat); });
    });
    app.get(/^\/layar-panggilan(?:\/|$)/, (_req, res, next) => {
        res.sendFile(path.join(direktoriWebNative, 'index.html'), galat => { if (galat) next(galat); });
    });
    app.use(express.static(direktoriWeb));
    app.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD')
            return next();
        res.sendFile(path.join(direktoriWeb, 'index.html'), (galat) => {
            if (galat)
                next();
        });
    });
    app.use(penangananGalat);
    return app;
}
