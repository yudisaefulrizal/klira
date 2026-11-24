import * as db from '@klira/db';
import { alamatDari, PenampungAuditMysql } from '../../../middleware/audit.js';
import { RepositoriAuditMysql } from '../../audit/data-access/repositori.js';
import { kabarkanWhatsapp } from '../../whatsapp/domain/kanal.js';
import { kabarkanInstagram } from '../../instagram/domain/kanal.js';
export class PengirimanBerjalan extends Error {
}
/** Penghapusan lokal dan audit mengikuti transaksi pemanggil. */
async function bersihkanDalam(tx, kanal, user, alamat, saatKeluar = false) {
    let percakapan;
    let pesan;
    if (kanal === 'whatsapp') {
        await db.kunciWaPercakapanFasyankes(tx);
        if (!saatKeluar && await db.hitungWaPesanUntukBersihkanDalam(['antre', 'mengirim'], tx))
            throw new PengirimanBerjalan();
        await db.hapusWaBacaUntukBersihkanDalam(tx);
        pesan = (await db.hapusWaPesanUntukBersihkanDalam(tx)).count;
        percakapan = (await db.hapusWaPercakapanUntukBersihkanDalam(tx)).count;
        await db.hapusWaMediaUntukBersihkanDalam(tx);
    }
    else {
        await db.kunciIgPercakapanFasyankes(tx);
        if (!saatKeluar && await db.hitungIgPesanUntukBersihkanDalam(['antre', 'mengirim'], tx))
            throw new PengirimanBerjalan();
        await db.hapusIgBacaUntukBersihkanDalam(tx);
        pesan = (await db.hapusIgPesanUntukBersihkanDalam(tx)).count;
        percakapan = (await db.hapusIgPercakapanUntukBersihkanDalam(tx)).count;
        // Token publik kanal lain dan fasyankes lain tetap berlaku.
        const media = await db.daftarIgMediaUntukBersihkanDalam(tx);
        if (media.length)
            await db.hapusIgMediaPublikUntukBersihkanDalam(media.map((m) => m.id), tx);
        await db.hapusIgMediaUntukBersihkanDalam(tx);
    }
    await new PenampungAuditMysql(new RepositoriAuditMysql(tx)).catat({
        pengguna_id: user.id, aksi: 'perbaikan', entitas: `${kanal}_percakapan`,
        keterangan: `Membersihkan ${percakapan} percakapan dan ${pesan} pesan lokal ${kanal}`, alamat,
    });
    return { percakapan, pesan };
}
/** Clean manual mempertahankan koneksi dan menunggu pengiriman selesai. */
export async function bersihkanPercakapan(kanal, user, alamat) {
    return db.transaksi((tx) => bersihkanDalam(tx, kanal, user, alamat));
}
/** Putuskan sesi sebelum menghapus pesan agar pesan sesi lama tidak disimpan kembali. */
export async function putuskanDanBersihkan(kanal, user, alamat) {
    return db.transaksi(async (tx) => {
        if (kanal === 'whatsapp') {
            await db.kunciWaKoneksi(tx);
            const row = await db.ambilWaKoneksi(1, tx);
            if (row) {
                await db.ubahWaKoneksiUntukPutuskanDanBersihkan(false, 1, 'terputus', null, tx);
                await db.hapusWaAuthUntukPutuskanDanBersihkan(tx);
            }
        }
        else {
            await db.kunciIgKoneksi(tx);
            const row = await db.ambilIgKoneksi(1, tx);
            if (row)
                await db.ubahIgKoneksiUntukPutuskanDanBersihkan(false, 'terputus', '', null, null, 1, tx);
            await db.hapusIgOauthStateUntukPutuskanDanBersihkan(tx);
        }
        return bersihkanDalam(tx, kanal, user, alamat, true);
    });
}
export function pasangRuteBersihkan(rute, kanal, izin) {
    rute.delete(`/${kanal}/percakapan`, izin, async (req, res, next) => {
        if (req.body?.konfirmasi !== kanal)
            return void res.status(400).json({ galat: { kode: 'konfirmasi', pesan: 'Konfirmasi pembersihan pesan diperlukan.' } });
        const user = res.locals.pengguna;
        try {
            const hasil = await bersihkanPercakapan(kanal, user, alamatDari(req));
            const kabarkan = kanal === 'whatsapp' ? kabarkanWhatsapp : kabarkanInstagram;
            kabarkan({ tipe: 'dibersihkan' });
            res.json({ data: hasil });
        }
        catch (e) {
            if (e instanceof PengirimanBerjalan)
                return void res.status(409).json({ galat: { kode: 'pesan_mengirim', pesan: 'Masih ada pesan dalam antrean pengiriman. Tunggu hingga pengiriman selesai, lalu coba lagi.' } });
            next(e);
        }
    });
}
