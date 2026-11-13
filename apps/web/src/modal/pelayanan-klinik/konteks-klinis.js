import { CARA_PEMBAYARAN, DAFTAR_PASIEN, KLINIS } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { daftarAlergi, ringkasTandaVital } from './keadaan-pemeriksaan.js';
import { Sebaris } from '../../komponen/ui/susunan.js';
const gayaBlok = { fontSize: token.huruf.ukuran.dasar, lineHeight: 1.4 };
const label = { color: token.warna.teksMenu, display: 'block' };
/** Ringkasan pasien yang tetap terlihat di semua langkah: identitas, alergi, diagnosis aktif, dan tanda vital terakhir. */
export function KonteksKlinis({ konteks, nama, nomorRm }) {
    const k = KLINIS.konteks;
    const alergi = daftarAlergi(konteks?.alergi ?? null);
    const ttv = ringkasTandaVital(konteks?.tanda_vital_terakhir ?? null);
    const sub = konteks
        ? [`${DAFTAR_PASIEN.jenisKelaminSingkat[konteks.pasien.jenis_kelamin]}, ${DAFTAR_PASIEN.umur(konteks.pasien.umur_tahun)}`, `RM ${konteks.pasien.nomor_rm}`, CARA_PEMBAYARAN.label(konteks.kunjungan.cara_pembayaran), konteks.kunjungan.poli_nama]
            .filter(Boolean).join(' · ')
        : `RM ${nomorRm}`;
    return (((() => {
        const tag = Sebaris;
        const props = { m '@kli: a/sh, red';
imp: true, pe { Ko: { minWidth: to } };
        props.children = [((() => {
                const tag = , DAFT;
                const props = {};
                props.children = [((() => {
                        const tag = , DAFT;
                        const props = { rom, }, { token }, from;
                        const gayaBlok = { ;
                        import { daftarAlergi, ringkasTandaVi } from .tebal;
                    }))];
            })),
            props.children = konteks?.pasien.nama ?? nama];
        if (typeof tag === )
            ;
    })));
}
