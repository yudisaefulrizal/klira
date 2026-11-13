import { h, Fragment } from '../../util/h.js';
import { INTERPRETASI_HASIL, PENUNJANG, PRIORITAS_ORDER, STATUS_ORDER_PENUNJANG, STATUS_PENGESAHAN } from '@klira/shared';
                                                       
import { token } from '../../gaya/token.js';
import { TampilanAddendum } from '../../komponen/klinis/tampilan-addendum.js';
import { Bingkai } from '../../komponen/ui/kartu.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { Kolom, Sebaris, Tumbuh } from '../../komponen/ui/susunan.js';
import { tanggalWaktuPendek } from '../../util/format.js';
const redup = {
  color: token.warna.teksRedup,
  fontSize: token.huruf.ukuran.kecil
}         ;

/**
 * Order lab satu kunjungan beserta status, spesimen, hasil (bila sudah divalidasi atau menunggu validasi), pengesahan, dan addendum.
 * Dokter melihat hasil yang sudah divalidasi di sini selama pemeriksaan (7); hasil susulan tampil sebagai addendum.
 */
export function DaftarOrderLab({
  orders
}   
                                       
 ) {
  const D = PENUNJANG.daftar;
  return h(Kolom, {
    jarak: "sm"
  }, orders.map(o => h(Bingkai, {
    key: o.id,
    arah: "kolom",
    padding: "md"
  }, h(Sebaris, {
    bungkus: true
  }, h("strong", null, o.nama), o.kode_loinc && h("span", {
    style: redup
  }, `${D.kodeLoinc} ${o.kode_loinc}`), h(Tumbuh, null), h(Lencana, {
    warna: PRIORITAS_ORDER.warna(o.prioritas)
  }, PRIORITAS_ORDER.label(o.prioritas)), h(Lencana, {
    warna: STATUS_ORDER_PENUNJANG.warna(o.status)
  }, STATUS_ORDER_PENUNJANG.label(o.status))), h("span", {
    style: redup
  }, `${PENUNJANG.order.dipesanOleh(o.dibuat_oleh_nama ?? '-')} · ${tanggalWaktuPendek(o.dibuat_pada)}`), o.catatan && h("span", null, `${D.catatan}: ${o.catatan}`), o.spesimen && h("span", {
    style: redup
  }, `${D.spesimen}: ${D.spesimenInfo(o.spesimen.asal, o.spesimen.petugas_nama)}, ${tanggalWaktuPendek(o.spesimen.waktu_ambil)}`), o.hasil && h(Kolom, {
    jarak: "xs"
  }, h(Sebaris, {
    bungkus: true
  }, h("strong", null, `${o.hasil.nilai}${o.hasil.satuan ? ` ${o.hasil.satuan}` : ''}`), h(Lencana, {
    warna: INTERPRETASI_HASIL.warna(o.hasil.interpretasi)
  }, INTERPRETASI_HASIL.label(o.hasil.interpretasi)), o.status !== 'divalidasi' && h(Lencana, {
    warna: "kuning"
  }, D.menungguValidasi)), o.hasil.rujukan_teks && h("span", {
    style: redup
  }, `${D.rujukan}: ${o.hasil.rujukan_teks}`), o.hasil.catatan && h("span", null, `${D.catatan}: ${o.hasil.catatan}`), o.hasil.validator_nama && h(Sebaris, {
    bungkus: true,
    style: redup
  }, h("span", null, `${D.validator} ${o.hasil.validator_nama}`), h(Lencana, {
    warna: STATUS_PENGESAHAN.warna(o.verifikasi)
  }, STATUS_PENGESAHAN.label(o.verifikasi)))), h(TampilanAddendum, {
    daftar: o.addendum
  }))));
}