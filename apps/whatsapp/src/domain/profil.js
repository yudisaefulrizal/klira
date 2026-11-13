import * as db from '@klira/db';
export function fotoProfilWhatsapp(value) {
    if (typeof value !== 'string' || value.length > 8000)
        return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && /(^|\.)(whatsapp\.net|whatsapp\.com|fbcdn\.net)$/.test(url.hostname) ? url.href : null;
    }
    catch {
        return null;
    }
}
export function buatPembaruanFotoWhatsapp(akses = db) {
    let sibuk = false;
    return async (koneksi) => {
        if (sibuk || !koneksi.masihAktif())
            return;
        sibuk = true;
        try {
            const kontak = await akses.cariWaPercakapanUntukBuatPembaruanFotoWhatsapp(koneksi.fasyankes, '@s.whatsapp.net', '@lid', null, new Date());
            if (!kontak || !koneksi.masihAktif())
                return;
            let foto = null;
            let gagal = false;
            try {
                foto = fotoProfilWhatsapp(await koneksi.ambil(kontak.jid));
            }
            catch (error) {
                const kode = error?.output?.statusCode;
                // Missing/private pictures are normal; transient errors preserve the previous photo.
                gagal = kode !== 403 && kode !== 404;
            }
            if (!koneksi.masihAktif())
                return;
            const berubah = await akses.transaksi(async (tx) => {
                await akses.kunciWaKoneksi(tx);
                const current = await akses.ambilWaKoneksi(1, tx);
                if (!koneksi.masihAktif() || !current?.aktif || current.status !== 'terhubung' || current.generasi !== koneksi.generasi || current.fasyankes_id !== koneksi.fasyankes || current.pemilik_engine !== koneksi.pemilik || !current.sewa_sampai || current.sewa_sampai.getTime() <= Date.now())
                    return false;
                const hasil = await akses.ubahWaPercakapanUntukBuatPembaruanFotoWhatsapp((!gagal) ? (foto) : (undefined), new Date(Date.now() + (gagal ? 15 * 60000 : 24 * 60 * 60000)), kontak.id, koneksi.fasyankes, kontak.jid, tx);
                return hasil.count > 0 && !gagal && foto !== kontak.foto_profil;
            });
            if (berubah)
                koneksi.kabarkan();
        }
        catch { /* A profile failure must not stop the engine. */ }
        finally {
            sibuk = false;
        }
    };
}
