import * as db from '@klira/db';
import { Router } from 'express';
import { ANTREAN_LAB, kodeAntrean, tanggalWib } from '@klira/shared';
import { namaPanggil } from '../../kunjungan/data-access/ruang-panggil.js';
export function buatRuteLayarPanggilan() {
    const rute = Router();
    rute.get('/publik/layar-panggilan/:id', async (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        const id = Number(req.params.id);
        if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id < 1) {
            res.status(400).json({ galat: { pesan: 'Alamat fasilitas tidak valid.' } });
            return;
        }
        const setelah = req.query.setelah === undefined ? undefined : Number(req.query.setelah);
        if (setelah !== undefined && (typeof req.query.setelah !== 'string' || !/^\d+$/.test(req.query.setelah) || !Number.isSafeInteger(setelah) || setelah < 0)) {
            res.status(400).json({ galat: { pesan: 'Kursor panggilan tidak valid.' } });
            return;
        }
        try {
            const data = await db.transaksi(async (tx) => {
                const fasilitas = await db.ambilFasyankesUntukBuatRuteLayarPanggilan(id, tx);
                if (!fasilitas)
                    return null;
                const tanggal = tanggalWib(new Date());
                const sesi = await db.ambilSesiAntreanAktif(tx);
                const poliAktif = (await db.daftarPoli(tx)).filter(p => p.status_operasional === 'O');
                const ruangAktif = await db.daftarRuangPeriksaOperasional(tx);
                // Tempat panggilan = ruang periksa aktif; poli tanpa ruang periksa tampil sebagai satu tempat.
                const poliOperasional = poliAktif.flatMap(p => {
                    const ruang = ruangAktif.filter(r => r.induk_id === p.id);
                    return ruang.length ? ruang.map(r => ({ id: r.id, nama: namaPanggil(p, r), jenis_poli: p.nama })) : [{ id: p.id, nama: namaPanggil(p, null), jenis_poli: p.nama }];
                });
                const antrean = sesi ? await db.daftarAntreanUntukBuatRuteLayarPanggilan(sesi.id, poliAktif.map(p => p.id), ['menunggu', 'dipanggil', 'dilayani'], tx) : [];
                const tempatDari = a => a.ruang_id ?? a.lokasi_id;
                // Penunjang saja (tes lab tanpa poli) tampil sebagai pelayanan "Laboratorium" bila ada antreannya di sesi ini.
                const adaLab = antrean.some(a => a.jenis_poli === ANTREAN_LAB.jenis_poli);
                const poli = adaLab ? [...poliOperasional, { id: 0, nama: ANTREAN_LAB.jenis_poli, jenis_poli: ANTREAN_LAB.jenis_poli }] : poliOperasional;
                const event = !sesi || setelah === undefined ? [] : await db.daftarEventPanggilanUntukBuatRuteLayarPanggilan(sesi.id, setelah, 101, tx);
                const terbaru = !sesi || setelah !== undefined ? null : await db.cariEventPanggilanUntukBuatRuteLayarPanggilan(sesi.id, tx);
                const halamanEvent = event.slice(0, 100);
                const terakhir = antrean.find(a => a.status === 'dipanggil' && a.waktu_panggil);
                const data = {
                    fasyankes_nama: fasilitas.nama, fasyankes_logo_url: fasilitas.website_klinik?.logo_url || null, tanggal,
                    sesi_status: sesi ? 'buka' : 'tutup',
                    kursor: halamanEvent.at(-1)?.id ?? setelah ?? terbaru?.id ?? 0,
                    ada_lanjutan: event.length > 100,
                    event_panggilan: halamanEvent.map(e => ({ event_id: e.id, kode: e.kode, poli_id: e.poli_id, poli_nama: e.poli_nama, waktu_panggil: e.waktu_panggil.toISOString() })),
                    panggilan: terakhir ? { kode: kodeAntrean(terakhir.nomor, terakhir.awalan), waktu_panggil: terakhir.waktu_panggil.toISOString(), poli_id: tempatDari(terakhir), poli_nama: poli.find(p => p.id === tempatDari(terakhir))?.nama ?? terakhir.jenis_poli } : null,
                    panggilan_aktif: antrean.filter(a => a.status === 'dipanggil' && a.waktu_panggil).map(a => ({
                        kode: kodeAntrean(a.nomor, a.awalan), waktu_panggil: a.waktu_panggil.toISOString(), poli_id: tempatDari(a), poli_nama: poli.find(p => p.id === tempatDari(a))?.nama ?? a.jenis_poli,
                    })),
                    poli: poli.map(p => {
                        const baris = antrean.filter(a => (p.id === 0 ? a.jenis_poli === ANTREAN_LAB.jenis_poli : tempatDari(a) === p.id));
                        const aktif = baris.find(a => a.status === 'dipanggil') ?? baris.find(a => a.status === 'dilayani');
                        return { ...p, sekarang: aktif ? { kode: kodeAntrean(aktif.nomor, aktif.awalan), status: aktif.status } : null };
                    }),
                    // Antrean menunggu dibagi per poli: satu nomor berikutnya untuk semua ruang periksa poli itu.
                    jenis: [...new Set(poli.map(p => p.jenis_poli.toLowerCase()))].map(kunci => {
                        const nama = poli.find(p => p.jenis_poli.toLowerCase() === kunci).jenis_poli;
                        // Pasien yang masih di skrining belum dapat dipanggil dokter, jadi belum masuk daftar berikutnya.
                        const tunggu = antrean.filter(a => a.status === 'menunggu' && a.tahap_layanan !== 'menunggu_skrining' && a.jenis_poli.toLowerCase() === kunci).sort((a, b) => a.nomor - b.nomor);
                        return { nama, berikutnya: tunggu[0] ? kodeAntrean(tunggu[0].nomor, tunggu[0].awalan) : null, menunggu: tunggu.length };
                    }).sort((a, b) => a.nama.localeCompare(b.nama, 'id')),
                };
                return data;
            });
            if (data)
                res.json({ data });
            else
                res.status(404).json({ galat: { pesan: 'Fasilitas tidak ditemukan.' } });
        }
        catch (e) {
            next(e);
        }
    });
    return rute;
}
