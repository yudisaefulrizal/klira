import * as db from '@klira/db';
import { Router } from 'express';
import { kodeAntrean, tanggalWib } from '@klira/shared';
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
                const poliSemua = await db.daftarPoliUntukJenis(id, tx);
                const poli = poliSemua.filter(p => p.status_operasional === 'O').map(p => ({ id: p.id, nama: p.nama, jenis_poli: p.jenis_poli ?? '' }));
                const antrean = await db.daftarAntreanUntukBuatRuteLayarPanggilan(id, new Date(`${tanggal}T00:00:00Z`), poli.map(p => p.id), ['menunggu', 'dipanggil', 'dilayani'], tx);
                const event = setelah === undefined ? [] : await db.daftarEventPanggilanUntukBuatRuteLayarPanggilan(id, new Date(`${tanggal}T00:00:00Z`), setelah, 101, tx);
                const terbaru = setelah === undefined ? await db.cariEventPanggilanUntukBuatRuteLayarPanggilan(id, new Date(`${tanggal}T00:00:00Z`), tx) : null;
                const halamanEvent = event.slice(0, 100);
                const terakhir = antrean.find(a => a.status === 'dipanggil' && a.waktu_panggil);
                const data = {
                    fasyankes_nama: fasilitas.nama, fasyankes_logo_url: fasilitas.website_klinik?.logo_url || null, tanggal,
                    kursor: halamanEvent.at(-1)?.id ?? setelah ?? terbaru?.id ?? 0,
                    ada_lanjutan: event.length > 100,
                    event_panggilan: halamanEvent.map(e => ({ event_id: e.id, kode: e.kode, poli_id: e.poli_id, poli_nama: e.poli_nama, waktu_panggil: e.waktu_panggil.toISOString() })),
                    panggilan: terakhir ? { kode: kodeAntrean(terakhir.nomor, terakhir.awalan), waktu_panggil: terakhir.waktu_panggil.toISOString(), poli_id: terakhir.lokasi_id, poli_nama: poli.find(p => p.id === terakhir.lokasi_id).nama } : null,
                    panggilan_aktif: antrean.filter(a => a.status === 'dipanggil' && a.waktu_panggil).map(a => ({
                        kode: kodeAntrean(a.nomor, a.awalan), waktu_panggil: a.waktu_panggil.toISOString(), poli_id: a.lokasi_id, poli_nama: poli.find(p => p.id === a.lokasi_id)?.nama ?? '',
                    })),
                    poli: poli.map(p => {
                        const baris = antrean.filter(a => a.lokasi_id === p.id);
                        const aktif = baris.find(a => a.status === 'dipanggil') ?? baris.find(a => a.status === 'dilayani');
                        return { ...p, sekarang: aktif ? { kode: kodeAntrean(aktif.nomor, aktif.awalan), status: aktif.status } : null };
                    }),
                    // Antrean menunggu dibagi per jenis poli: satu nomor berikutnya untuk semua poli sejenis.
                    jenis: [...new Set(poli.map(p => p.jenis_poli.toLowerCase()))].map(kunci => {
                        const nama = poli.find(p => p.jenis_poli.toLowerCase() === kunci).jenis_poli;
                        const tunggu = antrean.filter(a => a.status === 'menunggu' && a.jenis_poli.toLowerCase() === kunci).sort((a, b) => a.nomor - b.nomor);
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
