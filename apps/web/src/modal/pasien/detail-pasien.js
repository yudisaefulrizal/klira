import { DAFTAR_PASIEN, STATUS_IDENTITAS, TOMBOL, NAVIGASI } from '@klira/shared';
import { detailPasien } from '../../api-klien/pasien.js';
import { GalatApi } from '../../api-klien/klien.js';
import { bukaPanel } from '../../komponen/panel/panel.js';
import { tombol, peringatan, lencana } from '../../komponen/ui/primitif.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { tampilkanNamaWilayah } from '../../komponen/pencarian/pencarian-wilayah.js';
const strip = (v) => (v && v.trim() ? v : '-');
/** Bagian ringkasan dari isi data pasien (fungsi murni untuk panel dan uji). */
export function bagianDetailPasien(p, namaWilayah) {
    const d = DAFTAR_PASIEN.detail;
    return [
        {
            judul: d.nama,
            baris: [
                { label: d.nomorRm, nilai: p.nomor_rm }, { label: d.nik, nilai: strip(p.nik) }, { label: 'Nomor HP pasien', nilai: strip(p.nomor_hp) }, { label: d.ibu, nilai: strip(p.ibu_kandung) },
                { label: d.tempatLahir, nilai: strip(p.tempat_lahir) }, { label: d.tanggalLahir, nilai: p.tanggal_lahir },
                { label: d.jenisKelamin, nilai: DAFTAR_PASIEN.jenisKelamin[p.jenis_kelamin] },
                { label: d.agama, nilai: strip(p.agama) }, { label: d.suku, nilai: strip(p.suku) }, { label: d.bahasa, nilai: strip(p.bahasa) },
                { label: d.pekerjaan, nilai: strip(p.pekerjaan) }, { label: d.pendidikan, nilai: strip(p.pendidikan) }, { label: d.statusKawin, nilai: strip(p.status_kawin) },
                ...(p.tidak_cakap ? [{ label: d.tidakCakap, nilai: DAFTAR_PASIEN.detail.tidakCakap }] : []),
            ],
        },
        {
            judul: d.alamat,
            baris: [
                { label: d.alamat, nilai: p.kode_wilayah ? namaWilayah ?? strip(p.kode_wilayah) : strip(p.alamat) },
                ...(p.nomor_paspor ? [{ label: d.paspor, nilai: p.nomor_paspor }] : []), ...(p.nomor_kitas ? [{ label: d.kitas, nilai: p.nomor_kitas }] : []),
            ],
        },
        { judul: d.penjamin, baris: [{ label: d.jknKartu, nilai: strip(p.jkn_nomor_kartu) }, { label: d.asuransiNama, nilai: strip(p.asuransi_nama) }, { label: d.asuransiPolis, nilai: strip(p.asuransi_nomor_polis) }] },
        {
            judul: d.wali,
            baris: p.wali.length ? p.wali.map((w) => ({ label: w.hubungan, nilai: w.kontak ? `${w.nama} (${w.kontak})` : w.nama })) : [{ label: d.wali, nilai: d.tanpaWali }],
        },
    ];
}
export function bukaDetailPasien({ id, nama, onTutup }) {
    let actif = true, lepasWilayah;
    const panel = bukaPanel({ judul: `${DAFTAR_PASIEN.detailJudul}: ${nama}`, onTutup() { actif = false; lepasWilayah?.(); panel.tutup(); onTutup(); }, aksi: tombol(TOMBOL.tutup, () => { actif = false; lepasWilayah?.(); panel.tutup(); onTutup(); }, 'sekunder') }), contenu = document.createElement('div');
    panel.isi.append(peringatan(DAFTAR_PASIEN.detailTercatat, 'biru'), contenu);
    contenu.append(NAVIGASI.memuat);
    detailPasien(id).then(data => { if (!actif)
        return; function afficher(nom) { if (actif)
        contenu.replaceChildren(lencana(STATUS_IDENTITAS.label(data.status_identitas), STATUS_IDENTITAS.warna(data.status_identitas)), DaftarRingkasan({ bagian: bagianDetailPasien(data, nom) })); } afficher(); if (data.kode_wilayah) {
        const label = document.createElement('span');
        lepasWilayah = tampilkanNamaWilayah(label, data.kode_wilayah);
    } }).catch(e => { if (actif)
        contenu.replaceChildren(peringatan(e instanceof GalatApi ? e.message : DAFTAR_PASIEN.detailGagal)); });
    return { tutup() { actif = false; lepasWilayah?.(); panel.tutup(); } };
}
