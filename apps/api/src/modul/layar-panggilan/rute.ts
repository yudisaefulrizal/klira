import { Router } from 'express';
import { prisma } from '@klira/db';
import { kodeAntrean, tanggalWib } from '@klira/shared';
import type { LayarPanggilanDto } from '@klira/shared';

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
      const data = await prisma.$transaction(async tx => {
        const fasilitas = await tx.fasyankes.findUnique({ where: { id }, select: { nama: true, website_klinik: { select: { logo_url: true } } } });
        if (!fasilitas) return null;
        const tanggal = tanggalWib(new Date());
        const poli = await tx.lokasi.findMany({ where: { fasyankes_id: id, jenis: 'poli', status_operasional: 'O' }, select: { id: true, nama: true }, orderBy: { nama: 'asc' } });
        const antrean = await tx.antrean.findMany({
          where: { fasyankes_id: id, tanggal: new Date(`${tanggal}T00:00:00Z`), lokasi_id: { in: poli.map(p => p.id) }, status: { in: ['menunggu', 'dipanggil', 'dilayani'] } },
          select: { id: true, lokasi_id: true, nomor: true, status: true, waktu_panggil: true },
          orderBy: [{ waktu_panggil: 'desc' }, { id: 'desc' }],
        });
        const scopeEvent = { fasyankes_id: id, tanggal: new Date(`${tanggal}T00:00:00Z`) };
        const event = setelah === undefined ? [] : await tx.eventPanggilan.findMany({
          where: { ...scopeEvent, id: { gt: setelah } }, orderBy: { id: 'asc' }, take: 101,
          select: { id: true, kode: true, poli_id: true, poli_nama: true, waktu_panggil: true },
        });
        const terbaru = setelah === undefined ? await tx.eventPanggilan.findFirst({ where: scopeEvent, orderBy: { id: 'desc' }, select: { id: true } }) : null;
        const halamanEvent = event.slice(0, 100);
        const terakhir = antrean.find(a => a.status === 'dipanggil' && a.waktu_panggil);
        const data: LayarPanggilanDto = {
          fasyankes_nama: fasilitas.nama, fasyankes_logo_url: fasilitas.website_klinik?.logo_url || null, tanggal,
          kursor: halamanEvent.at(-1)?.id ?? setelah ?? terbaru?.id ?? 0,
          ada_lanjutan: event.length > 100,
          event_panggilan: halamanEvent.map(e => ({ event_id: e.id, kode: e.kode, poli_id: e.poli_id, poli_nama: e.poli_nama, waktu_panggil: e.waktu_panggil.toISOString() })),
          panggilan: terakhir ? { kode: kodeAntrean(terakhir.nomor), waktu_panggil: terakhir.waktu_panggil!.toISOString(), poli_id: terakhir.lokasi_id, poli_nama: poli.find(p => p.id === terakhir.lokasi_id)!.nama } : null,
          panggilan_aktif: antrean.filter(a => a.status === 'dipanggil' && a.waktu_panggil).map(a => ({
            kode: kodeAntrean(a.nomor), waktu_panggil: a.waktu_panggil!.toISOString(), poli_id: a.lokasi_id, poli_nama: poli.find(p => p.id === a.lokasi_id)!.nama,
          })),
          poli: poli.map(p => {
            const baris = antrean.filter(a => a.lokasi_id === p.id);
            const aktif = baris.find(a => a.status === 'dipanggil') ?? baris.find(a => a.status === 'dilayani');
            const tunggu = baris.filter(a => a.status === 'menunggu').sort((a, b) => a.nomor - b.nomor)[0];
            return { ...p, sekarang: aktif ? { kode: kodeAntrean(aktif.nomor), status: aktif.status as 'dipanggil' | 'dilayani' } : null, berikutnya: tunggu ? kodeAntrean(tunggu.nomor) : null };
          }),
        };
        return data;
      }, { isolationLevel: 'RepeatableRead' });
      if (data) res.json({ data });
      else res.status(404).json({ galat: { pesan: 'Fasilitas tidak ditemukan.' } });
    } catch (e) { next(e); }
  });
  return rute;
}
