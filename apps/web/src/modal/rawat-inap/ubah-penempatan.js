import { INDIKATOR_KELAS, KELAS_RAWAT, RAWAT_INAP, TOMBOL } from '@klira/shared';
import { ambilOpsiRawatInap, ambilRawatInap, ubahPenempatan } from '../../api-klien/rawat-inap.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { KepalaPasien } from '../pasien/kepala-pasien.js';
import { rupiahAtau } from '../penunjang/keadaan-order-lab.js';
import { awalPenempatan, bentukPenempatan, galatPenempatan } from './keadaan-rawat-inap.js';

export function bukaUbahPenempatan({ kunjunganId, onTutup, onSelesai }) {
  const P = RAWAT_INAP.penempatan, A = RAWAT_INAP.admisi;
  let data = null, opsi = null, awal = awalPenempatan(null), k = awalPenempatan(null), dicoba = false, proses = false, tersimpan = false, hidup = true;
  function tutup() { hidup = false; modal.tutup(); (tersimpan ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: P.judul, lebar: 'modalBesar', onTutup: tutup, lindungiTutup: () => !tersimpan && adaPerubahan(awal, k) });
  const status = document.createElement('div'), form = document.createElement('form'), alasanWadah = document.createElement('div'), bersama = document.createElement('div'), riwayat = document.createElement('div'), controls = new Map(); form.noValidate = true;
  for (const el of [form, bersama, riwayat]) Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const simpan = tombol(P.simpan, kirim); simpan.disabled = true;
  const aktif = () => data?.penempatan.find(x => !x.selesai) ?? null;
  function galatBidang() { const g = galatPenempatan(k); if (aktif() && (k.bed_id !== awal.bed_id || k.kelas !== awal.kelas || k.indikator !== awal.indikator || k.tarif_id !== awal.tarif_id) && !k.alasan.trim()) g.alasan = RAWAT_INAP.galat.alasanPindah; return g; }
  function kecil(teks) { const el = document.createElement('span'); el.textContent = teks; Object.assign(el.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return el; }
  const alasan = bidang({ id: 'pn-alasan', label: P.alasan, jenis: 'textarea', maxLength: 300, ubah(v) { k = { ...k, alasan: v }; perbarui(); } });
  function perbarui() { const g = galatBidang(); for (const [nama, f] of controls) f.setGalat(dicoba ? g[nama] : undefined); alasan.setGalat(dicoba ? g.alasan : undefined); alasan.el.hidden = !(aktif() && (k.bed_id !== '' || k.kelas !== awal.kelas || k.indikator !== awal.indikator || k.tarif_id !== awal.tarif_id)); }
  function rekan() { bersama.replaceChildren(); const h = document.createElement('strong'); h.textContent = A.dpjpBersama; bersama.append(h); for (const d of (opsi?.dpjp ?? []).filter(d => String(d.id) !== k.dpjp_id)) bersama.append(KotakCentang({ id: `pn-bersama-${d.id}`, label: d.nama, checked: k.dpjp_bersama.includes(String(d.id)), onChange(e) { k = { ...k, dpjp_bersama: e.target.checked ? [...k.dpjp_bersama, String(d.id)] : k.dpjp_bersama.filter(x => x !== String(d.id)) }; rekan(); perbarui(); } })); bersama.append(kecil(P.dpjpPetunjuk)); const g = galatBidang(); if (dicoba && g.dpjp_bersama) bersama.append(peringatan(g.dpjp_bersama)); }
  function champ(nama, label, pilihan) { const f = bidang({ id: `pn-${nama}`, label, nilai: k[nama], opsi: pilihan, ubah(v) { k = { ...k, [nama]: v }; if (nama === 'dpjp_id') rekan(); perbarui(); } }); controls.set(nama, f); form.append(f.el); }
  function tampil() {
    form.replaceChildren(); controls.clear(); const sekarang = aktif(); form.append(kecil(sekarang ? `${P.sekarang}: ${[sekarang.ruang_nama, sekarang.bed_nama].filter(Boolean).join(' · ')} · ${KELAS_RAWAT.label(sekarang.kelas)}` : P.belumAda));
    champ('bed_id', P.bed, [{ nilai: '', label: sekarang ? P.tetap : A.bedMenunggu }, ...(opsi?.bed_kosong ?? []).map(b => ({ nilai: String(b.id), label: `${b.ruang_nama ? `${b.ruang_nama} · ` : ''}${b.nama}` }))]);
    champ('kelas', A.kelas, KELAS_RAWAT.nilai.map(n => ({ nilai: n, label: KELAS_RAWAT.label(n) }))); champ('indikator', A.indikator, INDIKATOR_KELAS.nilai.map(n => ({ nilai: n, label: INDIKATOR_KELAS.label(n) })));
    champ('tarif_id', A.tarif, [{ nilai: '', label: A.tarifTanpa }, ...(opsi?.tarif_kamar ?? []).map(t => ({ nilai: String(t.id), label: `${t.nama} (${rupiahAtau(t.harga_umum)})` }))]); alasan.kontrol.value = k.alasan; alasanWadah.replaceChildren(alasan.el); form.append(alasanWadah);
    champ('dpjp_id', A.dpjpUtama, (opsi?.dpjp ?? []).map(d => ({ nilai: String(d.id), label: `${d.nama}${d.profesi ? ` (${d.profesi})` : ''}` }))); bersama.setAttribute('role', 'group'); bersama.setAttribute('aria-label', A.dpjpBersama); rekan(); form.append(bersama); perbarui();
    riwayat.replaceChildren(); if (data?.penempatan.length) { const h = document.createElement('strong'); h.textContent = P.riwayat; riwayat.append(h); for (const x of [...data.penempatan].reverse()) riwayat.append(kecil(`${[x.ruang_nama, x.bed_nama].filter(Boolean).join(' · ')} · ${KELAS_RAWAT.label(x.kelas)} · ${INDIKATOR_KELAS.label(x.indikator)} · ${formatWaktu(x.mulai)}${x.selesai ? ` - ${formatWaktu(x.selesai)}` : ''}`)); }
  }
  async function kirim() { dicoba = true; perbarui(); rekan(); if (!data || proses || Object.keys(galatBidang()).length) return; proses = true; simpan.disabled = true; simpan.textContent = P.menyimpan; status.replaceChildren(); try { await ubahPenempatan(kunjunganId, bentukPenempatan(k)); if (!hidup) return; tersimpan = true; modal.isi.replaceChildren(peringatan(P.tersimpan, 'biru')); modal.aksi.replaceChildren(tombol(TOMBOL.tutup, tutup)); modal.setLebar('modalKecil'); } catch (e) { if (hidup) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : P.gagal)); } finally { proses = false; simpan.disabled = !data; simpan.textContent = P.simpan; } }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, form, riwayat); modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan); tampil(); modal.fokus();
  Promise.all([ambilRawatInap(kunjunganId), ambilOpsiRawatInap()]).then(([d, o]) => { if (!hidup) return; data = d; opsi = o; awal = awalPenempatan(d); k = { ...awal }; modal.konteks.replaceChildren(KepalaPasien({ nama: d.kunjungan.pasien_nama, nomorRm: d.kunjungan.pasien_nomor_rm })); tampil(); simpan.disabled = proses; }).catch(e => { if (hidup) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : P.gagal)); });
  return { tutup() { hidup = false; modal.tutup(); } };
}
