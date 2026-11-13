import { punyaIzin } from '@klira/shared';
import { sesiPengguna } from '../../util/konteks-pengguna.js';
import { navigasi } from '../../util/navigasi.js';
/** Lifecycle percakapan per kanal: API, websocket, draf, pagination, notifikasi, dan pergantian pengguna. */
export function buatSesiPesan(kanal, { percakapanWa, ringkasanWa }) {
  let keadaan = awal(), halaman = 1, generasi = 0, identitas, boleh = false, putus, lepasSesi, lepasNavigasi, timerNotifikasi;
  const pendengar = new Set();
  function awal() { return { revisi: 0, sambungan: 'menghubungkan', terbuka: false, aktif: null, pasien: null, daftar: [], adaLagi: false, belum: 0, pemberitahuan: false, galat: '', draf: {} }; }
  function beri() { pendengar.forEach(f => f()); }
  const terlihat = () => keadaan.terbuka || navigasi.potret().path === '/pesan';
  async function muat() {
    if (!boleh) return; const saat = generasi, pengguna = identitas;
    try { const bagian = await Promise.all(Array.from({ length: halaman }, (_, i) => percakapanWa(i + 1))); if (!boleh || saat !== generasi || pengguna !== identitas) return; keadaan.daftar = bagian.flat(); keadaan.adaLagi = bagian.at(-1)?.length === 200; keadaan.galat = ''; beri(); }
    catch (e) { if (saat === generasi && pengguna === identitas) { keadaan.galat = e instanceof Error ? e.message : 'Gagal memuat pesan'; beri(); } }
  }
  async function ringkas() { const saat = generasi; try { const hasil = await ringkasanWa(); if (boleh && saat === generasi) { keadaan.belum = hasil.belum_dibaca; beri(); } } catch { /* Rincian galat mengikuti panel. */ } }
  function refresh() { void ringkas(); keadaan.revisi++; beri(); if (terlihat()) void muat(); }
  function resetPesan() { generasi++; halaman = 1; keadaan = { ...awal(), revisi: keadaan.revisi + 1, sambungan: keadaan.sambungan, terbuka: keadaan.terbuka, pasien: keadaan.pasien }; beri(); if (boleh && terlihat()) void muat(); }
  function sambungkan() {
    let hidup = true, socket, timer, percobaan = 0;
    function hubungkan() {
      if (!hidup) return; keadaan.sambungan = 'menghubungkan'; beri();
      const protokol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'; socket = new WebSocket(`${protokol}//${window.location.host}/api/${kanal}/ws`);
      socket.onopen = () => { if (hidup) { percobaan = 0; keadaan.sambungan = 'terhubung'; beri(); } };
      socket.onmessage = event => {
        if (!hidup) return;
        try { const data = JSON.parse(event.data); if (!['pesan', 'baca', 'percakapan', 'koneksi', 'siap', 'dibersihkan'].includes(data.tipe)) return;
          if (data.tipe === 'dibersihkan') resetPesan(); void ringkas(); if (data.tipe !== 'baca') keadaan.revisi++;
          if (data.baru && !keadaan.pemberitahuan) { keadaan.pemberitahuan = true; clearTimeout(timerNotifikasi); timerNotifikasi = setTimeout(() => { keadaan.pemberitahuan = false; beri(); }, 5000); }
          beri(); if (terlihat()) void muat();
        } catch { /* Frame tak dikenal diabaikan. */ }
      };
      socket.onclose = event => { if (!hidup) return; keadaan.sambungan = 'terputus'; beri(); if (event.code !== 1008) timer = setTimeout(hubungkan, Math.min(30000, 1000 * 2 ** Math.min(percobaan++, 5))); };
      socket.onerror = () => {};
    }
    const kembali = () => { if (!document.hidden) refresh(); }; refresh(); hubungkan(); document.addEventListener('visibilitychange', kembali);
    return () => { hidup = false; clearTimeout(timer); socket?.close(); document.removeEventListener('visibilitychange', kembali); };
  }
  function penggunaBerubah() {
    const pengguna = sesiPengguna.potret().pengguna, izin = !!pengguna && !pengguna.wajib_ganti_kredensial && punyaIzin(pengguna, kanal, 'lihat');
    if (identitas === pengguna?.id && boleh === izin) return;
    putus?.(); generasi++; identitas = pengguna?.id; boleh = izin; keadaan = awal(); halaman = 1; clearTimeout(timerNotifikasi); beri();
    putus = boleh ? sambungkan() : undefined;
  }
  function salingTutup(event) { if (event.detail !== kanal && keadaan.terbuka) { keadaan.terbuka = false; beri(); } }
  function setTerbuka(v) { if (v) window.dispatchEvent(new CustomEvent('klira:buka-chat', { detail: kanal })); keadaan.terbuka = v; beri(); if (v) void muat(); }
  const aksi = { resetPesan, muat, setTerbuka,
    pilih(id) { keadaan.aktif = id; beri(); },
    bukaPasien(p) { keadaan.pasien = p; keadaan.aktif = null; setTerbuka(true); },
    batalPasien() { keadaan.pasien = null; beri(); },
    muatLagi() { halaman++; void muat(); },
    tulis(id, teks) { keadaan.draf = { ...keadaan.draf, [id]: teks }; beri(); },
  };
  return { potret: () => ({ ...keadaan, ...aksi }), langganan(f) { pendengar.add(f); return () => pendengar.delete(f); },
    mulai() { if (lepasSesi) return; window.addEventListener('klira:buka-chat', salingTutup); lepasSesi = sesiPengguna.langganan(penggunaBerubah); lepasNavigasi = navigasi.langganan(() => { if (boleh && terlihat()) void muat(); }); penggunaBerubah(); },
    tutup() { putus?.(); lepasSesi?.(); lepasNavigasi?.(); lepasSesi = lepasNavigasi = undefined; clearTimeout(timerNotifikasi); window.removeEventListener('klira:buka-chat', salingTutup); generasi++; pendengar.clear(); },
  };
}
