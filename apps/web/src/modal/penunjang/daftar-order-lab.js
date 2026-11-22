import { h, Fragment } from '../../util/h.js';
import { INTERPRETASI_HASIL, PENUNJANG, STATUS_ORDER_PENUNJANG } from '@klira/shared';

import { token } from '../../gaya/token.js';
import { Bingkai } from '../../komponen/ui/kartu.js';
import { Lencana } from '../../komponen/ui/lencana.js';
import { Kolom, Sebaris } from '../../komponen/ui/susunan.js';
import { BarisTabel, SelTabel, Tabel } from '../../komponen/ui/tabel.js';
import { tanggalWaktuPendek } from '../../util/format.js';

const redup = {
  color: token.warna.teksRedup,
  fontSize: token.huruf.ukuran.kecil,
};

const selKecil = {
  fontSize: token.huruf.ukuran.kecil,
};

const KOLOM = [
  { judul: PENUNJANG.cetak.kolom.pemeriksaan },
  { judul: 'Status' },
  { judul: PENUNJANG.daftar.hasil },
  { judul: PENUNJANG.daftar.rujukan },
  { judul: PENUNJANG.cetak.kolom.interpretasi },
  { judul: 'Petugas Lab' },
];

const waktuMs = (v) => {
  const t = v ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : 0;
};

/**
 * Order lab satu kunjungan dalam format tabel ringkas (urutan terbaru di atas): pemeriksaan, status, hasil, rujukan, interpretasi, dan pengesahan;
 * addendum ditampilkan sebagai baris anak di bawah pemeriksaan terkait.
 */
export function DaftarOrderLab({ orders }) {
  if (!orders?.length) return h(Fragment, null);
  const D = PENUNJANG.daftar;
  const terurut = [...orders].sort((a, b) => (waktuMs(b.dibuat_pada) - waktuMs(a.dibuat_pada)) || ((Number(b.id) || 0) - (Number(a.id) || 0)));

  return h(Bingkai, {
    arah: 'kolom',
    style: { padding: '0', overflow: 'hidden' },
  }, h(Tabel, {
    kolom: KOLOM,
    label: PENUNJANG.cetak.kolom.pemeriksaan,
  }, terurut.map((o) => {
    const hasil = o.hasil;
    const tidakNormal = !!hasil?.interpretasi && hasil.interpretasi !== 'normal';

    return h(Fragment, { key: o.id },
      h(BarisTabel, null,
        h(SelTabel, null,
          h(Kolom, { jarak: 'xs' },
            h(Sebaris, { bungkus: true, jarak: 'xs' },
              h('strong', null, o.nama),
              o.kode_loinc && h('span', { style: redup }, `${D.kodeLoinc} ${o.kode_loinc}`),
            ),
            h('span', { style: redup }, `${PENUNJANG.order.dipesanOleh(o.dibuat_oleh_nama ?? '-')} · ${tanggalWaktuPendek(o.dibuat_pada)}`),
            o.spesimen && h('span', { style: redup }, `${D.spesimen}: ${D.spesimenInfo(o.spesimen.asal, o.spesimen.petugas_nama)}, ${tanggalWaktuPendek(o.spesimen.waktu_ambil)}`),
            o.catatan && h('span', { style: selKecil }, `${D.catatan}: ${o.catatan}`),
          ),
        ),
        h(SelTabel, null,
          h(Kolom, { jarak: 'xs' },
            h(Lencana, {
              warna: STATUS_ORDER_PENUNJANG.warna(o.status),
            }, STATUS_ORDER_PENUNJANG.label(o.status)),
            hasil && o.status !== 'divalidasi' && h(Lencana, {
              warna: 'kuning',
            }, D.menungguValidasi),
          ),
        ),
        h(SelTabel, null,
          hasil ? h(Kolom, { jarak: 'xs' },
            h('span', {
              style: {
                fontWeight: tidakNormal ? token.huruf.berat.tebal : token.huruf.berat.sedang,
              },
            }, `${hasil.nilai}${hasil.satuan ? ` ${hasil.satuan}` : ''}`),
            hasil.catatan && h('span', { style: redup }, `${D.catatan}: ${hasil.catatan}`),
          ) : h('span', { style: redup }, '-'),
        ),
        h(SelTabel, null,
          hasil?.rujukan_teks
            ? h('span', { style: selKecil }, hasil.rujukan_teks)
            : h('span', { style: redup }, '-'),
        ),
        h(SelTabel, null,
          hasil?.interpretasi
            ? h(Lencana, {
              warna: INTERPRETASI_HASIL.warna(hasil.interpretasi),
            }, INTERPRETASI_HASIL.label(hasil.interpretasi))
            : h('span', { style: redup }, '-'),
        ),
        h(SelTabel, null,
          (hasil?.validator_nama || hasil?.dientri_oleh)
            ? h('span', { style: selKecil }, hasil.validator_nama ?? hasil.dientri_oleh)
            : h('span', { style: redup }, '-'),
        ),
      ),
    );
  })));
}