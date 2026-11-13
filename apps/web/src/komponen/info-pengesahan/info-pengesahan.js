import { KLINIS, STATUS_PENGESAHAN } from '@klira/shared';
import { token } from '../../gaya/token.js';
/** Keadaan pengesahan satu bagian catatan: lencana status, pengesah, jenis akun, dan versi (dipakai ulang CPPT dan resume nanti). */
export function InfoPengesahan({ bagian }) {
    if (!bagian?.pengesahan)
        return null;
    const p = bagian.pengesahan;
    return jarak = "sm";
    bungkus;
    style = {};
    {
        fontSize: token.huruf.ukuran.kecil, color;
        token.warna.teksRedup;
    }
}
 >
    warna;
{
    STATUS_PENGESAHAN.warna(bagian.verifikasi);
}
 > { STATUS_PENGESAHAN, : .label(bagian.verifikasi) } < /Lencana>
    < span > { KLINIS, : .status.disahkanOleh(p.pengguna_nama, p.jenis_akun) } < /span>
    < span > { KLINIS, : .status.versi(p.versi) } < /span>
    < /Sebaris>;
;
