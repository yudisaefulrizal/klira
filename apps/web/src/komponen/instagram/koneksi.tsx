import { useEffect, useState } from 'react';
import type { KoneksiInstagramDto } from '@klira/shared';
import { panggilApi } from '../../api-klien/klien';
import { koneksiWa } from '../../api-klien/instagram';
import { usePesan } from './konteks-pesan';
import { useNavigasi } from '../../util/navigasi';
import { Kolom } from '../ui/susunan';
import { Tombol } from '../ui/tombol';
import { Peringatan } from '../ui/peringatan';
const hasilLogin: Record<string, string> = {
  dibatalkan: 'Login Instagram dibatalkan.',
  state: 'Login kedaluwarsa. Coba lagi.',
  izin: 'Izin berubah. Silakan masuk kembali.',
  'akun-berbeda': 'Gunakan akun Instagram sebelumnya.',
  gagal: 'Gagal masuk. Coba lagi.',
};
export function KoneksiInstagram() {
  const { revisi } = usePesan();
  const { search } = useNavigasi();
  const hasil = new URLSearchParams(search).get('instagram');
  const [koneksi, setKoneksi] = useState<KoneksiInstagramDto | null>(null);
  const [galat, setGalat] = useState(''); const [sibuk, setSibuk] = useState(false);
  useEffect(() => {
    let hidup = true;
    void koneksiWa().then((v) => { if (hidup) setKoneksi(v); }).catch((e) => { if (hidup) setGalat(e.message); });
    return () => { hidup = false; };
  }, [revisi]);
  async function jalankan(fn: () => Promise<void>) {
    setSibuk(true); setGalat('');
    try { await fn(); } catch (e) { setGalat(e instanceof Error ? e.message : 'Gagal menghubungkan Instagram'); } finally { setSibuk(false); }
  }
  const aktif = koneksi?.status === 'terhubung';
  return <Kolom jarak="sm">
    <div className="wa-akun">
      <span className="wa-akun-status" data-aktif={aktif}>
        <i aria-hidden="true" />
        <span><strong>{koneksi?.nomor ? `@${koneksi.nomor.replace(/^@/, '')}` : 'Instagram'}</strong>
          <small>{!koneksi ? 'Memuat…' : aktif ? 'Terhubung' : 'Terputus'}</small></span>
      </span>
      <Tombol varian={aktif ? 'sekunder' : 'utama'} disabled={sibuk || !koneksi?.dikonfigurasi} onClick={() => {
        if (aktif) {
          if (window.confirm('Keluar dari Instagram?')) void jalankan(async () => {
            await panggilApi('POST', '/instagram/koneksi', { aksi: 'putuskan' });
            setKoneksi(await koneksiWa());
          });
        } else void jalankan(async () => {
          const { url } = await panggilApi<{ url: string }>('POST', '/instagram/login');
          const target = new URL(url);
          if (target.protocol !== 'https:' || target.hostname !== 'www.instagram.com') throw new Error('Alamat login Instagram tidak valid.');
          window.location.assign(target.href);
        });
      }}>{sibuk ? 'Sebentar…' : aktif ? 'Keluar' : 'Masuk'}</Tombol>
    </div>
    {hasil && hasilLogin[hasil] && <Peringatan nada="merah">{hasilLogin[hasil]}</Peringatan>}
    {galat && <Peringatan nada="merah">{galat}</Peringatan>}
    {koneksi && !koneksi.dikonfigurasi && <Peringatan nada="biru">Instagram belum disiapkan. Hubungi admin.</Peringatan>}
  </Kolom>;
}
