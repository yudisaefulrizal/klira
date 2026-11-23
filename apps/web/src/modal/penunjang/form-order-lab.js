import { PENUNJANG, hargaTarif } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { bidang, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { gantiPilihan, perkiraanBiaya, rupiah, saringPemeriksaan } from './keadaan-order-lab.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';

export function FormOrderLab(awal) {
  let props = awal, cari = '';
  const O = PENUNJANG.order, el = document.createElement('div'), status = document.createElement('div'), daftar = document.createElement('div'), dipilih = document.createElement('div'), ringkasan = document.createElement('small'), petunjuk = document.createElement('small'), akhir = document.createElement('small');
  for (const node of [el, daftar, dipilih]) Object.assign(node.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  Object.assign(daftar.style, { maxHeight: token.ukuran.tinggiDaftar, overflowY: 'auto' }); daftar.setAttribute('role', 'group'); daftar.setAttribute('aria-label', 'Hasil pencarian pemeriksaan'); dipilih.setAttribute('role', 'group'); dipilih.setAttribute('aria-label', 'Pemeriksaan terpilih');
  const recherche = bidang({ id: `${props.awalan}-cari`, label: 'Pemeriksaan', jenis: 'search', autoComplete: 'off', ubah(v) { cari = v; tampil(); } }); recherche.kontrol.placeholder = 'Cari nama atau kode pemeriksaan…';
  petunjuk.textContent = 'Ketik nama, kode pemeriksaan, atau LOINC untuk mencari.'; akhir.textContent = O.tagihanInfo;
  for (const node of [petunjuk, akhir, ringkasan]) node.style.color = token.warna.teksRedup;
  const catatan = bidang({ id: `${props.awalan}-catatan`, label: props.ringkas ? 'Catatan untuk laboratorium (opsional)' : O.catatan, jenis: 'textarea', nilai: props.k.catatan, maxLength: 500, ubah(v) { ubah({ ...props.k, catatan: v }, false); } });
  el.append(status, recherche.el, petunjuk, daftar, dipilih, ringkasan, catatan.el, akhir);
  function ubah(k, render = true) { props = { ...props, k }; if (render) tampil(); props.onUbah(k); }
  function tampil() {
    const { master, k, cara, ringkas = false, galat } = props, tersedia = master.some(m => m.aktif);
    for (const node of [recherche.el, daftar, dipilih, catatan.el]) node.hidden = !tersedia;
    status.replaceChildren(); if (!tersedia) status.append(peringatan(O.belumAda, 'biru', { label: 'Buka Penunjang →', href: '/penunjang?tab=master', onClick: () => navigasiSaatIni().pindah('/penunjang?tab=master') })); else if (galat) status.append(peringatan(galat));
    petunjuk.hidden = !tersedia || ringkas || !!cari.trim(); ringkasan.hidden = akhir.hidden = !tersedia || ringkas;
    daftar.replaceChildren(); dipilih.replaceChildren(); if (!tersedia) return;
    const cocok = saringPemeriksaan(master, cari), terpilih = k.pemeriksaan.map(id => master.find(m => m.id === id)).filter(Boolean);
    if (cari.trim() && !cocok.length) { const pesan = document.createElement('span'); pesan.setAttribute('role', 'status'); pesan.style.color = token.warna.teksRedup; pesan.textContent = PENUNJANG.galat.sumberBelumAda; daftar.append(pesan); }
    function pilihan(m, checked) { const harga = hargaTarif(m.tarif, cara); return KotakCentang({ id: `${props.awalan}-${checked ? 'dipilih' : 'p'}-${m.id}`, label: m.nama, keterangan: ringkas ? undefined : [m.kode_loinc, harga === null ? O.tarifBelum : rupiah(harga)].filter(Boolean).join(' · '), checked, onChange() { ubah(gantiPilihan(props.k, m.id)); } }); }
    for (const m of cocok.filter(m => !k.pemeriksaan.includes(m.id))) daftar.append(pilihan(m, false));
    if (terpilih.length) { const h = document.createElement('strong'); h.textContent = 'Pemeriksaan terpilih'; dipilih.append(h); for (const m of terpilih) dipilih.append(pilihan(m, true)); }
    const biaya = perkiraanBiaya(master, k.pemeriksaan, cara); ringkasan.textContent = `${O.terpilih(k.pemeriksaan.length)}${k.pemeriksaan.length ? ` · ${rupiah(biaya.total)}${biaya.tanpaTarif ? ` (${O.tanpaTarifJumlah(biaya.tanpaTarif)})` : ''}` : ''}`;
    if (catatan.kontrol.value !== k.catatan) catatan.kontrol.value = k.catatan;
  }
  el.perbarui = baru => { props = { ...props, ...baru }; tampil(); }; el.tutup = () => { }; tampil(); return el;
}
