import { MASTER } from '@klira/shared';
import { cariTerminologi } from '../../api-klien/klinis.js';
import { buatMaster, opsiMaster, ubahMaster } from '../../api-klien/master.js';
import { GalatApi } from '../../api-klien/klien.js';
import { PencarianKode } from '../../komponen/pencarian-kode/pencarian-kode.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { InfoBantuan } from '../../komponen/ui/info-bantuan.js';
import { awalMaster, bentukMasukan, bidangAktif, bidangTampil, galatMaster, masterBerubah, opsiDenganNilaiSaatIni, petunjukSaatIni, wajibSaatIni } from './keadaan-master.js';
const JENIS_ISIAN = { teks: 'text', angka: 'number', tanggal: 'date', waktu: 'time' };
const P = MASTER.petunjuk;
export function bukaModalMasterProfil({ jenis, baris, onTutup, onSelesai }) {
  const ubah = baris !== undefined, definisi = bidangTampil(jenis, ubah), awal = awalMaster(jenis, baris), nilai = { ...awal }, opsi = {}, controls = new Map();
  let dicoba = false, memproses = false, aktif = true;
  const judulJenis = MASTER.jenis[jenis], modal = bukaModal1({ judul: ubah ? MASTER.judulUbah(judulJenis) : MASTER.judulTambah(judulJenis), lebar: 'modalSedang', onTutup, lindungiTutup: () => masterBerubah(awal, nilai) });
  const pesan = document.createElement('div'), form = document.createElement('form'); pesan.style.display = 'contents'; form.id = 'bentuk-master'; form.noValidate = true; Object.assign(form.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: token.jarak.md, rowGap: token.jarak.md }); modal.isi.append(pesan, form);
  const simpan = tombol(MASTER.simpan); simpan.type = 'submit'; simpan.setAttribute('form', form.id); modal.aksi.append(tombol(MASTER.batal, onTutup, 'sekunder'), simpan);
  function atur(kunci, v) { nilai[kunci] = v; perbarui(); }
  for (const b of definisi) {
    const id = `master-${b.kunci}`;
    if (b.tipe === 'icd9cm') {
      let nama = null;
      const el = document.createElement('div'), label = document.createElement('strong'), selected = document.createElement('span'), hint = document.createElement('small'), error = document.createElement('span');
      Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm, gridColumn: '1 / -1' }); label.textContent = b.label; selected.setAttribute('role', 'status'); hint.style.color = token.warna.teksRedup; error.id = `${id}-galat`; error.setAttribute('role', 'alert'); Object.assign(error.style, { color: token.warna.status.merah.teks, fontSize: token.huruf.ukuran.kecil });
      const picker = PencarianKode({ id, label: nilai[b.kunci] ? P.icd9Ganti : P.icd9Cari, petunjuk: P.icd9Petunjuk, cari: q => cariTerminologi('icd9cm', q), kamus: { judul: 'Kamus ICD-9-CM', sistem: 'icd9cm' }, onPilih(k) { nama = k.nama; atur(b.kunci, k.kode); } });
      el.append(label, selected, picker, hint, error); form.append(el);
      controls.set(b.kunci, { el, display: 'flex', tutup: () => picker.tutup(), perbarui(g) { selected.hidden = !nilai[b.kunci]; selected.textContent = nilai[b.kunci] ? `${P.icd9Terpilih(nilai[b.kunci])}${nama ? ` · ${nama}` : ''}` : ''; const petunjuk = petunjukSaatIni(b, nilai); hint.hidden = !petunjuk; hint.textContent = petunjuk ?? ''; error.hidden = !g; error.textContent = g ?? ''; } }); continue;
    }
    const pilihan = b.tipe === 'pilihan' || b.tipe === 'rujukan';
    const f = bidang({ id, label: b.label, nilai: nilai[b.kunci] ?? '', jenis: JENIS_ISIAN[b.tipe], maxLength: b.maks, ...(pilihan ? { opsi: [] } : {}), ubah: v => atur(b.kunci, v) });
    if (b.tipe === 'angka') { f.kontrol.min = '0'; f.kontrol.step = '1'; f.kontrol.inputMode = 'numeric'; }
    const label = f.el.querySelector('label'), labelRow = document.createElement('div'); Object.assign(labelRow.style, { display: 'flex', alignItems: 'center', gap: token.jarak.xs }); label.replaceWith(labelRow); labelRow.append(label);
    let info, petunjukLama;
    controls.set(b.kunci, { el: f.el, display: 'flex', tutup() { info?.tutup?.(); }, perbarui(g) {
      const wajib = wajibSaatIni(b, nilai), petunjuk = petunjukSaatIni(b, nilai); f.kontrol.setAttribute('aria-required', String(wajib)); f.setGalat(g);
      if (petunjuk !== petunjukLama) { info?.tutup?.(); info?.remove(); info = undefined; petunjukLama = petunjuk; if (petunjuk) { info = InfoBantuan({ label: b.label, children: petunjuk }); labelRow.append(info); } }
      if (pilihan) {
        const dasar = b.tipe === 'pilihan' ? [...(b.opsi ?? [])] : opsiDenganNilaiSaatIni(opsi[b.rujukan] ?? [], b.kunci, baris), semua = b.tipe === 'rujukan' ? [{ nilai: '', label: wajib ? MASTER.pilih : MASTER.tanpaPilihan }, ...dasar] : dasar;
        f.kontrol.replaceChildren(...semua.map(o => { const option = document.createElement('option'); option.value = o.nilai; option.textContent = o.label; return option; }));
      }
      f.kontrol.value = nilai[b.kunci] ?? '';
    } }); form.append(f.el);
  }
  function perbarui() {
    const g = galatMaster(jenis, nilai, ubah), keys = new Set(bidangAktif(jenis, ubah, nilai).map(b => b.kunci));
    for (const [kunci, control] of controls) { control.el.style.display = keys.has(kunci) ? control.display : 'none'; control.perbarui(dicoba ? g[kunci] : undefined); }
    simpan.disabled = memproses || ubah && !masterBerubah(awal, nilai); simpan.textContent = memproses ? MASTER.menyimpan : MASTER.simpan;
  }
  form.addEventListener('submit', async e => {
    e.preventDefault(); dicoba = true; perbarui(); if (memproses || Object.keys(galatMaster(jenis, nilai, ubah)).length || ubah && !masterBerubah(awal, nilai)) return;
    memproses = true; pesan.replaceChildren(); perbarui();
    try { const masukan = bentukMasukan(jenis, nilai, ubah); if (baris) await ubahMaster(jenis, baris.id, masukan); else await buatMaster(jenis, masukan); if (aktif) onSelesai(); }
    catch (e) { if (aktif) { pesan.append(peringatan(e instanceof GalatApi ? e.message : MASTER.gagalSimpan)); memproses = false; perbarui(); } }
  });
  for (const sumber of new Set(definisi.flatMap(b => b.rujukan ? [b.rujukan] : []))) opsiMaster(sumber).then(o => { if (aktif) { opsi[sumber] = o; perbarui(); } }).catch(e => { if (aktif) pesan.replaceChildren(peringatan(e instanceof GalatApi ? e.message : MASTER.gagalMuatPilihan)); });
  perbarui(); modal.fokus(); return () => { aktif = false; for (const c of controls.values()) c.tutup(); modal.tutup(); };
}
