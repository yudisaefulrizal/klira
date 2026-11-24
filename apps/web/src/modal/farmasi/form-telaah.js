import { FARMASI, STATUS_RESEP } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { bidang, kartu, lencana, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { EditorItemResep } from './editor-item-resep.js';
import { telaahLengkap } from './keadaan-farmasi.js';
import { galatIsianTelaah, resepTerkunci } from './simpan-telaah.js';
import { CatatanResep, ItemResepFarmasi } from './tampilan-resep.js';
import { barisFleks, kolomFleks } from '../../gaya/tata-letak.js';

const T = FARMASI.telaah;

/** Ringkasan klinis pasien untuk apoteker: diagnosis aktif (umur dan alergi sudah ada di kepala pasien). */
export function RingkasanKlinis({ konteks, galatKonteks }) {
  const box = kartu({ susun: 'sm', style: { padding: token.jarak.md } }), h = document.createElement('strong'); h.textContent = T.ringkasanKlinis; box.append(h);
  if (konteks) {
    const baris = (teks) => { const d = document.createElement('div'); d.textContent = teks; return d; };
    box.append(
      baris(`Diagnosis: ${konteks.diagnosis_aktif.map((d) => `${d.kode} — ${d.nama}`).join('; ') || 'Belum tercatat'}`),
    );
  }
  else box.append(peringatan(galatKonteks ? T.konteksGagal : T.konteksMemuat, 'biru'));
  return box;
}

/**
 * Formulir telaah resep di tab Resep (pengganti modal Telaah): untuk tiap resep yang belum siap, item obat yang dapat disesuaikan apoteker, tiga telaah
 * (administratif, farmasetik, klinis), catatan, dan "Obat selesai disiapkan"; resep yang sudah siap hanya dibaca. Satu tombol menyimpan semuanya.
 * Isian dipegang induk (`isian` per id resep); `onUbah(id, perubahan)` mencatatnya tanpa menggambar ulang, kecuali `lukis` dipanggil induk.
 */
export function FormTelaah({ daftar, isian, obat, konteks, galatKonteks, kekurangan = [], dicoba, memproses, galat, info, onUbah, onSimpan }) {
  const el = document.createElement('div'); kolomFleks(el, 'md');
  const editor = [];
  el.append(RingkasanKlinis({ konteks, galatKonteks }));
  if (galat) el.append(peringatan(galat));
  if (info) el.append(peringatan(info, 'biru'));
  if (kekurangan.length) {
    const p = peringatan(T.stokKurangJudul);
    for (const x of kekurangan) { const baris = document.createElement('div'); baris.textContent = T.stokKurang(x.nama, x.butuh, x.tersedia); p.append(baris); }
    el.append(p);
  }
  for (const r of daftar) {
    const k = isian[r.id], g = k ? galatIsianTelaah(k) : {}, terkunci = resepTerkunci(r) || memproses, card = kartu({ susun: 'sm', style: { padding: token.jarak.md } });
    const kepala = document.createElement('div'); barisFleks(kepala, 'sm', { rata: 'center', sebar: true });
    // Dokter dan waktu resep diajukan: dalam kurung di samping nomor resep.
    const judul = document.createElement('strong'); judul.textContent = `${T.resep(r.nomor_resep)} (Dokter: ${r.dpjp_nama ?? 'Belum tercatat'} · ${new Date(r.dibuat_pada).toLocaleString('id-ID')})`;
    kepala.append(judul, lencana(r.status === 'diajukan' ? FARMASI.resep.menungguFarmasiLabel : STATUS_RESEP.label(r.status), STATUS_RESEP.warna(r.status))); card.append(kepala);
    if (resepTerkunci(r) || !k) { card.append(ItemResepFarmasi({ item: r.item }), CatatanResep({ catatan: r.catatan })); if (r.telaah) card.append(T.oleh(r.telaah.apoteker_nama ?? '-')); el.append(card); continue; }
    if (obat) {
      const e = EditorItemResep({ idAwal: `telaah-${r.id}`, baris: k.item, obat, judul: '', petunjuk: '', onUbah(item) { onUbah(r.id, { item }); }, galat: g, tampilGalat: dicoba, disabled: terkunci });
      editor.push(e); card.append(e);
    }
    else card.append(FARMASI.memuat);
    const fieldset = document.createElement('fieldset'); fieldset.disabled = terkunci; fieldset.setAttribute('aria-label', `Hasil telaah ${r.nomor_resep}`);
    Object.assign(fieldset.style, { border: '0', padding: '0', display: 'flex', flexDirection: 'column', gap: token.jarak.xs });
    const cat = bidang({ id: `tel-cat-${r.id}`, label: T.catatan, jenis: 'textarea', nilai: k.catatan, maxLength: 1000, ubah(v) { onUbah(r.id, { catatan: v }); } });
    cat.setGalat(dicoba ? g.catatan : undefined);
    // Satu centang untuk telaah administratif, farmasetik, dan klinis sekaligus beserta penyiapan obat.
    const siap = KotakCentang({ id: `tel-siap-${r.id}`, label: T.obatSiap, checked: k.siap && telaahLengkap(k), onChange(e) { const v = e.target.checked; onUbah(r.id, { administratif: v, farmasetik: v, klinis: v, siap: v }); } });
    fieldset.append(cat.el, siap);
    if (dicoba && g.siap) fieldset.append(peringatan(g.siap));
    card.append(fieldset);
    el.append(card);
  }
  const bisaSimpan = !!obat && daftar.some((r) => !resepTerkunci(r));
  if (bisaSimpan) {
    // Tombol simpan di kiri; siapa yang menelaah di kanan, sejajar dengan tombol.
    const baris = document.createElement('div'); barisFleks(baris, 'md', { rata: 'center', bungkus: true, sebar: true });
    const simpan = tombol(memproses ? T.menyimpan : T.simpanTelaah, onSimpan); simpan.disabled = memproses; baris.append(simpan);
    const penelaah = [...new Set(daftar.filter((r) => !resepTerkunci(r) && r.telaah).map((r) => r.telaah.apoteker_nama ?? '-'))];
    if (penelaah.length) { const oleh = document.createElement('span'); oleh.textContent = T.oleh(penelaah.join(', ')); oleh.style.color = token.warna.teksRedup; baris.append(oleh); }
    el.append(baris);
  }
  el.tutup = () => { for (const e of editor) e.tutup(); };
  return el;
}
