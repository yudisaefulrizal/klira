import { DISPOSISI_PULANG, RAWAT_INAP, TOMBOL } from '@klira/shared';
import { pulangkanPasien } from '../../api-klien/rawat-inap.js';
import { pesanGalat } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { bidang, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { adaPerubahan } from '../../util/draf/draf.js';
import { navigasi } from '../../util/navigasi/navigasi.js';
import { KepalaPasien } from '../pasien/kepala-pasien.js';
import { awalPulang, bentukPulang, galatPulang } from './keadaan-rawat-inap.js';

export function bukaPemulanganRawatInap({ kunjunganId, pasien, onTutup, onSelesai }) {
  const P = RAWAT_INAP.pulang, awal = awalPulang();
  let k = { ...awal }, dicoba = false, proses = false, hasil = false, aktif = true;
  const controls = new Map();

  function tutup() { aktif = false; modal.tutup(); (hasil ? onSelesai : onTutup)(); }
  const modal = bukaModal1({
    judul: P.judul,
    lebar: 'modalBesar',
    onTutup: tutup,
    lindungiTutup: () => !hasil && adaPerubahan(awal, k),
  });
  modal.konteks.replaceChildren(KepalaPasien({ nama: pasien.nama, nomorRm: pasien.nomor_rm }));

  const status = document.createElement('div'), form = document.createElement('form');
  form.noValidate = true;
  Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const simpan = tombol(P.simpan, kirim);
  modal.isi.append(status, form);
  modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan);

  function perbarui() {
    const g = galatPulang(k);
    for (const [nama, f] of controls) f.setGalat(dicoba ? g[nama] : undefined);
    simpan.disabled = proses;
    simpan.textContent = proses ? P.menyimpan : P.simpan;
  }

  function champ(wadah, nama, label, jenis = 'text', maxLength, opsi) {
    const f = bidang({
      id: `pul-${nama}`, label, jenis, maxLength, opsi, nilai: k[nama], autoComplete: 'off',
      ubah(v) { k = { ...k, [nama]: v }; perbarui(); },
    });
    controls.set(nama, f);
    wadah.append(f.el);
  }

  champ(form, 'ringkasan', P.ringkasan, 'textarea', 3000);
  champ(form, 'terapi', `${P.terapi} (opsional)`, 'textarea', 1000);
  champ(form, 'diagnosis_akhir', P.diagnosis);

  const barisKondisi = document.createElement('div');
  Object.assign(barisKondisi.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: token.jarak.md });
  champ(barisKondisi, 'disposisi', P.disposisi, 'text', undefined, DISPOSISI_PULANG.nilai.map((v) => ({ nilai: v, label: DISPOSISI_PULANG.label(v) })));
  champ(barisKondisi, 'kondisi_pulang', P.kondisi);
  form.append(barisKondisi);

  champ(form, 'tindak_lanjut', `${P.tindak} (opsional)`, 'textarea', 1000);
  form.append(KotakCentang({
    id: 'pul-resume',
    label: P.buatResume,
    keterangan: P.buatResumePetunjuk,
    checked: k.buat_resume,
    onChange(e) { k = { ...k, buat_resume: e.target.checked }; },
  }));

  const info = document.createElement('small');
  info.textContent = P.info;
  info.style.color = token.warna.teksRedup;
  form.append(info);

  async function kirim() {
    dicoba = true; perbarui();
    if (proses || Object.keys(galatPulang(k)).length) return;
    proses = true; status.replaceChildren(); perbarui();
    try {
      const h = await pulangkanPasien(kunjunganId, bentukPulang(k));
      if (!aktif) return;
      hasil = true;
      modal.isi.replaceChildren(peringatan(P.hasilPesan(h.tagihan_kamar, h.resume_dibuat), 'hijau'));
      const aksi = [tombol(TOMBOL.tutup, tutup, pasien?.pasien_id ? 'sekunder' : undefined)];
      if (pasien?.pasien_id) {
        aksi.push(tombol('Buka Kasir / Penutup', () => {
          const pId = pasien.pasien_id;
          tutup();
          navigasi.pindah(`/pasien?tab=pasien&pasien=${pId}&kunjungan=${kunjunganId}&bagian=penutup`);
        }));
      }
      modal.aksi.replaceChildren(...aksi);
      modal.setLebar('modalKecil');
    } catch (e) {
      if (aktif) status.replaceChildren(peringatan(pesanGalat(e, P.gagal)));
    } finally {
      proses = false;
      if (aktif && !hasil) perbarui();
    }
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); void kirim(); });
  perbarui(); modal.fokus();
  return { tutup() { aktif = false; modal.tutup(); } };
}
