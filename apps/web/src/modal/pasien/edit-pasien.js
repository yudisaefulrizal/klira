import { PencarianWilayah } from '../../komponen/pencarian/pencarian-wilayah.js';
import { perbaikanPasienMasukan, punyaIzin, REGISTRASI } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { detailPasien, perbaikiPasien } from '../../api-klien/pasien.js';
import { lokasiGalatEditPasien } from './keadaan-edit-pasien.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { bagianDetailPasien } from './detail-pasien.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { token } from '../../gaya/token.js';
import { barisFleks } from '../../gaya/tata-letak.js';

export function bukaEditPasien({ id, nama, nomor_rm: nomorAwal, onTutup, onSelesai }) {
  const { pengguna } = penggunaSaatIni();
  const boleh = !!pengguna && punyaIzin(pengguna, 'pasien', 'perbaikan');
  let data = null, waliAktif = 0, awal = '', sibuk = false, galat = '', galatBidang = {}, aktif = true, wilayah;
  const controls = new Map();
  function bersih() { aktif = false; wilayah?.tutup(); modal.tutup(); }
  // Nomor RM ada di judul, setelah nama dan tanda |; dari data pasien begitu dimuat (sebelumnya dari yang diteruskan pemanggil).
  const judul = () => [`${boleh ? 'Edit data pasien' : 'Data pasien'}: ${nama}`, data?.nomor_rm ?? nomorAwal].filter(Boolean).join(' | ');
  const modal = bukaModal1({ lebar: 'modalBesar', judul: judul(), onTutup() { if (!sibuk) { bersih(); onTutup(); } }, lindungiTutup: () => !!data && JSON.stringify(data) !== awal });
  const status = document.createElement('div'), form = document.createElement('form'), fieldset = document.createElement('fieldset'), panel = document.createElement('div');
  form.noValidate = true; fieldset.style.border = '0'; fieldset.style.padding = fieldset.style.margin = '0'; fieldset.style.minWidth = '0'; fieldset.append(panel); form.append(fieldset); modal.isi.append(status, form);
  const simpan = tombol('Simpan perubahan', kirim); modal.aksi.append(simpan);
  function statusSimpan() {
    fieldset.disabled = sibuk;
    simpan.disabled = sibuk || !data || JSON.stringify(data) === awal;
    simpan.textContent = sibuk ? 'Menyimpan…' : 'Simpan perubahan';
  }
  function pesan() { status.replaceChildren(); if (galat) status.append(peringatan(galat)); else if (!data) status.append('Memuat data pasien…'); }
  function ubah(perubahan) { data = { ...data, ...perubahan }; statusSimpan(); }
  function isian(key, label, maxLength = 200, jenis = 'text', wadah = panel) {
    const f = bidang({ id: `edit-pasien-${key}`, label, maxLength, jenis, nilai: String(data[key] ?? ''), autoComplete: 'off', ubah(v) {
      if (key === 'nik') { const nik = v.replace(/\D/g, ''); f.kontrol.value = nik; ubah({ nik: nik || null, ...(data.jalur_identitas === 'tanpa_identitas' && nik ? { jalur_identitas: 'nik' } : {}) }); }
      else ubah({ [key]: v });
    } }); f.setGalat(galatBidang[key]); controls.set(key, f); if (wadah.dataset.baris) f.el.style.flex = '1 1 140px'; wadah.append(f.el); return f;
  }
  function ligne(wadah = panel) { const el = document.createElement('div'); el.dataset.baris = '1'; barisFleks(el, 'md', { bungkus: true }); wadah.append(el); return el; }
  function kolom(wadah) { const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md, minWidth: '0' }); wadah.append(el); return el; }
  function afficherWali(wadah = panel) {
    const check = document.createElement('input'), label = document.createElement('label'); check.type = 'checkbox'; check.id = 'edit-pasien-tidak-cakap'; check.checked = data.tidak_cakap; label.htmlFor = check.id; label.append(check, REGISTRASI.tidakCakap); check.addEventListener('change', () => ubah({ tidak_cakap: check.checked })); wadah.append(label);
    if (galatBidang.wali) wadah.append(peringatan(galatBidang.wali));
    if (data.wali.length) {
      waliAktif = Math.min(waliAktif, data.wali.length - 1);
      const pilih = bidang({ id: 'edit-pilih-wali', label: 'Wali/keluarga yang diedit', nilai: String(waliAktif), opsi: data.wali.map((w, i) => ({ nilai: String(i), label: `${i + 1}. ${w.nama || 'Wali/keluarga baru'}` })), ubah(v) { waliAktif = Number(v); tampil(); } }); wadah.append(pilih.el);
      const i = waliAktif, w = data.wali[i];
      for (const [key, label, maxLength] of [['nama','Nama wali/keluarga',200], ['hubungan','Hubungan',100], ['kontak','Nomor HP / kontak wali atau keluarga',100]]) {
        const f = bidang({ id: `edit-wali-${i}-${key}`, label, maxLength, nilai: w[key] ?? '', ubah(v) { ubah({ wali: data.wali.map((item, n) => n === i ? { ...item, [key]: v } : item) }); } }); f.setGalat(galatBidang[`wali.${i}.${key}`]); wadah.append(f.el);
      }
      if (!w.id) wadah.append(tombol('Batalkan tambahan wali', () => { ubah({ wali: data.wali.filter((_, n) => n !== i) }); waliAktif = Math.max(0, i - 1); tampil(); }, 'teks'));
    } else wadah.append('Belum ada kontak wali/keluarga.');
    const tambah = tombol('Tambah wali/keluarga', () => { waliAktif = data.wali.length; ubah({ wali: [...data.wali, { id: 0, nama: '', hubungan: '', kontak: '' }] }); tampil(); }, 'sekunder'); tambah.disabled = data.wali.length >= 10; wadah.append(tambah);
  }
  function tampil() {
    if (!aktif) return;
    wilayah?.tutup(); wilayah = undefined; controls.clear(); panel.replaceChildren(); pesan();
    form.hidden = !data; modal.judul.textContent = judul();
    simpan.hidden = !data || !boleh;
    if (!data) { statusSimpan(); return; }
    if (!boleh) { panel.append(DaftarRingkasan({ bagian: bagianDetailPasien(data) })); return; }
    // Satu formulir dua kolom tanpa tab atau judul bagian: identitas di kiri; alamat, suku/bahasa, penjamin, dan wali/keluarga di kanan.
    Object.assign(panel.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: `${token.jarak.lg} calc(${token.jarak.lg} * 2)`, alignItems: 'start' });
    const kiri = kolom(panel), kanan = kolom(panel);
    isian('nama','Nama pasien',200,'text',kiri); const row = ligne(kiri); isian('tanggal_lahir','Tanggal lahir',10,'date',row);
    const jk = bidang({ id: 'edit-pasien-jk', label: 'Jenis kelamin', nilai: data.jenis_kelamin, opsi: [{ nilai: 'laki_laki', label: 'Laki-laki' },{ nilai: 'perempuan', label: 'Perempuan' }], ubah(v) { ubah({ jenis_kelamin: v }); } }); jk.el.style.flex = '1 1 140px'; row.append(jk.el);
    isian('nik','NIK',16,'text',kiri); if (data.jalur_identitas === 'paspor') isian('nomor_paspor','Nomor paspor',50,'text',kiri); if (data.jalur_identitas === 'kitas') isian('nomor_kitas','Nomor KITAS',50,'text',kiri);
    isian('nomor_hp','Nomor HP pasien',40,'tel',kiri);
    const baris1 = ligne(kiri); isian('tempat_lahir','Tempat lahir',100,'text',baris1); isian('ibu_kandung','Nama ibu kandung',200,'text',baris1);
    const baris2 = ligne(kiri); isian('agama','Agama',50,'text',baris2); isian('status_kawin','Status perkawinan',50,'text',baris2);
    const baris3 = ligne(kiri); isian('pekerjaan','Pekerjaan',100,'text',baris3); isian('pendidikan','Pendidikan',100,'text',baris3);
    wilayah = PencarianWilayah({ id: 'edit-pasien-wilayah', value: data.kode_wilayah ?? '', galat: galatBidang.kode_wilayah, onChange(kode) { ubah({ kode_wilayah: kode || null }); } }); kanan.append(wilayah);
    const baris4 = ligne(kanan); isian('suku','Suku',100,'text',baris4); isian('bahasa','Bahasa',100,'text',baris4);
    isian('jkn_nomor_kartu',REGISTRASI.jknKartu,50,'text',kanan); isian('asuransi_nama',REGISTRASI.asuransiNama,100,'text',kanan); isian('asuransi_nomor_polis',REGISTRASI.asuransiPolis,50,'text',kanan);
    afficherWali(kanan);
    statusSimpan();
  }
  function tampilkanGalat(daftar) {
    galatBidang = daftar;
    const lokasi = lokasiGalatEditPasien(Object.keys(daftar)[0] ?? 'nama');
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
