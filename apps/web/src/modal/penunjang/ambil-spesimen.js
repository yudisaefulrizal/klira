import { PENUNJANG, PRIORITAS_ORDER, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { ambilSpesimen, ordersKunjungan } from '../../api-klien/penunjang.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { KepalaPasien } from '../pasien/kepala-pasien.js';
import { awalSpesimen, bentukSpesimen, galatSpesimen, gantiOrderSpesimen, menungguSpesimen } from './keadaan-spesimen.js';

export function bukaAmbilSpesimen({ kunjunganId, pasien, onTutup, onSelesai }) {
  const S = PENUNJANG.spesimen, { pengguna } = penggunaSaatIni();
  let orders, k, awal, dicoba = false, sibuk = false, tercatat = false, selesai = false, aktif = true;
  function tutup() { aktif = false; modal.tutup(); (tercatat ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: S.judul, onTutup: tutup, lindungiTutup: () => !selesai && !!k && !!awal && adaPerubahan(awal, k) });
  modal.konteks.append(KepalaPasien({ nama: pasien.nama, nomorRm: pasien.nomor_rm }));
  const status = document.createElement('div'), isi = document.createElement('div'), form = document.createElement('form'), pilihan = document.createElement('div'), galatPilihan = document.createElement('div');
  for (const el of [isi, form, pilihan]) Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  pilihan.setAttribute('role', 'group'); pilihan.setAttribute('aria-label', S.pilihOrder); form.noValidate = true;
  const asal = bidang({ id: 'spesimen-asal', label: S.asal, autoComplete: 'off', ubah(nilai) { k = { ...k, asal: nilai }; tampilGalat(); } });
  const waktu = bidang({ id: 'spesimen-waktu', label: S.waktu, jenis: 'datetime-local', ubah(nilai) { k = { ...k, waktu: nilai }; tampilGalat(); } });
  const petugas = bidang({ id: 'spesimen-petugas', label: S.petugas, nilai: pengguna ? `${pengguna.nama} (${S.petugasSaya})` : S.petugasSaya }); petugas.kontrol.readOnly = true;
  const petunjuk = document.createElement('span'); petunjuk.textContent = S.asalPetunjuk; Object.assign(petunjuk.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
  const baris = document.createElement('div'); Object.assign(baris.style, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap' }); baris.append(waktu.el, petugas.el);
  form.append(pilihan, galatPilihan, asal.el, petunjuk, baris);
  const simpan = tombol(S.simpan, kirim); simpan.disabled = true;
  modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan); modal.isi.append(status, isi);
  function tampilGalat() { const g = k ? galatSpesimen(k) : {}; asal.setGalat(dicoba ? g.asal : undefined); waktu.setGalat(dicoba ? g.waktu : undefined); galatPilihan.replaceChildren(); if (dicoba && g.terpilih) galatPilihan.append(peringatan(g.terpilih)); }
  function tampil() {
    isi.replaceChildren(); pilihan.replaceChildren(); const menunggu = orders ? menungguSpesimen(orders) : [];
    simpan.disabled = sibuk || !menunggu.length;
    if (!orders) { isi.append(PENUNJANG.memuat); return; }
    if (!menunggu.length) { isi.append(peringatan(S.kosong, 'biru')); return; }
    const h = document.createElement('strong'); h.textContent = S.pilihOrder; pilihan.append(h);
    for (const o of menunggu) pilihan.append(KotakCentang({ id: `spesimen-${o.id}`, label: o.nama, keterangan: [PRIORITAS_ORDER.label(o.prioritas), o.jenis_spesimen].filter(Boolean).join(' · '), checked: k.terpilih.includes(o.id), onChange() { k = gantiOrderSpesimen(k, orders, o.id); tampil(); } }));
    asal.kontrol.value = k.asal; waktu.kontrol.value = k.waktu; isi.append(form); tampilGalat();
  }
  async function kirim() {
    if (!k || !orders || sibuk) return; dicoba = true; tampilGalat(); if (Object.keys(galatSpesimen(k)).length) return;
    sibuk = true; simpan.disabled = true; simpan.textContent = S.menyimpan; status.replaceChildren(); let jumlah = 0;
    try {
      for (const id of k.terpilih) { await ambilSpesimen(id, bentukSpesimen(k)); jumlah++; tercatat = true; }
      if (!aktif) return; selesai = true; modal.isi.replaceChildren(S.tersimpan(jumlah)); modal.aksi.replaceChildren(tombol(TOMBOL.tutup, tutup)); modal.setLebar('modalKecil');
    } catch (e) {
      if (!aktif) return; status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : S.gagal));
      try { const o = await ordersKunjungan(kunjunganId); if (aktif) { orders = o; k = { ...awalSpesimen(o), asal: k.asal, waktu: k.waktu }; tampil(); } } catch {}
    } finally { sibuk = false; simpan.textContent = S.simpan; simpan.disabled = !orders || !menungguSpesimen(orders).length; }
  }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); tampil(); modal.fokus();
  ordersKunjungan(kunjunganId).then(o => { if (!aktif) return; orders = o; awal = awalSpesimen(o); k = { ...awal }; tampil(); }).catch(e => { if (aktif) { isi.replaceChildren(); status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : PENUNJANG.order.gagalMuat)); } });
  return { tutup() { aktif = false; modal.tutup(); } };
}
