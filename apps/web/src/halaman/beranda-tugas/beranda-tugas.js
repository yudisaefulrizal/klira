import { BERANDA, punyaIzin } from '@klira/shared';
import { ambilRingkasanPdp } from '../../api-klien/beranda.js';
import { GalatApi } from '../../api-klien/klien.js';
import { tugasPdp } from '../../util/tugas-beranda.js';
import { pasangKesiapan, lencanaBeranda } from '../../komponen/klinis/kesiapan-klinik.js';
import { teksHtml as aman } from '../../util/teks-html.js';

export function pasangBerandaTugas(wadah, pengguna, ganti) {
  let aktif = true;
  const bolehPdp = !!pengguna && punyaIzin(pengguna, 'pdp', 'lihat'), bolehSatusehat = !!pengguna && punyaIzin(pengguna, 'satusehat', 'lihat');
  wadah.innerHTML = `<h1 style="margin:0;font-size:24px;font-weight:600">${aman(BERANDA.judul)}</h1><div data-galat-beranda style="display:contents"></div><div data-kesiapan style="display:contents"></div><div data-tugas style="display:contents">${bolehPdp ? `<span class="beranda-redup">${aman(BERANDA.memuat)}</span>` : ''}</div>${bolehSatusehat ? `<div class="beranda-kartu"><div style="display:flex;flex-direction:column;gap:4px"><strong style="font-size:16px">${aman(BERANDA.satusehat.judul)}</strong><span class="beranda-redup">${aman(BERANDA.satusehat.info)}</span></div></div>` : ''}${!bolehPdp && !bolehSatusehat ? `<span class="beranda-redup">${aman(BERANDA.kosong)}</span>` : ''}`;
  const tutupKesiapan = pasangKesiapan(wadah.querySelector('[data-kesiapan]'), pengguna, 'kartu', ganti);
  if (bolehPdp) {
    ambilRingkasanPdp().then(r => {
      if (!aktif) return;
      const tugas = tugasPdp(r);
      wadah.querySelector('[data-tugas]').innerHTML = `<div class="beranda-kartu" aria-label="${aman(BERANDA.pdp.judul)}"><strong style="font-size:16px">${aman(BERANDA.pdp.judul)}</strong>${!tugas.length ? `<span class="beranda-redup">${aman(BERANDA.kosong)}</span>` : ''}${tugas.map(t => `<div class="beranda-baris"><span style="flex-grow:1">${aman(t.teks)}</span>${t.mendesak ? lencanaBeranda('!', 'merah') : ''}<button class="beranda-tombol" type="button" data-tab="${aman(t.tab)}">${aman(BERANDA.buka)}</button></div>`).join('')}</div>`;
    }).catch(e => {
      if (!aktif) return;
      wadah.querySelector('[data-galat-beranda]').innerHTML = `<div class="beranda-peringatan" role="alert">${aman(e instanceof GalatApi ? e.message : BERANDA.gagal)}</div>`;
      wadah.querySelector('[data-tugas]').replaceChildren();
    });
  }
  function klik(e) { const tombol = e.target.closest('[data-tab]'); if (tombol) ganti(`/pelindungan-data?tab=${tombol.dataset.tab}`); }
  wadah.addEventListener('click', klik);
  return () => { aktif = false; tutupKesiapan(); wadah.removeEventListener('click', klik); wadah.replaceChildren(); };
}
