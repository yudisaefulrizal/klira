import { Router } from 'express';
import { prisma, Prisma } from '@klira/db';
import { websiteKlinikMasukan } from '@klira/shared';
import type { PenggunaSaya } from '@klira/shared';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { wajibMasuk } from '../../middleware/auth';
import { buatWajibIzin } from '../../middleware/izin';
import { alamatDari, PenampungAuditPrisma } from '../../middleware/audit';
import { galatValidasi } from '../hasil';
import { bacaKlinikPublik, pengaturanWebsite } from './data';

export function buatRuteWebsitePublik() {
  const r = Router();
  r.get(['/publik/klinik', '/publik/klinik/:slug'], async (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const slug = typeof req.params.slug === 'string' ? req.params.slug : undefined;
    if (req.params.slug !== undefined && (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) return void res.status(404).json({ galat: { pesan: 'Halaman klinik tidak ditemukan.' } });
    try {
      const data = await bacaKlinikPublik(req.hostname, slug);
      if (!data) return void res.status(404).json({ galat: { pesan: 'Halaman klinik belum tersedia.' } });
      res.json({ data });
    } catch (e) { next(e); }
  });
  return r;
}
export function buatRuteWebsitePengaturan(akses: LayananAkses, izin: LayananIzin) {
  const r = Router(); const masuk = wajibMasuk(akses); const { wajibIzin } = buatWajibIzin(izin);
  r.get('/fasyankes/website', masuk, wajibIzin('profil-klinik', 'lihat'), async (_req, res, next) => {
    try {
      const data = await pengaturanWebsite((res.locals.pengguna as PenggunaSaya).fasyankes_id);
      if (!data) return void res.status(404).json({ galat: { pesan: 'Profil klinik tidak ditemukan.' } });
      res.setHeader('Cache-Control', 'no-store'); res.json({ data });
    } catch (e) { next(e); }
  });
  r.put('/fasyankes/website', masuk, wajibIzin('profil-klinik', 'perbaikan'), async (req, res, next) => {
    const nilai = websiteKlinikMasukan.safeParse(req.body);
    if (!nilai.success) return galatValidasi(res, nilai.error);
    const p = res.locals.pengguna as PenggunaSaya;
    try {
      const data = { ...nilai.data, domain: nilai.data.domain || null };
      await prisma.$transaction(async tx => {
        await tx.websiteKlinik.upsert({ where: { fasyankes_id: p.fasyankes_id }, create: { ...data, fasyankes_id: p.fasyankes_id }, update: data });
        await tx.riwayatProfil.create({ data: { fasyankes_id: p.fasyankes_id, jenis: 'profil', ringkasan: 'Pengaturan website publik diperbarui.', dibuat_oleh: p.id } });
      });
      await new PenampungAuditPrisma().catat({ fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'website_klinik', keterangan: 'Pengaturan website publik diperbarui.', alamat: alamatDari(req) });
      res.json({ data: await pengaturanWebsite(p.fasyankes_id) });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return void res.status(409).json({ galat: { pesan: 'Alamat halaman atau domain sudah digunakan klinik lain.' } });
      next(e);
    }
  });
  return r;
}
