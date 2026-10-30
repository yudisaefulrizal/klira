import { useEffect, useRef, useState } from 'react';
import type { LayarPanggilanDto } from '@klira/shared';
import { PemilihPanggilanSuara, teksPanggilan } from './panggilan-suara';
import { bacaPreferensiSuara, simpanPreferensiSuara } from './preferensi-suara';

export function useSuaraPanggilan(data: LayarPanggilanDto | null, hariIni: string, fasilitas?: string) {
  const didukung = typeof window.speechSynthesis?.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function';
  const [aktif, setAktif] = useState(() => didukung && bacaPreferensiSuara(fasilitas));
  const [siap, setSiap] = useState(false);
  const [perluInteraksi, setPerluInteraksi] = useState(false);
  const [galatSuara, setGalatSuara] = useState('');
  const keadaan = useRef({ aktif: false, versi: 0, pemilih: new PemilihPanggilanSuara(), ucapan: new Set<SpeechSynthesisUtterance>(), batasMulai: undefined as ReturnType<typeof setTimeout> | undefined });

  // Cleanup dan galat hanya menghentikan pemutaran; pilihan tersimpan tetap mengikuti keputusan pengguna.
  function hentikan() {
    const k = keadaan.current;
    k.aktif = false; k.versi++;
    clearTimeout(k.batasMulai);
    if (didukung) window.speechSynthesis.cancel();
    k.ucapan.clear();
  }
  function gagal(versi: number, diblokir = false) {
    if (versi !== keadaan.current.versi) return;
    hentikan(); setAktif(false); setSiap(false); setPerluInteraksi(diblokir);
    setGalatSuara(diblokir ? 'Peramban belum mengizinkan suara otomatis. Ketuk layar sekali untuk mengaktifkan.' : 'Suara gagal diputar. Periksa suara perangkat, lalu aktifkan kembali.');
  }
  function ucap(teks: string) {
    const k = keadaan.current; const versi = k.versi;
    try {
      const ucapan = new SpeechSynthesisUtterance(teks);
      ucapan.lang = 'id-ID'; ucapan.rate = 0.9; ucapan.volume = 1;
      const suara = window.speechSynthesis.getVoices().find(v => /^id(?:-|$)/i.test(v.lang));
      if (suara) ucapan.voice = suara;
      ucapan.onstart = () => {
        if (versi !== k.versi || !k.aktif) return;
        clearTimeout(k.batasMulai); setSiap(true); setPerluInteraksi(false); setGalatSuara('');
      };
      ucapan.onend = () => { k.ucapan.delete(ucapan); };
      ucapan.onerror = e => {
        k.ucapan.delete(ucapan);
        if (e.error !== 'canceled' && e.error !== 'interrupted') gagal(versi, e.error === 'not-allowed');
      };
      k.ucapan.add(ucapan); window.speechSynthesis.speak(ucapan);
    } catch (e) { gagal(versi, e instanceof Error && e.name === 'NotAllowedError'); }
  }
  function bacakan(bawaan = false) {
    const k = keadaan.current;
    if (!k.aktif || !data) return 0;
    const daftar = bawaan || !data.event_panggilan.length
      ? data.panggilan_aktif ?? (data.panggilan ? [data.panggilan] : []) : data.event_panggilan;
    const baru = k.pemilih.baru(data.tanggal, hariIni, daftar);
    for (const p of baru) { if (k.aktif) ucap(teksPanggilan(p)); }
    return baru.length;
  }
  function mulai(otomatis = false) {
    if (!didukung) return;
    const k = keadaan.current;
    hentikan(); k.aktif = true; k.pemilih.reset(); k.pemilih.lewatiSampai(data?.kursor ?? 0);
    setAktif(true); setSiap(false); setPerluInteraksi(false); setGalatSuara('');
    const versi = k.versi;
    // Beberapa mesin tidak mengirim galat saat autoplay diblokir; jangan tampilkan status aktif palsu.
    k.batasMulai = setTimeout(() => gagal(versi, true), 8000);
    if (!bacakan(true)) ucap(otomatis ? 'Suara panggilan siap.' : 'Suara panggilan diaktifkan. Silakan menunggu nomor antrean Anda.');
  }
  function ubahSuara() {
    if (!didukung) return;
    if (keadaan.current.aktif) {
      simpanPreferensiSuara(fasilitas, false); hentikan(); setAktif(false); setSiap(false); setPerluInteraksi(false); setGalatSuara('');
    } else { simpanPreferensiSuara(fasilitas, true); mulai(); }
  }
  useEffect(() => {
    if (didukung && bacaPreferensiSuara(fasilitas)) mulai(true);
    return () => { hentikan(); };
  }, [fasilitas, didukung]);
  useEffect(() => { bacakan(); }, [data, hariIni]);
  useEffect(() => {
    if (!perluInteraksi) return;
    const pulihkan = (e: Event) => {
      if (!e.isTrusted || (e.target instanceof Element && e.target.closest('.lp-tombol-suara'))) return;
      if (e instanceof PointerEvent && e.button !== 0) return;
      if (e instanceof KeyboardEvent && ['Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(e.key)) return;
      if (bacaPreferensiSuara(fasilitas)) mulai(true);
    };
    document.addEventListener('pointerdown', pulihkan, true); document.addEventListener('keydown', pulihkan, true);
    return () => { document.removeEventListener('pointerdown', pulihkan, true); document.removeEventListener('keydown', pulihkan, true); };
  }, [perluInteraksi, fasilitas, data]);
  return { aktif, siap, perluInteraksi, didukung, galatSuara, ubahSuara };
}
