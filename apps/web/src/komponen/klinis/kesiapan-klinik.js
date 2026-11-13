import { BERANDA, punyaIzin } from '@klira/shared';
import { ambilKesiapan } from '../../api-klien/beranda.js';
import { teksHtml as aman } from '../../util/teks-html.js';
const K = BERANDA.kesiapan;
const TUJUAN = { poli: '/pasien?tab=poli', praktisi: '/pasien?tab=praktisi', jadwal: '/pasien?tab=jadwal', tarif: '/kasir-klaim?tab=tarif', obat: '/farmasi', pemeriksaan: '/penunjang?tab=master', pemeriksaan_tanpa_tarif: '/penunjang?tab=master', sip_kedaluwarsa: '/pasien?tab=praktisi' };
export function lencanaBeranda(teks, warna) {
  return `<span style="display:inline-block;padding:4px 8px;border-radius:999px;background:var(--status-${warna}-latar);color:var(--status-${warna}-teks);font-size:12px;font-weight:600">${aman(teks)}</span>`;
}
export function pasangKesiapan(wadah, pengguna, mode, ganti) {
  let aktif = true;
  function klik(e) { const tombol = e.target.closest('[data-tujuan]'); if (tombol) ganti(tombol.dataset.tujuan); }
  wadah.addEventListener('click', klik);
  if (pengguna && punyaIzin(pengguna, 'master', 'lihat')) {
    ambilKesiapan().then(data => {
      if (!aktif) return;
      const kurang = data.item.filter(i => !i.ok);
      if (mode === 'spanduk') {
        wadah.innerHTML = kurang.length ? `<div class="beranda-peringatan beranda-kuning" role="alert"><div class="beranda-baris" style="gap:8px"><span style="flex-grow:1">${aman(K.spanduk(kurang.length))}</span><button class="beranda-tombol" type="button" data-tujuan="/beranda">${aman(K.lihat)}</button></div></div>` : '';
        return;
      }
      const wajib = data.item.filter(i => !i.peringatan), siap = wajib.filter(i => i.ok).length;
      const tampil = [...wajib, ...data.item.filter(i => i.peringatan && !i.ok)];
      wadah.innerHTML = `<div class="beranda-kartu" aria-label="${aman(K.judul)}"><div class="beranda-baris"><strong style="font-size:16px;flex-grow:1">${aman(K.judul)}</strong>${lencanaBeranda(K.ringkasan(siap, wajib.length), siap === wajib.length ? 'hijau' : 'kuning')}</div>${!kurang.length ? `<span class="beranda-redup">${aman(K.semuaSiap)}</span>` : ''}${tampil.map(i => {
        const item = K.item[i.kunci], label = typeof item.label === 'function' ? item.label(i.jumlah) : item.label;
        return `<div class="beranda-baris"><div style="display:flex;flex-direction:column;gap:4px;flex-grow:1"><span>${aman(label)}${!i.peringatan ? `<span class="beranda-redup"> (${aman(i.jumlah)})</span>` : ''}</span>${!i.ok ? `<span class="beranda-redup" style="font-size:12px">${aman(item.petunjuk)}</span>` : ''}</div>${lencanaBeranda(i.ok ? 'Siap' : i.peringatan ? '!' : 'Belum', i.ok ? 'hijau' : i.peringatan ? 'merah' : 'kuning')}<button class="beranda-tombol" type="button" data-tujuan="${TUJUAN[i.kunci]}">${aman(K.atur)}</button></div>`;
      }).join('')}</div>`;
    }).catch(() => { if (aktif && mode === 'kartu') wadah.innerHTML = `<div class="beranda-peringatan" role="alert">${aman(K.gagal)}</div>`; });
  }
  return () => { aktif = false; wadah.removeEventListener('click', klik); wadah.replaceChildren(); };
}
