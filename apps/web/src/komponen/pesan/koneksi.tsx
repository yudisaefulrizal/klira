import { usePesan } from './konteks-pesan';
import { useEffect, useState } from 'react';
import { punyaIzin, type KoneksiWaDto } from '@klira/shared';
import { aksiKoneksiWa, koneksiWa } from '../../api-klien/whatsapp';
import { usePengguna } from '../../util/konteks-pengguna';
import { token } from '../../gaya/token';
import { Kolom } from '../ui/susunan';
import { Tombol } from '../ui/tombol';
import { Peringatan } from '../ui/peringatan';
export function KoneksiWhatsapp() {
  const { pengguna } = usePengguna();
  const { revisi } = usePesan();
  const [koneksi, setKoneksi] = useState<KoneksiWaDto | null>(null);
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(false);
  const boleh = !!pengguna && punyaIzin(pengguna, 'whatsapp', 'lihat');
  useEffect(() => {
    let hidup = true;
    const muat = async () => {
      try {
        const v = await koneksiWa();
        if (hidup) {
          setKoneksi(v);
          setGalat('');
        }
      } catch (e) {
        if (hidup) setGalat(e instanceof Error ? e.message : 'Gagal membaca koneksi');
      }
    };
    void muat();
    return () => { hidup = false; };
  }, [revisi]);
  async function aksi(a: 'hubungkan' | 'putuskan') {
    if (a === 'putuskan' && koneksi?.status === 'terhubung' && !window.confirm('Keluar dari WhatsApp?')) return;
    setSibuk(true);
    try {
      await aksiKoneksiWa(a);
      setKoneksi(await koneksiWa());
      setGalat('');
    } catch (e) {
      setGalat(e instanceof Error ? e.message : 'Gagal mengubah koneksi');
    } finally {
      setSibuk(false);
    }
  }
  const label: Record<string, string> = {
    terhubung: 'Terhubung', terputus: 'Terputus', menghubungkan: 'Menghubungkan…', qr: 'Pindai QR',
  };
  const aktif = koneksi?.status === 'terhubung';
  const menunggu = koneksi?.status === 'qr' || koneksi?.status === 'menghubungkan';
  return (
    <Kolom jarak="sm">
      <div className="wa-akun">
        <span className="wa-akun-status" data-aktif={aktif}>
          <i aria-hidden="true" />
          <span><strong>{koneksi?.nomor ? `+${koneksi.nomor}` : 'WhatsApp'}</strong>
            <small>{label[koneksi?.status ?? ''] ?? 'Memuat…'}</small></span>
        </span>
        {boleh && <Tombol varian={aktif || menunggu ? 'sekunder' : 'utama'}
          disabled={sibuk || !koneksi}
          onClick={() => void aksi(aktif || menunggu ? 'putuskan' : 'hubungkan')}>
          {sibuk ? 'Sebentar…' : aktif ? 'Keluar' : menunggu ? 'Batal' : 'Masuk'}
        </Tombol>}
      </div>
      {galat && <Peringatan nada="merah">{galat}</Peringatan>}
      {koneksi?.qr && <div className="wa-akun-qr">
        <img src={koneksi.qr} alt="QR WhatsApp" style={{ width: token.ukuran.qrWhatsapp, maxWidth: '100%' }} />
        <small>WhatsApp → Perangkat tertaut → Tautkan perangkat</small>
      </div>}
    </Kolom>
  );
}
