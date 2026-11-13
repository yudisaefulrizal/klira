import { h, Fragment } from '../../util/h.js';
import { CARA_PEMBAYARAN, DAFTAR_PASIEN, KLINIS } from '@klira/shared';
                                                      
import { token } from '../../gaya/token.js';
import { daftarAlergi, ringkasTandaVital } from './keadaan-pemeriksaan.js';
import { Sebaris } from '../../komponen/ui/susunan.js';
const gayaBlok = {
  fontSize: token.huruf.ukuran.dasar,
  lineHeight: 1.4
}         ;
const label = {
  color: token.warna.teksMenu,
  display: 'block'
}         ;

/** Ringkasan pasien yang tetap terlihat di semua langkah: identitas, alergi, diagnosis aktif, dan tanda vital terakhir. */
export function KonteksKlinis({
  konteks,
  nama,
  nomorRm
}   
                                   
               
                  
 ) {
  const k = KLINIS.konteks;
  const alergi = daftarAlergi(konteks?.alergi ?? null);
  const ttv = ringkasTandaVital(konteks?.tanda_vital_terakhir ?? null);
  const sub = konteks ? [`${DAFTAR_PASIEN.jenisKelaminSingkat[konteks.pasien.jenis_kelamin]}, ${DAFTAR_PASIEN.umur(konteks.pasien.umur_tahun)}`, `RM ${konteks.pasien.nomor_rm}`, CARA_PEMBAYARAN.label(konteks.kunjungan.cara_pembayaran), konteks.kunjungan.poli_nama].filter(Boolean).join(' · ') : `RM ${nomorRm}`;
  return h(Sebaris, {
    jarak: "lg",
    bungkus: true,
    style: {
      minWidth: 0
    }
  }, h("div", null, h("div", {
    style: {
      fontSize: token.huruf.ukuran.besar,
      fontWeight: token.huruf.berat.tebal
    }
  }, konteks?.pasien.nama ?? nama), h("div", {
    style: {
      ...gayaBlok,
      color: token.warna.teksMenu
    }
  }, sub)), h("div", {
    style: gayaBlok
  }, h("span", {
    style: label
  }, k.alergi), alergi.length ? h("strong", {
    style: {
      color: token.warna.status.merah.teks
    }
  }, alergi.join(', ')) : h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, konteks ? k.tidakAda : k.memuat)), h("div", {
    style: gayaBlok
  }, h("span", {
    style: label
  }, k.diagnosisAktif), konteks?.diagnosis_aktif.length ? h("strong", null, konteks.diagnosis_aktif.map(d => `${d.nama} (${d.kode})`).join('; ')) : h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, k.tidakAda)), h("div", {
    style: gayaBlok
  }, h("span", {
    style: label
  }, k.tandaVital), ttv ? h("strong", null, ttv) : h("span", {
    style: {
      color: token.warna.teksRedup
    }
  }, k.tidakAda)));
}