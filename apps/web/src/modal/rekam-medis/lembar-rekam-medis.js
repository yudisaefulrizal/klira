import { h } from '../../util/h.js';
import { CARA_PEMBAYARAN, KLINIS, TANDA_VITAL } from '@klira/shared';
import { tanggalPendek, tanggalWaktuPendek } from '../../util/format.js';
import { barisPemeriksaanFisik, keadaanDariServer } from '../pemeriksaan/keadaan-pemeriksaan.js';

const C = KLINIS.cetak;

function Blok({ judul, children }) {
  return h('section', { className: 'crm-kh-blok' },
    h('div', { className: 'crm-kh-bjudul' }, judul),
    h('div', { className: 'crm-kh-bisi' }, children),
  );
}

/** Resume Medis ringkas gaya SIMKES Khanza (1 format standar Ralan/Ranap untuk arsip & klaim BPJS). */
export function Lembar({ d, inap = null }) {
  const b = d.klinis.bagian;
  const k = keadaanDariServer(b);
  const p = d.pasien;
  const kj = d.klinis.kunjungan;
  const anam = b.anamnesis?.isi ?? {};

  const tv = TANDA_VITAL
    .filter((t) => k.tanda_vital[t.kunci])
    .map((t) => `${KLINIS.tandaVital[t.kunci]}: ${k.tanda_vital[t.kunci]} ${KLINIS.tandaVital.satuan[t.satuan] ?? t.satuan}`)
    .concat(k.tanda_vital.kesadaran ? [`Kesadaran: ${KLINIS.tandaVital.kesadaranOpsi[k.tanda_vital.kesadaran] ?? k.tanda_vital.kesadaran}`] : []);

  const fisik = barisPemeriksaanFisik(k.pemeriksaan).map((x) => `${x.label}: ${x.nilai.replaceAll(' (!)', '')}`);

  const daftarKode = [
    ...(k.diagnosis ?? []).map((dx) => ({ jenis: dx.peran === 'utama' ? 'Diagnosa Utama' : 'Diagnosa Sekunder', kode: dx.kode, nama: dx.nama })),
    ...(k.tindakan ?? []).map((t) => ({ jenis: 'Tindakan', kode: t.kode, nama: `${t.nama}${t.jumlah && t.jumlah !== '1' ? ` (×${t.jumlah})` : ''}` })),
  ];

  const obatPulang = d.resep.map((r) => [
    ...r.item.map((i) => `• ${i.nama} — ${i.jumlah} ${i.satuan} (${i.aturan_pakai})`),
    ...(r.catatan?.trim() ? [`Catatan: ${r.catatan.trim()}`] : []),
  ].join('\n')).join('\n');

  const tl = k.tindak_lanjut;
  const kondisiKeluar = tl.jenis === 'rujuk'
    ? `Rujuk ke ${d.rujukan?.tujuan ?? tl.tujuan ?? '-'}${d.rujukan?.nomor ? ` (No. ${d.rujukan.nomor})` : ''}${tl.catatan ? ` · ${tl.catatan}` : ''}`
    : KLINIS.tindakLanjut.jenisOpsi.find((o) => o.nilai === tl.jenis)?.label ?? '-';

  const caraBayar = `${CARA_PEMBAYARAN.label(kj.cara_pembayaran)}${p.nomor_jkn ? ` · ${p.nomor_jkn}` : ''}`;

  return h('article', { className: 'crm-lembar crm-kh' },
    h('header', { className: 'crm-kh-kop' },
      h('h1', null, d.fasyankes?.nama ?? 'KLINIK PRATAMA'),
      d.fasyankes?.alamat && h('p', null, d.fasyankes.alamat),
    ),
    h('div', { className: 'crm-kh-judul' }, inap ? 'RESUME MEDIS PASIEN RAWAT INAP' : 'RESUME MEDIS PASIEN RAWAT JALAN'),
    h('table', { className: 'crm-kh-id' },
      h('tbody', null,
        h('tr', null,
          h('td', { className: 'crm-kh-lbl' }, 'No. Layanan'), h('td', { className: 'crm-kh-sep' }, ':'), h('td', { className: 'crm-kh-val' }, kj.id_layanan ?? String(kj.id)),
          h('td', { className: 'crm-kh-lbl' }, 'No. Rekam Medis'), h('td', { className: 'crm-kh-sep' }, ':'), h('td', { className: 'crm-kh-val' }, h('strong', null, p.nomor_rm)),
        ),
        h('tr', null,
          h('td', { className: 'crm-kh-lbl' }, 'Nama Pasien'), h('td', { className: 'crm-kh-sep' }, ':'), h('td', { className: 'crm-kh-val' }, h('strong', null, p.nama)),
          h('td', { className: 'crm-kh-lbl' }, 'Tgl. Lahir / JK'), h('td', { className: 'crm-kh-sep' }, ':'), h('td', { className: 'crm-kh-val' }, `${tanggalPendek(p.tanggal_lahir)} · ${p.jenis_kelamin === 'laki_laki' ? 'Laki-laki' : 'Perempuan'}`),
        ),
        h('tr', null,
          h('td', { className: 'crm-kh-lbl' }, 'Tgl. Kunjungan'), h('td', { className: 'crm-kh-sep' }, ':'), h('td', { className: 'crm-kh-val' }, tanggalWaktuPendek(d.kepala.mulai)),
          h('td', { className: 'crm-kh-lbl' }, 'Poliklinik'), h('td', { className: 'crm-kh-sep' }, ':'), h('td', { className: 'crm-kh-val' }, d.kepala.poli ?? '-'),
        ),
        h('tr', null,
          h('td', { className: 'crm-kh-lbl' }, 'Cara Bayar / JKN'), h('td', { className: 'crm-kh-sep' }, ':'), h('td', { className: 'crm-kh-val' }, caraBayar),
          h('td', { className: 'crm-kh-lbl' }, 'No. PCare / NIK'), h('td', { className: 'crm-kh-sep' }, ':'), h('td', { className: 'crm-kh-val' }, kj.pcare_no_kunjungan || p.nik || '-'),
        ),
      ),
    ),
    h(Blok, { judul: '1. Anamnesis (Keluhan Utama & Riwayat Penyakit)' },
      h('div', null, h('strong', null, 'Keluhan Utama: '), anam.keluhan_utama || k.subjek || '-'),
      (anam.riwayat_sekarang || anam.penyerta) && h('div', null, h('strong', null, 'Riwayat Penyakit Sekarang: '), [anam.riwayat_sekarang, anam.penyerta].filter(Boolean).join('; ')),
    ),
    h(Blok, { judul: '2. Pemeriksaan Fisik & Tanda Vital' },
      h('div', null, h('strong', null, 'Tanda Vital: '), tv.length ? tv.join(' · ') : '-'),
      h('div', null, h('strong', null, 'Pemeriksaan Fisik: '), fisik.length ? fisik.join(' · ') : (k.objek || '-')),
    ),
    h(Blok, { judul: '3. Pemeriksaan Penunjang Utama' },
      d.penunjang.length
        ? d.penunjang.map((x) => `• ${x.nama}: ${x.nilai ? `${x.nilai}${x.satuan ? ` ${x.satuan}` : ''}${x.interpretasi && x.interpretasi !== 'normal' ? ` (${x.interpretasi})` : ''}` : C.belumAdaHasil}`).join('\n')
        : 'Tidak ada pemeriksaan penunjang.',
    ),
    h(Blok, { judul: '4. Diagnosis (ICD-10) & Tindakan (ICD-9-CM)' },
      daftarKode.length
        ? h('table', { className: 'crm-kh-kode' },
          h('thead', null, h('tr', null, h('th', { style: { width: '20%' } }, 'Jenis'), h('th', { style: { width: '14%' } }, 'Kode'), h('th', null, 'Deskripsi'))),
          h('tbody', null, daftarKode.map((row, idx) => h('tr', { key: `${row.kode}-${idx}` }, h('td', null, row.jenis), h('td', null, h('strong', null, row.kode)), h('td', null, row.nama)))),
        )
        : '-',
    ),
    h(Blok, { judul: '5. Terapi & Obat Pulang' },
      [k.obat_poli ? `Obat di Poli: ${k.obat_poli}` : '', obatPulang].filter(Boolean).join('\n') || '-',
    ),
    h(Blok, { judul: '6. Kondisi Keluar & Instruksi Tindak Lanjut' },
      h('div', null, h('strong', null, 'Kondisi Keluar: '), kondisiKeluar),
      h('div', null, h('strong', null, 'Anjuran / Edukasi: '), [k.kie, tl.catatan].filter(Boolean).join(' · ') || '-'),
    ),
    h('div', { className: 'crm-kh-ttd' },
      h('div', null,
        h('div', null, 'Pasien / Keluarga Pasien,'),
        h('div', { className: 'crm-kh-spasi' }),
        h('div', null, h('strong', null, `(${p.nama})`)),
      ),
      h('div', null,
        h('div', null, 'Dokter Penanggung Jawab Pelayanan (DPJP),'),
        d.tte_qr
          ? h('img', { src: d.tte_qr, alt: 'QR Tanda Tangan Elektronik DPJP', className: 'crm-kh-qr' })
          : h('div', { className: 'crm-kh-spasi' }),
        d.tte_pengesah && h('div', { className: 'crm-kh-tte' }, `Ditandatangani elektronik · ${tanggalWaktuPendek(d.tte_pengesah.waktu)}`),
        h('div', null, h('strong', null, `(${d.tte_pengesah?.nama ?? d.kepala.dokter ?? '.................................'})`)),
      ),
    ),
    h('footer', { className: 'crm-kh-kaki' },
      h('span', null, C.dicetak(d.dicetak_oleh, tanggalWaktuPendek(d.dicetak_pada))),
      h('span', null, 'Dokumen Rekam Medis Elektronik Klira'),
    ),
  );
}
