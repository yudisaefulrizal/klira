import * as db from '@klira/db';
import type { RequestHandler, Router } from 'express';
import type { PenggunaSaya } from '@klira/shared';
import { alamatDari, PenampungAuditMysql } from '../../../middleware/audit';
import { RepositoriAuditMysql } from '../../audit/data-access/repositori';
import { kabarkanWhatsapp } from '../../whatsapp/domain/kanal';
import { kabarkanInstagram } from '../../instagram/domain/kanal';

type Kanal = 'whatsapp' | 'instagram';
export class PengirimanBerjalan extends Error {}

/** Penghapusan lokal dan audit mengikuti transaksi pemanggil. */
async function bersihkanDalam(tx: db.Koneksi, kanal: Kanal, user: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, alamat: string, saatKeluar = false) {
  const fas = user.fasyankes_id;


    let percakapan: number;
    let pesan: number;
    if (kanal === 'whatsapp') {
      await db.kunciWaPercakapanFasyankes(fas, tx);
      if (!saatKeluar && await db.hitungWaPesanUntukBersihkanDalam(fas, ['antre', 'mengirim'], tx)) throw new PengirimanBerjalan();
      await db.hapusWaBacaUntukBersihkanDalam(fas, tx);
      pesan = (await db.hapusWaPesanUntukBersihkanDalam(fas, tx)).count;
      percakapan = (await db.hapusWaPercakapanUntukBersihkanDalam(fas, tx)).count;
      await db.hapusWaMediaUntukBersihkanDalam(fas, tx);
    } else {
      await db.kunciIgPercakapanFasyankes(fas, tx);
      if (!saatKeluar && await db.hitungIgPesanUntukBersihkanDalam(fas, ['antre', 'mengirim'], tx)) throw new PengirimanBerjalan();
      await db.hapusIgBacaUntukBersihkanDalam(fas, tx);
      pesan = (await db.hapusIgPesanUntukBersihkanDalam(fas, tx)).count;
      percakapan = (await db.hapusIgPercakapanUntukBersihkanDalam(fas, tx)).count;
      // Token publik kanal lain dan fasyankes lain tetap berlaku.
      const media = await db.daftarIgMediaUntukBersihkanDalam(fas, tx);
      if (media.length) await db.hapusIgMediaPublikUntukBersihkanDalam(media.map((m) => m.id), tx);
      await db.hapusIgMediaUntukBersihkanDalam(fas, tx);
    }
    await new PenampungAuditMysql(new RepositoriAuditMysql(tx)).catat({
      fasyankes_id: fas, pengguna_id: user.id, aksi: 'perbaikan', entitas: `${kanal}_percakapan`,
      keterangan: `Membersihkan ${percakapan} percakapan dan ${pesan} pesan lokal ${kanal}`, alamat,
    });
    return { percakapan, pesan };
}

/** Clean manual mempertahankan koneksi dan menunggu pengiriman selesai. */
export async function bersihkanPercakapan(kanal: Kanal, user: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, alamat: string) {
  return db.transaksi((tx) => bersihkanDalam(tx, kanal, user, alamat));
}

/** Putuskan sesi sebelum menghapus pesan agar pesan sesi lama tidak disimpan kembali. */
export async function putuskanDanBersihkan(kanal: Kanal, user: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, alamat: string) {
  return db.transaksi(async (tx) => {
    if (kanal === 'whatsapp') {
      await db.kunciWaKoneksi(tx);
      const row = await db.ambilWaKoneksi(1, tx);
      if (row && row.fasyankes_id !== user.fasyankes_id) throw new Error('WhatsApp dikelola fasyankes lain.');
      if (row) {
        await db.ubahWaKoneksiUntukPutuskanDanBersihkan(false, 1, 'terputus', null, user.fasyankes_id, tx);
        await db.hapusWaAuthUntukPutuskanDanBersihkan(tx);
      }
    } else {
      await db.kunciIgKoneksi(tx);
      const row = await db.ambilIgKoneksi(1, tx);
      if (row && row.fasyankes_id !== user.fasyankes_id) throw new Error('Instagram dikelola fasyankes lain.');
      if (row) await db.ubahIgKoneksiUntukPutuskanDanBersihkan(false, 'terputus', '', null, null, 1, user.fasyankes_id, tx);
      await db.hapusIgOauthStateUntukPutuskanDanBersihkan(user.fasyankes_id, tx);
    }
    return bersihkanDalam(tx, kanal, user, alamat, true);
  });
}

export function pasangRuteBersihkan(rute: Router, kanal: Kanal, izin: RequestHandler) {
  rute.delete(`/${kanal}/percakapan`, izin, async (req, res, next) => {
    if (req.body?.konfirmasi !== kanal) return void res.status(400).json({ galat: { kode: 'konfirmasi', pesan: 'Konfirmasi pembersihan pesan diperlukan.' } });
    const user = res.locals.pengguna as PenggunaSaya;
    try {
      const hasil = await bersihkanPercakapan(kanal, user, alamatDari(req));
      const kabarkan = kanal === 'whatsapp' ? kabarkanWhatsapp : kabarkanInstagram;
      kabarkan({ tipe: 'dibersihkan', fasyankes_id: user.fasyankes_id });
      res.json({ data: hasil });
    } catch (e) {
      if (e instanceof PengirimanBerjalan) return void res.status(409).json({ galat: { kode: 'pesan_mengirim', pesan: 'Masih ada pesan dalam antrean pengiriman. Tunggu hingga pengiriman selesai, lalu coba lagi.' } });
      next(e);
    }
  });
}
