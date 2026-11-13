import { PencarianWilayah } from '../../komponen/pencarian-wilayah.js';
import { perbaikanPasienMasukan, punyaIzin, REGISTRASI } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { detailPasien, perbaikiPasien } from '../../api-klien/pasien.js';
import { TAB_EDIT_PASIEN, lokasiGalatEditPasien } from './keadaan-edit-pasien.js';
import { penggunaSaatIni } from '../../util/konteks-pengguna.js';
import { bagianDetailPasien } from './detail-pasien.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan, tab as buatTab } from '../../komponen/ui/primitif.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { token } from '../../gaya/token.js';

export function bukaEditPasien({ id, nama, onTutup, onSelesai }) {
  const { pengguna } = penggunaSaatIni();
  const boleh = !!pengguna && punyaIzin(pengguna, 'pasien', 'perbaikan');
  let data = null, pilihanTab = 'edit-identitas', waliAktif = 0, awal = '', sibuk = false, galat = '', galatBidang = {}, aktif = true, wilayah;
  const controls = new Map();
  function bersih() { aktif = false; wilayah?.tutup(); modal.tutup(); }
  const modal = bukaModal1({ lebar: 'modalBesar', judul: `${boleh ? 'Edit data pasien' : 'Data pasien'}: ${nama}`, onTutup() { if (!sibuk) { bersih(); onTutup(); } }, lindungiTutup: () => !!data && JSON.stringify(data) !== awal });
  const status = document.createElement('div'), nomor = document.createElement('p'), nav = document.createElement('div'), form = document.createElement('form'), fieldset = document.createElement('fieldset'), panel = document.createElement('div');
  nomor.style.margin = '0'; form.noValidate = true; fieldset.style.border = '0'; fieldset.style.padding = fieldset.style.margin = '0'; fieldset.style.minWidth = '0'; panel.setAttribute('role', 'tabpanel'); fieldset.append(panel); form.append(fieldset); modal.isi.append(status, nomor, nav, form);
  const tabs = buatTab(TAB_EDIT_PASIEN, pilihanTab, 'Bagian data pasien', pilihTab); nav.append(tabs.el);
  const sebelum = tombol('Sebelumnya', () => pilihTab(TAB_EDIT_PASIEN[indeksTab() - 1]?.id), 'sekunder');
  const berikut = tombol('Berikutnya', () => pilihTab(TAB_EDIT_PASIEN[indeksTab() + 1]?.id), 'sekunder');
  const simpan = tombol('Simpan perubahan', kirim); modal.aksi.append(sebelum, berikut, simpan);
  function indeksTab() { return TAB_EDIT_PASIEN.findIndex(t => t.id === pilihanTab); }
  function pilihTab(idTab) { if (sibuk || !idTab) return; pilihanTab = idTab; tampil(); }
  function statusSimpan() {
    fieldset.disabled = sibuk;
    sebelum.disabled = sibuk || indeksTab() === 0;
    berikut.disabled = sibuk; berikut.hidden = indeksTab() === TAB_EDIT_PASIEN.length - 1;
    simpan.disabled = sibuk || !data || JSON.stringify(data) === awal;
    simpan.textContent = sibuk ? 'Menyimpan…' : 'Simpan perubahan';
  }
  function pesan() { status.replaceChildren(); if (galat) status.append(peringatan(galat)); else if (!data) status.append('Memuat data pasien…'); }
  function ubah(perubahan) { data = { ...data, ...perubahan }; statusSimpan(); }
  function isian(key, label, maxLength = 200, jenis = 'text', wadah = panel) {
    const f = bidang({ id: `edit-pasien-${key}`, label, maxLength, jenis, nilai: String(data[key] ?? ''), autoComplete: 'off', ubah(v) {
      if (key === 'nik') { const nik = v.replace(/\D/g, ''); f.kontrol.value = nik; ubah({ nik: nik || null, ...(data.jalur_identitas === 'tanpa_identitas' && nik ? { jalur_identitas: 'nik' } : {}) }); }
      else ubah({ [key]: v });
    } }); f.setGalat(galatBidang[key]); controls.set(key, f); wadah.append(f.el); return f;
  }
  function ligne() { const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap' }); panel.append(el); return el; }
  function afficherWali() {
    const check = document.createElement('input'), label = document.createElement('label'); check.type = 'checkbox'; check.id = 'edit-pasien-tidak-cakap'; check.checked = data.tidak_cakap; label.htmlFor = check.id; label.append(check, REGISTRASI.tidakCakap); check.addEventListener('change', () => ubah({ tidak_cakap: check.checked })); panel.append(label);
    if (galatBidang.wali) panel.append(peringatan(galatBidang.wali));
    if (data.wali.length) {
      waliAktif = Math.min(waliAktif, data.wali.length - 1);
      const pilih = bidang({ id: 'edit-pilih-wali', label: 'Wali/keluarga yang diedit', nilai: String(waliAktif), opsi: data.wali.map((w, i) => ({ nilai: String(i), label: `${i + 1}. ${w.nama || 'Wali/keluarga baru'}` })), ubah(v) { waliAktif = Number(v); tampil(); } }); panel.append(pilih.el);
      const i = waliAktif, w = data.wali[i];
      for (const [key, label, maxLength] of [['nama','Nama wali/keluarga',200], ['hubungan','Hubungan',100], ['kontak','Nomor HP / kontak wali atau keluarga',100]]) {
        const f = bidang({ id: `edit-wali-${i}-${key}`, label, maxLength, nilai: w[key] ?? '', ubah(v) { ubah({ wali: data.wali.map((item, n) => n === i ? { ...item, [key]: v } : item) }); } }); f.setGalat(galatBidang[`wali.${i}.${key}`]); panel.append(f.el);
      }
      if (!w.id) panel.append(tombol('Batalkan tambahan wali', () => { ubah({ wali: data.wali.filter((_, n) => n !== i) }); waliAktif = Math.max(0, i - 1); tampil(); }, 'teks'));
    } else panel.append('Belum ada kontak wali/keluarga.');
    const tambah = tombol('Tambah wali/keluarga', () => { waliAktif = data.wali.length; ubah({ wali: [...data.wali, { id: 0, nama: '', hubungan: '', kontak: '' }] }); tampil(); }, 'sekunder'); tambah.disabled = data.wali.length >= 10; panel.append(tambah);
  }
  function tampil() {
    if (!aktif) return;
    wilayah?.tutup(); wilayah = undefined; controls.clear(); panel.replaceChildren(); pesan();
    nomor.hidden = nav.hidden = form.hidden = !data;
    for (const b of [sebelum, berikut, simpan]) b.hidden = !data || !boleh;
    if (!data) { statusSimpan(); return; }
    const strong = document.createElement('strong'); strong.textContent = data.nomor_rm; nomor.replaceChildren('Nomor RM: ', strong);
    nav.hidden = !boleh;
    if (!boleh) { panel.append(DaftarRingkasan({ bagian: bagianDetailPasien(data) })); return; }
    tabs.pilih(pilihanTab); panel.id = `panel-${pilihanTab}`; panel.setAttribute('aria-labelledby', `tab-${pilihanTab}`); Object.assign(panel.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
    if (pilihanTab === 'edit-identitas') {
      isian('nama','Nama pasien'); const row = ligne(); isian('tanggal_lahir','Tanggal lahir',10,'date',row);
      row.append(bidang({ id: 'edit-pasien-jk', label: 'Jenis kelamin', nilai: data.jenis_kelamin, opsi: [{ nilai: 'laki_laki', label: 'Laki-laki' },{ nilai: 'perempuan', label: 'Perempuan' }], ubah(v) { ubah({ jenis_kelamin: v }); } }).el);
      isian('nik','NIK',16); if (data.jalur_identitas === 'paspor') isian('nomor_paspor','Nomor paspor',50); if (data.jalur_identitas === 'kitas') isian('nomor_kitas','Nomor KITAS',50);
      isian('nomor_hp','Nomor HP pasien',40,'tel'); isian('agama','Agama',50); isian('pekerjaan','Pekerjaan',100); isian('pendidikan','Pendidikan',100); isian('status_kawin','Status perkawinan',50);
    } else if (pilihanTab === 'edit-pelengkap') {
      isian('tempat_lahir','Tempat lahir',100); isian('ibu_kandung','Nama ibu kandung');
      wilayah = PencarianWilayah({ id: 'edit-pasien-wilayah', value: data.kode_wilayah ?? '', galat: galatBidang.kode_wilayah, onChange(kode) { ubah({ kode_wilayah: kode || null }); } }); panel.append(wilayah);
      isian('suku','Suku',100); isian('bahasa','Bahasa',100);
    } else if (pilihanTab === 'edit-keluarga') afficherWali();
    else { isian('jkn_nomor_kartu',REGISTRASI.jknKartu,50); isian('asuransi_nama',REGISTRASI.asuransiNama,100); isian('asuransi_nomor_polis',REGISTRASI.asuransiPolis,50); }
    statusSimpan();
  }
  function tampilkanGalat(daftar) {
    galatBidang = daftar;
    const lokasi = lokasiGalatEditPasien(Object.keys(daftar)[0] ?? 'nama'); pilihanTab = lokasi.tab;
    if (lokasi.wali !== undefined) waliAktif = lokasi.wali;
    tampil(); panel.querySelector('[aria-invalid="true"]')?.focus();
  }
  async function kirim() {
    if (!boleh || !data || sibuk) return;
    const hasil = perbaikanPasienMasukan.safeParse({ ...data, wali: data.wali.map(({ id: waliId, ...w }) => ({ ...w, ...(waliId ? { id: waliId } : {}) })) });
    if (!hasil.success) { galat = 'Periksa isian yang ditandai.'; tampilkanGalat(Object.fromEntries(hasil.error.issues.map(i => [i.path.join('.'), i.message]))); return; }
    sibuk = true; galat = ''; galatBidang = {}; for (const f of controls.values()) f.setGalat(); pesan(); statusSimpan();
    try { await perbaikiPasien(id, hasil.data); if (aktif) { bersih(); onSelesai(); } }
    catch (e) { if (aktif) { galat = e instanceof Error ? e.message : 'Data pasien gagal disimpan.'; if (e instanceof GalatApi && e.rincian) tampilkanGalat(Object.fromEntries(e.rincian.map(r => [r.jalur, r.pesan]))); else pesan(); } }
    finally { sibuk = false; if (aktif) statusSimpan(); }
  }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); });
  tampil(); modal.fokus(); detailPasien(id).then(p => { if (aktif) { data = p; awal = JSON.stringify(p); tampil(); } }).catch(e => { if (aktif) { galat = e.message || 'Data pasien gagal dimuat.'; pesan(); } });
  return { tutup: bersih };
}
