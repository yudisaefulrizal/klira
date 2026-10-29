import { useEffect, useRef, useState } from 'react';
import type { LayarPanggilanDto } from '@klira/shared';
import { PemilihPanggilanSuara, teksPanggilan } from './panggilan-suara';

export function useSuaraPanggilan(data: LayarPanggilanDto | null, hariIni: string) {
  const didukung = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const [aktif, setAktif] = useState(false);
  const [galatSuara, setGalatSuara] = useState('');
  const keadaan = useRef({ aktif: false, versi: 0, pemilih: new PemilihPanggilanSuara(), ucapan: new Set<SpeechSynthesisUtterance>() });

  function hentikan() {
    const k = keadaan.current;
    k.aktif = false;
    k.versi++;
    if (didukung) window.speechSynthesis.cancel();
    k.ucapan.clear();
  }
  function ucap(teks: string) {
    const k = keadaan.current;
    const versi = k.versi;
    const gagal = () => {
      if (versi !== k.versi) return;
      hentikan();
      setAktif(false);
      setGalatSuara('Suara gagal diputar. Periksa suara perangkat, lalu aktifkan kembali.');
    };
    try {
      const ucapan = new SpeechSynthesisUtterance(teks);
      ucapan.lang = 'id-ID';
      ucapan.rate = 0.9;
      ucapan.volume = 1;
      const suara = window.speechSynthesis.getVoices().find(v => /^id(?:-|$)/i.test(v.lang));
      if (suara) ucapan.voice = suara;
      ucapan.onend = () => { k.ucapan.delete(ucapan); };
      ucapan.onerror = e => {
        k.ucapan.delete(ucapan);
        if (e.error !== 'canceled' && e.error !== 'interrupted') gagal();
      };
      k.ucapan.add(ucapan);
      window.speechSynthesis.speak(ucapan);
    } catch { gagal(); }
  }
  function bacakan(bawaan = false) {
    const k = keadaan.current;
    if (!k.aktif || !data) return 0;
    const daftar = bawaan || !data.event_panggilan.length
      ? data.panggilan_aktif ?? (data.panggilan ? [data.panggilan] : [])
      : data.event_panggilan;
    const baru = k.pemilih.baru(data.tanggal, hariIni, daftar);
    for (const p of baru) { if (k.aktif) ucap(teksPanggilan(p)); }
    return baru.length;
  }
  function ubahSuara() {
    if (!didukung) return;
    if (keadaan.current.aktif) { hentikan(); setAktif(false); return; }
    keadaan.current.aktif = true;
    keadaan.current.pemilih.reset();
    keadaan.current.pemilih.lewatiSampai(data?.kursor ?? 0);
    setGalatSuara('');
    setAktif(true);
    // speak dipanggil langsung dari klik agar memenuhi kebijakan aktivasi pengguna.
    if (!bacakan(true)) ucap('Suara panggilan diaktifkan. Silakan menunggu nomor antrean Anda.');
  }
  useEffect(() => { bacakan(); }, [data, hariIni]);
  useEffect(() => () => { hentikan(); }, []);
  return { aktif, didukung, galatSuara, ubahSuara };
}
