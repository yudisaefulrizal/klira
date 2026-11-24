import { RAWAT_INAP, TOMBOL } from '@klira/shared';
import { ambilOpsiRawatInap, ambilRawatInap, ubahPenempatan } from '../../api-klien/rawat-inap.js';
import { pesanGalat } from '../../api-klien/klien.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { KepalaPasien } from '../pasien/kepala-pasien.js';
import { awalPenempatan, bentukPenempatan, galatPenempatan } from './keadaan-rawat-inap.js';
import { kolomFleks, teksRedupKecil } from '../../gaya/tata-letak.js';

export function bukaUbahPenempatan({ kunjunganId, onTutup, onSelesai }) {
  const P = RAWAT_INAP.penempatan, A = RAWAT_INAP.admisi;
  let data = null, opsi = null, awal = awalPenempatan(null), k = awalPenempatan(null), dicoba = false, proses = false, tersimpan = false, hidup = true, ruangPilih = '';
  function tutup() { hidup = false; modal.tutup(); (tersimpan ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: P.judul, lebar: 'modalBesar', onTutup: tutup, lindungiTutup: () => !tersimpan && adaPerubahan(awal, k) });
  const status = document.createElement('div'), form = document.createElement('form'), alasanWadah = document.createElement('div'), bersama = document.createElement('div'), riwayat = document.createElement('div'), controls = new Map(); form.noValidate = true;
  for (const el of [form, bersama, riwayat]) kolomFleks(el, 'md');
  const simpan = tombol(P.simpan, kirim); simpan.disabled = true;
  const aktif = () => data?.penempatan.find(x => !x.selesai) ?? null;
  function galatBidang() { const g = galatPenempatan(k); if (aktif() && (k.bed_id !== awal.bed_id || k.tarif_id !== awal.tarif_id) && !k.alasan.trim()) g.alasan = RAWAT_INAP.galat.alasanPindah; return g; }
  function kecil(teks) { const el = document.createElement('span'); el.textContent = teks; teksRedupKecil(el); return el; }
  const alasan = bidang({ id: 'pn-alasan', label: P.alasan, jenis: 'textarea', maxLength: 300, ubah(v) { k = { ...k, alasan: v }; perbarui(); } });
  function perbarui() {
    const g = galatBidang();
    for (const [nama, f] of controls) f.setGalat(dicoba ? g[nama] : undefined);
    alasan.setGalat(dicoba ? g.alasan : undefined);
    alasan.el.hidden = !(aktif() && k.bed_id !== '');
  }
  function rekan() { bersama.replaceChildren(); const h = document.createElement('strong'); h.textContent = A.dpjpBersama; bersama.append(h); for (const d of (opsi?.dpjp ?? []).filter(d => String(d.id) !== k.dpjp_id)) bersama.append(KotakCentang({ id: `pn-bersama-${d.id}`, label: d.nama, checked: k.dpjp_bersama.includes(String(d.id)), onChange(e) { k = { ...k, dpjp_bersama: e.target.checked ? [...k.dpjp_bersama, String(d.id)] : k.dpjp_bersama.filter(x => x !== String(d.id)) }; rekan(); perbarui(); } })); bersama.append(kecil(P.dpjpPetunjuk)); const g = galatBidang(); if (dicoba && g.dpjp_bersama) bersama.append(peringatan(g.dpjp_bersama)); }
  function champ(nama, label, pilihan) { const f = bidang({ id: `pn-${nama}`, label, nilai: k[nama], opsi: pilihan, ubah(v) { k = { ...k, [nama]: v }; if (nama === 'dpjp_id') rekan(); perbarui(); } }); controls.set(nama, f); form.append(f.el); }
  function tampil() {
    form.replaceChildren(); controls.clear(); const sekarang = aktif(); form.append(kecil(sekarang ? `${P.sekarang}: ${[sekarang.ruang_nama, sekarang.bed_nama].filter(Boolean).join(' · ')}` : P.belumAda));
    const semuaBed = opsi?.bed_kosong ?? [];
    const ruangOpsi = [...new Set(semuaBed.map(b => b.ruang_nama).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const bedTersaring = semuaBed.filter(b => !ruangPilih || b.ruang_nama === ruangPilih);
    if (ruangOpsi.length) {
      form.append(bidang({
        id: 'pn-ruang',
        label: 'Kamar / Ruang',
        nilai: ruangPilih,
        opsi: [{ nilai: '', label: 'Semua kamar' }, ...ruangOpsi.map(r => ({ nilai: r, label: r }))],
        ubah(v) {
          ruangPilih = v;
          const cocok = semuaBed.filter(b => !v || b.ruang_nama === v);
          const bedBaru = v && cocok.length === 1 ? String(cocok[0].id) : cocok.some(b => String(b.id) === k.bed_id) ? k.bed_id : '';
          const objBed = semuaBed.find(b => String(b.id) === bedBaru) ?? (v ? cocok[0] : null);
          k = { ...k, bed_id: bedBaru, ...(objBed?.ruang_tarif_id ? { tarif_id: String(objBed.ruang_tarif_id) } : {}) };
          tampil();
        },
      }).el);
    }
    const fBed = bidang({
      id: 'pn-bed_id',
      label: P.bed,
      nilai: k.bed_id,
      opsi: [{ nilai: '', label: sekarang ? P.tetap : A.bedMenunggu }, ...bedTersaring.map(b => ({ nilai: String(b.id), label: ruangPilih || !b.ruang_nama ? b.nama : `${b.ruang_nama} · ${b.nama}` }))],
      ubah(v) {
        const objBed = semuaBed.find(b => String(b.id) === v);
        k = { ...k, bed_id: v, ...(objBed?.ruang_tarif_id ? { tarif_id: String(objBed.ruang_tarif_id) } : {}) };
        tampil();
      },
    });
    controls.set('bed_id', fBed); form.append(fBed.el);
    const bedTerpilih = semuaBed.find((b) => String(b.id) === k.bed_id);
    if (bedTerpilih) {
      form.append(kecil(bedTerpilih.ruang_harga_umum != null
        ? `Harga kamar: Rp ${Number(bedTerpilih.ruang_harga_umum).toLocaleString('id-ID')} / hari`
        : 'Kamar ini belum memiliki harga bawaan.'));
    }
    alasan.kontrol.value = k.alasan; alasanWadah.replaceChildren(alasan.el); form.append(alasanWadah);
    champ('dpjp_id', A.dpjpUtama, (opsi?.dpjp ?? []).map(d => ({ nilai: String(d.id), label: `${d.nama}${d.profesi ? ` (${d.profesi})` : ''}` }))); bersama.setAttribute('role', 'group'); bersama.setAttribute('aria-label', A.dpjpBersama); rekan(); form.append(bersama); perbarui();
    riwayat.replaceChildren(); if (data?.penempatan.length) { const h = document.createElement('strong'); h.textContent = P.riwayat; riwayat.append(h); for (const x of [...data.penempatan].reverse()) riwayat.append(kecil(`${[x.ruang_nama, x.bed_nama].filter(Boolean).join(' · ')} · ${formatWaktu(x.mulai)}${x.selesai ? ` - ${formatWaktu(x.selesai)}` : ''}`)); }
  }
  async function kirim() { dicoba = true; perbarui(); rekan(); if (!data || proses || Object.keys(galatBidang()).length) return; proses = true; simpan.disabled = true; simpan.textContent = P.menyimpan; status.replaceChildren(); try { await ubahPenempatan(kunjunganId, bentukPenempatan(k)); if (!hidup) return; tersimpan = true; modal.isi.replaceChildren(peringatan(P.tersimpan, 'biru')); modal.aksi.replaceChildren(tombol(TOMBOL.tutup, tutup)); modal.setLebar('modalKecil'); } catch (e) { if (hidup) status.replaceChildren(peringatan(pesanGalat(e, P.gagal))); } finally { proses = false; simpan.disabled = !data; simpan.textContent = P.simpan; } }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, form, riwayat); modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan); tampil(); modal.fokus();
  Promise.all([ambilRawatInap(kunjunganId), ambilOpsiRawatInap()]).then(([d, o]) => { if (!hidup) return; data = d; opsi = o; awal = awalPenempatan(d); k = { ...awal }; modal.konteks.replaceChildren(KepalaPasien({ nama: d.kunjungan.pasien_nama, nomorRm: d.kunjungan.pasien_nomor_rm })); tampil(); simpan.disabled = proses; }).catch(e => { if (hidup) status.replaceChildren(peringatan(pesanGalat(e, P.gagal))); });
  return { tutup() { hidup = false; modal.tutup(); } };
}
