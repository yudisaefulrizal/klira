import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { punyaIzin, type PercakapanWaDto } from '@klira/shared';
import { percakapanWa, ringkasanWa } from '../../api-klien/whatsapp';
import { usePengguna } from '../../util/konteks-pengguna';
import { useNavigasi } from '../../util/navigasi';

type Pasien = { id: number; nama: string };
type Keadaan = {
  revisi: number;
  resetPesan: () => void;
  sambungan: 'menghubungkan' | 'terhubung' | 'terputus';
  terbuka: boolean;
  setTerbuka: (v: boolean) => void;
  aktif: number | null;
  pilih: (id: number | null) => void;
  pasien: Pasien | null;
  bukaPasien: (p: Pasien) => void;
  batalPasien: () => void;
  daftar: PercakapanWaDto[];
  muat: () => Promise<void>;
  muatLagi: () => void;
  adaLagi: boolean;
  belum: number;
  pemberitahuan: boolean;
  galat: string;
  draf: Record<number, string>;
  tulis: (id: number, teks: string) => void;
};
const Konteks = createContext<Keadaan | null>(null);
export function usePesan() {
  const v = useContext(Konteks);
  if (!v) throw new Error('PenyediaPesan belum dipasang');
  return v;
}
export function PenyediaPesan({ children }: { children: ReactNode }) {
  const { pengguna } = usePengguna();
  const { path } = useNavigasi();
  const boleh = !!pengguna && !pengguna.wajib_ganti_kredensial && punyaIzin(pengguna, 'whatsapp', 'lihat');
  const [terbuka, setTerbukaAsli] = useState(false);
  const setTerbuka = useCallback((v: boolean) => {
    if (v) window.dispatchEvent(new CustomEvent('klira:buka-chat', { detail: 'whatsapp' }));
    setTerbukaAsli(v);
  }, []);
  useEffect(() => {
    const tutup = (event: Event) => {
      if ((event as CustomEvent).detail !== 'whatsapp') setTerbukaAsli(false);
    };
    window.addEventListener('klira:buka-chat', tutup);
    return () => window.removeEventListener('klira:buka-chat', tutup);
  }, []);
  const [aktif, pilih] = useState<number | null>(null);
  const [pasien, setPasien] = useState<Pasien | null>(null);
  const [daftar, setDaftar] = useState<PercakapanWaDto[]>([]);
  const [belum, setBelum] = useState(0);
  const [pemberitahuan, setPemberitahuan] = useState(false);
  const [galat, setGalat] = useState('');
  const [draf, setDraf] = useState<Record<number, string>>({});
  const [revisi, setRevisi] = useState(0);
  const [revisiDaftar, setRevisiDaftar] = useState(0);
  const [sambungan, setSambungan] = useState<'menghubungkan' | 'terhubung' | 'terputus'>('menghubungkan');
  const [halaman, setHalaman] = useState(1);
  const [adaLagi, setAdaLagi] = useState(false);
  const generasiDaftar = useRef(0);
  const resetPesan = useCallback(() => {
    generasiDaftar.current += 1;
    setGalat('');
    pilih(null);
    setDraf({});
    setDaftar([]);
    setHalaman(1);
    setAdaLagi(false);
    setBelum(0);
    setPemberitahuan(false);
    setRevisi((v) => v + 1);
    setRevisiDaftar((v) => v + 1);
  }, []);
  const identitas = useRef(pengguna?.id);
  identitas.current = pengguna?.id;
  const muat = useCallback(async () => {
    if (!boleh) return;
    const generasi = generasiDaftar.current;
    try {
      const bagian = await Promise.all(Array.from({ length: halaman }, (_, i) => percakapanWa(i + 1)));
      const rows = bagian.flat();
      if (identitas.current !== pengguna?.id || generasi !== generasiDaftar.current) return;
      setDaftar(rows);
      setAdaLagi(bagian.at(-1)?.length === 200);
      setGalat('');
    } catch (e) {
      if (identitas.current !== pengguna?.id || generasi !== generasiDaftar.current) return;
      setGalat(e instanceof Error ? e.message : 'Gagal memuat pesan');
    }
  }, [boleh, pengguna?.id, halaman]);
  useEffect(() => {
    setTerbuka(false);
    pilih(null);
    setPasien(null);
    setDaftar([]);
    setHalaman(1);
    setAdaLagi(false);
    setBelum(0);
    setDraf({});
    setRevisi(0);
    setRevisiDaftar(0);
    setPemberitahuan(false);
  }, [pengguna?.id, boleh]);
  useEffect(() => {
    if (!boleh) return;
    let hidup = true;
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let percobaan = 0;
    const ringkas = async () => {
      const generasi = generasiDaftar.current;
      try {
        const hasil = await ringkasanWa();
        if (hidup && generasi === generasiDaftar.current) setBelum(hasil.belum_dibaca);
      } catch {
        /* Galat rinci ditampilkan saat panel dibuka. */
      }
    };
    const refresh = () => {
      void ringkas();
      setRevisi((v) => v + 1);
      setRevisiDaftar((v) => v + 1);
    };
    const hubungkan = () => {
      if (!hidup) return;
      setSambungan('menghubungkan');
      const protokol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protokol}//${window.location.host}/api/whatsapp/ws`);
      socket.onopen = () => {
        if (hidup) {
          percobaan = 0;
          setSambungan('terhubung');
        }
      };
      socket.onmessage = (event) => {
        if (!hidup) return;
        try {
          const data = JSON.parse(event.data) as { tipe: string; baru?: boolean };
          if (!['pesan', 'baca', 'percakapan', 'koneksi', 'siap', 'dibersihkan'].includes(data.tipe)) return;
          if (data.tipe === 'dibersihkan') resetPesan();
          void ringkas();
          setRevisiDaftar((v) => v + 1);
          if (data.tipe !== 'baca') setRevisi((v) => v + 1);
          if (data.baru) setPemberitahuan(true);
        } catch {
          /* Abaikan frame tak dikenal. */
        }
      };
      socket.onclose = (event) => {
        if (!hidup) return;
        setSambungan('terputus');
        if (event.code === 1008) return;
        timer = setTimeout(hubungkan, Math.min(30000, 1000 * 2 ** Math.min(percobaan++, 5)));
      };
      socket.onerror = () => {
        /* onclose menangani penyambungan ulang. */
      };
    };
    const kembali = () => {
      if (!document.hidden) refresh();
    };
    refresh();
    hubungkan();
    document.addEventListener('visibilitychange', kembali);
    return () => {
      hidup = false;
      clearTimeout(timer);
      socket?.close();
      document.removeEventListener('visibilitychange', kembali);
    };
  }, [boleh, pengguna?.id, resetPesan]);
  useEffect(() => {
    if (!boleh || !(terbuka || path === '/pesan')) return;
    void muat();
  }, [boleh, terbuka, path, muat, revisiDaftar]);
  useEffect(() => {
    if (!pemberitahuan) return;
    const timer = setTimeout(() => setPemberitahuan(false), 5000);
    return () => clearTimeout(timer);
  }, [pemberitahuan]);
  return (
    <Konteks.Provider
      value={{
        revisi,
        resetPesan,
        sambungan,
        terbuka,
        setTerbuka,
        aktif,
        pilih,
        pasien,
        bukaPasien: (p) => {
          setPasien(p);
          pilih(null);
          setTerbuka(true);
        },
        batalPasien: () => setPasien(null),
        daftar,
        muat,
        muatLagi: () => setHalaman((v) => v + 1),
        adaLagi,
        belum,
        pemberitahuan,
        galat,
        draf,
        tulis: (id, teks) => setDraf((v) => ({ ...v, [id]: teks })),
      }}
    >
      {children}
    </Konteks.Provider>
  );
}
