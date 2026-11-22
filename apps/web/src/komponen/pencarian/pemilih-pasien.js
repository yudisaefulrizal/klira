import { REKAM_MEDIS } from '@klira/shared';
import { daftarPasien, detailPasien } from '../../api-klien/pasien.js';
import { buatNilaiTertunda } from '../../util/tunda.js';
import { bidang } from '../ui/primitif.js';
import { token } from '../../gaya/token.js';

const D = REKAM_MEDIS.dok;

export function PemilihPasien(awal) {
  let props = awal, hasil = [], tertunda = '', aktif = true, versi = 0, terbuka = false;
  let labelTerpilih = awal.pasienLabel ?? '';
  const el = document.createElement('div');
  Object.assign(el.style, { position: 'relative', display: 'flex', flexDirection: 'column', gap: token.jarak.xs });

  const cari = bidang({
    id: awal.id,
    label: D.pasienLabel,
    jenis: 'search',
    autoComplete: 'off',
    nilai: labelTerpilih,
    ubah(nilai) {
      const q = nilai.trim();
      if (props.pasienId !== null && q !== labelTerpilih) {
        labelTerpilih = '';
        props = { ...props, pasienId: null };
        props.onPilih(null, null);
      }
      if (!q) {
        hasil = []; tertunda = ''; terbuka = false; lukisDaftar();
        return;
      }
      terbuka = true;
      tunda.ubah(q);
    },
  });
  cari.kontrol.placeholder = D.pasienCari;

  const daftar = document.createElement('div');
  Object.assign(daftar.style, {
    display: 'none',
    flexDirection: 'column',
    border: `${token.ukuran.garis} solid ${token.warna.garis}`,
    borderRadius: token.radius.sedang,
    background: token.warna.permukaan,
    maxHeight: '220px',
    overflowY: 'auto',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.14)',
  });

  const tunda = buatNilaiTertunda(async (q) => {
    tertunda = q;
    const saat = ++versi;
    if (!q) { hasil = []; lukisDaftar(); return; }
    try {
      const h = await daftarPasien({ cari: q, halaman: 1, ukuran: 10 });
      if (aktif && saat === versi) { hasil = h.data; lukisDaftar(); }
    } catch {
      if (aktif && saat === versi) { hasil = []; lukisDaftar(); }
    }
  }, 250);

  function lukisDaftar() {
    daftar.replaceChildren();
    cari.setGalat(props.galat);
    if (!terbuka || !tertunda) { daftar.style.display = 'none'; return; }
    daftar.style.display = 'flex';
    if (!hasil.length) {
      const kosong = document.createElement('div');
      kosong.textContent = D.pasienKosong;
      Object.assign(kosong.style, { padding: `${token.jarak.sm} ${token.jarak.md}`, fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup });
      daftar.append(kosong);
      return;
    }
    for (const p of hasil) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${p.nama} (${p.nomor_rm})`;
      Object.assign(btn.style, {
        textAlign: 'left',
        padding: `${token.jarak.sm} ${token.jarak.md}`,
        border: '0',
        borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        fontSize: token.huruf.ukuran.kecil,
      });
      btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(13, 148, 136, 0.12)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
      btn.addEventListener('click', () => {
        labelTerpilih = `${p.nama} (${p.nomor_rm})`;
        cari.kontrol.value = labelTerpilih;
        terbuka = false;
        props = { ...props, pasienId: p.id };
        lukisDaftar();
        props.onPilih(p.id, p);
      });
      daftar.append(btn);
    }
  }

  cari.kontrol.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && terbuka) { e.stopPropagation(); terbuka = false; lukisDaftar(); }
  });

  if (awal.pasienId !== null && !labelTerpilih) {
    detailPasien(awal.pasienId).then((p) => {
      if (!aktif || props.pasienId !== awal.pasienId) return;
      labelTerpilih = `${p.nama} (${p.nomor_rm})`;
      cari.kontrol.value = labelTerpilih;
    }).catch(() => {});
  }

  el.append(cari.el, daftar);
  lukisDaftar();
  el.perbarui = (baru) => {
    props = { ...props, ...baru };
    if (baru.pasienLabel !== undefined) { labelTerpilih = baru.pasienLabel; cari.kontrol.value = labelTerpilih; }
    lukisDaftar();
  };
  el.tutup = () => { aktif = false; versi++; tunda.tutup(); };
  return el;
}
