import { prisma } from '@klira/db';

export function fotoProfilWhatsapp(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 8000) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && /(^|\.)(whatsapp\.net|whatsapp\.com|fbcdn\.net)$/.test(url.hostname) ? url.href : null;
  } catch { return null; }
}
type KoneksiProfil = {
  fasyankes: number;
  generasi: number;
  pemilik: string;
  masihAktif: () => boolean;
  ambil: (jid: string) => Promise<string | undefined>;
  kabarkan: () => void;
};
/** One background request at a time; message delivery never waits for a profile. */
export function buatPembaruanFotoWhatsapp(db = prisma) {
  let sibuk = false;
  return async (koneksi: KoneksiProfil) => {
    if (sibuk || !koneksi.masihAktif()) return;
    sibuk = true;
    try {
      const kontak = await db.waPercakapan.findFirst({
        where: { fasyankes_id: koneksi.fasyankes, AND: [
          { OR: [{ jid: { endsWith: '@s.whatsapp.net' } }, { jid: { endsWith: '@lid' } }] },
          { OR: [{ foto_periksa_setelah: null }, { foto_periksa_setelah: { lte: new Date() } }] },
        ] },
        orderBy: [{ foto_periksa_setelah: 'asc' }, { id: 'desc' }],
      });
      if (!kontak || !koneksi.masihAktif()) return;
      let foto: string | null = null;
      let gagal = false;
      try { foto = fotoProfilWhatsapp(await koneksi.ambil(kontak.jid)); }
      catch (error) {
        const kode = (error as { output?: { statusCode?: number } } | null)?.output?.statusCode;
        // Missing/private pictures are normal; transient errors preserve the previous photo.
        gagal = kode !== 403 && kode !== 404;
      }
      if (!koneksi.masihAktif()) return;
      const berubah = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM wa_koneksi WHERE id = 1 FOR UPDATE`;
        const current = await tx.waKoneksi.findUnique({ where: { id: 1 } });
        if (!koneksi.masihAktif() || !current?.aktif || current.status !== 'terhubung' || current.generasi !== koneksi.generasi || current.fasyankes_id !== koneksi.fasyankes || current.pemilik_engine !== koneksi.pemilik || !current.sewa_sampai || current.sewa_sampai.getTime() <= Date.now()) return false;
        const hasil = await tx.waPercakapan.updateMany({
          where: { id: kontak.id, fasyankes_id: koneksi.fasyankes, jid: kontak.jid },
          data: { ...(!gagal ? { foto_profil: foto } : {}), foto_periksa_setelah: new Date(Date.now() + (gagal ? 15 * 60000 : 24 * 60 * 60000)) },
        });
        return hasil.count > 0 && !gagal && foto !== kontak.foto_profil;
      });
      if (berubah) koneksi.kabarkan();
    } catch { /* A profile failure must not stop the engine. */ }
    finally { sibuk = false; }
  };
}
